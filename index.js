import { createReadStream } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import { join, normalize, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const name = 'deepseek-genui';
export const inject = {
  webServer: { optional: true },
  skills: { optional: true },
};

const vendorRoot = fileURLToPath(new URL('./vendor/', import.meta.url));

export async function apply(ctx) {
  // 1. 注册 DSH Agent Skill 认知协议
  try {
    const skillPath = new URL('./skills/agent-genui/SKILL.md', import.meta.url);
    const skillText = await readFile(skillPath, 'utf8');
    const content = skillText.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
    ctx.effect(() => ctx.skills?.register({
      name: 'agent-genui',
      description: '生成基于 ```agent-genui 协议的高保真、交互式卡片、图表与架构可视化界面组件（GenUI），聊天对话流将自动将其就地渲染为活体卡片。',
      whenToUse: '当用户要求生成 GenUI 卡片、交互组件、数据大屏、指标看板、流程图、架构拓扑、时序图、生命周期状态机、交互表单、方案对比或需要以可视化界面呈现分析结果时使用。',
      source: 'bundled',
      content,
    }));
  } catch {
    // 容错处理：即使读取 skill 异常也不影响其余服务
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
