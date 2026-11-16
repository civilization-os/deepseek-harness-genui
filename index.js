import { createReadStream } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import { join, normalize, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const name = 'deepseek-genui';
export const inject = {
  webServer: { optional: true },
  skills: { optional: true },
  systemPrompt: { optional: true },
};

const vendorRoot = fileURLToPath(new URL('./vendor/', import.meta.url));

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

  // 2. 向模型注入常驻 Generative UI 认知，免去调用 skill 工具的额外轮次阻塞
  if (ctx.systemPrompt) {
    ctx.effect(() => ctx.systemPrompt.section({
      name: 'agent-genui-guidance',
      order: ctx.systemPrompt.getSectionOrder?.('STRUCTURED_OUTPUT') ?? 9900,
      text: `
## 可视化交互卡片 (Generative UI) 协议
当回复中需要展示以下场景时，**优先输出包裹在 \`\`\`agent-genui 代码块中的结构化 JSON**，聊天界面会自动将其就地渲染为高保真活体交互卡片，严禁仅使用纯文本或 ASCII 字符画替代：
1. **指标与趋势图表**：KPI 指标看板（type: "metric"）、数据图表（type: "chart"，chartType 支持 "line" | "bar" | "area" | "pie" | "donut" | "heatmap" | "gauge"）；
2. **架构拓扑与流程**：服务分层架构（type: "diagram", diagramType: "architecture"）、流程图（diagramType: "flowchart"）、时序交互图（diagramType: "sequence"）；
3. **方案对比决策**：方案多维评分对比与采纳（type: "comparison"）；
4. **数据表格与代码变更**：数据列表（type: "table"）、代码变更比对（type: "diffViewer" 或 "diff"）、任务流水线（type: "taskPlan"）。

输出格式规范：
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
