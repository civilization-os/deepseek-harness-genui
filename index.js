import { createReadStream } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import { join, normalize, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const name = 'deepseek-genui';
export const inject = {
  webServer: { optional: true },
  skills: { optional: true },
  systemPrompt: { optional: true },
  tools: { optional: true },
};

const vendorRoot = fileURLToPath(new URL('./vendor/', import.meta.url));

/**
 * 校验模型输入的 GenUI DSL 数据结构
 */
function validateGenuiDSL(raw) {
  if (!raw) {
    return { valid: false, error: '输入内容为空', errorType: 'EMPTY_INPUT', path: 'root' };
  }
  let dsl = raw;
  if (typeof raw === 'string') {
    let text = raw.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```[a-zA-Z0-9_-]*\r?\n/, '').replace(/\r?\n```\s*$/, '').trim();
    }
    // 基础清洗：去除尾部逗号、单引号纠正
    text = text.replace(/,(\s*[}\]])/g, '$1');
    try {
      dsl = JSON.parse(text);
    } catch (err) {
      return {
        valid: false,
        error: 'JSON 语法解析错误: ' + err.message,
        errorType: 'JSON_SYNTAX_ERROR',
        path: 'JSON 语法'
      };
    }
  }

  if (typeof dsl !== 'object' || dsl === null || Array.isArray(dsl)) {
    return { valid: false, error: 'DSL 顶层必须为一个 Object 对象', errorType: 'INVALID_ROOT', path: 'root' };
  }
  if (dsl.protocol && dsl.protocol !== 'agent-genui') {
    return { valid: false, error: `不支持的协议标识 "${dsl.protocol}"，必须为 "agent-genui"`, errorType: 'UNSUPPORTED_PROTOCOL', path: 'protocol' };
  }
  if (!Array.isArray(dsl.children) || dsl.children.length === 0) {
    return { valid: false, error: '缺失关键字段 children 或 children 数组为空', errorType: 'MISSING_CHILDREN', path: 'children' };
  }

  for (let i = 0; i < dsl.children.length; i++) {
    const node = dsl.children[i];
    const path = `children[${i}]`;
    if (!node || typeof node !== 'object') {
      return { valid: false, error: `节点 #${i} 格式非法，必须为 Object`, errorType: 'INVALID_NODE', path };
    }
    if (!node.type) {
      return { valid: false, error: `节点 #${i} 缺少组件类型 type`, errorType: 'MISSING_NODE_TYPE', path: `${path}.type` };
    }
    if (node.type === 'chart' && !node.props?.series && !node.props?.data) {
      return { valid: false, error: `chart 组件 (${node.id || i}) 缺少必要的数据 series 数组`, errorType: 'CHART_MISSING_DATA', path: `${path}.props.series` };
    }
    if (node.type === 'diagram' && !node.props?.dsl && !node.props?.nodes && !node.props?.code && !node.props?.diagramType) {
      return { valid: false, error: `diagram 组件 (${node.id || i}) 缺少拓扑或图表描述数据`, errorType: 'DIAGRAM_MISSING_CONTENT', path: `${path}.props.dsl` };
    }
  }

  return { valid: true, error: null, dsl };
}

export async function apply(ctx) {
  // 1. 注册 DSH Agent Skill 认知协议（按需备用）
  try {
    const skillPath = new URL('./skills/agent-genui/SKILL.md', import.meta.url);
    const skillText = await readFile(skillPath, 'utf8');
    const content = skillText.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
    ctx.effect(() => ctx.skills?.register({
      name: 'agent-genui',
      description: '图表可视化与交互组件引擎。生成基于 agent-genui 协议的高保真、交互式卡片、图表与架构可视化界面组件（GenUI），聊天对话流将自动就地渲染。',
      whenToUse: '当需要生成数据大屏、指标看板、趋势图表、流程图、架构拓扑、时序图、生命周期状态机、交互表单、方案对比或需要以可视化界面呈现时使用。',
      source: 'bundled',
      content,
    }));
  } catch {
    // 容错处理：即使读取 skill 异常也不影响其余服务
  }

  // 2. 向模型注入常驻 Generative UI 认知与输入校验重试协议
  if (ctx.systemPrompt) {
    ctx.effect(() => ctx.systemPrompt.section({
      name: 'agent-genui-guidance',
      order: ctx.systemPrompt.getSectionOrder?.('STRUCTURED_OUTPUT') ?? 9900,
      text: `
## 可视化交互卡片 (Generative UI) 协议与输入校验
当回复中需要展示以下场景时，**优先输出包裹在 \`\`\`agent-genui 代码块中的结构化 JSON**，聊天界面会自动对模型输入执行**严格校验**并就地渲染为高保真活体交互卡片，严禁仅使用纯文本或 ASCII 字符画替代：
1. **指标与趋势图表**：KPI 指标看板（type: "metric"）、数据图表（type: "chart"，chartType 支持 "line" | "bar" | "area" | "pie" | "donut" | "heatmap" | "gauge"）；
2. **架构拓扑与流程**：服务分层架构（type: "diagram", diagramType: "architecture"）、流程图（diagramType: "flowchart"）、时序交互图（diagramType: "sequence"）；
3. **方案对比决策**：方案多维评分对比与采纳（type: "comparison"）；
4. **数据表格与代码变更**：数据列表（type: "table"）、代码变更比对（type: "diffViewer" 或 "diff"）、任务流水线（type: "taskPlan"）。

### 模型输入校验与 3 次有界重试规则（Model Input Validation & Bounded Retry）：
1. **输入语法规范**：必须输出完整闭合、无未闭合括号、无末尾多余逗号、无单引号的合法 JSON，严格包裹在 \`\`\`agent-genui\`\`\` 代码块中；
2. **顶层字段契约**：必须包含 protocol: "agent-genui", version: "1.0", id: "...", layout: { type: "stack"|"grid" }, children: [...]；
3. **节点数据契约**：children 中每个节点必须有稳定 id、合法 type 和有效 props；图表必须提供 series 数据，架构图必须提供拓扑描述；
4. **解析失败重试**：若模型输入的数据系统解析失败（语法畸变、字段缺失或组件不合规），系统将向你返回精准报错定位并**触发重试（最多支持重试 3 次）**。接收到重试请求时，请针对报错精确定位并直接重新输出修正后的完整代码块。

输出格式规范示例：
先输出 1-2 句核心分析结论，紧接着输出代码块：
\`\`\`agent-genui
{
  "protocol": "agent-genui",
  "version": "1.0",
  "id": "ui_card_id",
  "title": "卡片标题",
  "layout": { "type": "stack", "gap": "md" },
  "children": [
    {
      "id": "node_1",
      "type": "metric",
      "props": { "title": "指标名称", "value": "12,480", "unit": "req/s", "change": "+18.2%", "changeType": "up" }
    }
  ]
}
\`\`\`
`.trim(),
    }), 'genui.systemPrompt()');
  }

  // 3. 注册可选模型工具 genui_validate（当宿主提供 tools 注入时）
  if (ctx.tools) {
    const sessionRetryTracker = new Map();
    try {
      const { defineTool } = await import('@deepseek-ai/dsh-tools');
      ctx.effect(() => ctx.tools.register(defineTool({
        name: 'genui_validate',
        description: '校验 agent-genui 可视化组件 JSON 描述数据。若数据格式错误或缺少必填字段，将返回具体的错误定位与修复指导，并支持模型最多重试 3 次。',
        parameters: {
          dsl: { type: 'string', required: true, description: '被校验的 agent-genui JSON 描述字符串' }
        },
        output: {
          schema: { type: 'object', additionalProperties: true, properties: {} },
          render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
        },
        async execute(args, exec) {
          const sessionId = exec?.agent?.session?.id || 'default';
          const res = validateGenuiDSL(args.dsl);
          if (res.valid) {
            sessionRetryTracker.delete(sessionId);
            return { valid: true, summary: 'GenUI DSL 校验通过，符合 agent-genui 1.0 协议规范。' };
          }
          const prevRetries = sessionRetryTracker.get(sessionId) || 0;
          const current = prevRetries + 1;
          sessionRetryTracker.set(sessionId, current);
          if (current <= 3) {
            return {
              valid: false,
              error: res.error,
              errorType: res.errorType,
              path: res.path,
              retryAttempt: current,
              maxRetries: 3,
              canRetry: true,
              instruction: `【模型输入校验失败 - 第 ${current}/3 次重试】：${res.error}。请根据错误定位修改后重新输出合规的 agent-genui 代码块。`,
            };
          }
          return {
            valid: false,
            error: res.error,
            retryAttempt: current,
            maxRetries: 3,
            canRetry: false,
            instruction: '已达到最大重试次数 (3/3 次)，停止重试。请降级为普通 Markdown 格式呈现。',
          };
        }
      })));
    } catch (_) {}
  }

  // 2. 托管本地 Mermaid 等离线静态 Vendor 资源
  if (ctx.webServer) {
    ctx.effect(() => ctx.webServer.register({
      kind: 'prefix',
      path: '/deepseek-genui/vendor',
      handler: async (req, res) => {
        try {
          const url = new URL(req.url || '/', 'http://localhost');
          const prefix = '/deepseek-genui/vendor';
          const requested = decodeURIComponent(url.pathname.slice(prefix.length)).replace(/^[/\\]+/, '') || 'mermaid.min.js';
          const candidate = normalize(join(vendorRoot, requested));
          const rel = relative(vendorRoot, candidate);
          if (rel.startsWith('..') || rel.includes(`..${sep}`)) {
            res.statusCode = 403;
            return res.end('Forbidden');
          }
          const info = await stat(candidate);
          if (!info.isFile()) {
            res.statusCode = 404;
            return res.end('Not found');
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Content-Length', info.size);
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          createReadStream(candidate).pipe(res);
        } catch {
          res.statusCode = 404;
          res.end('Not found');
        }
      },
    }));
  }
}
