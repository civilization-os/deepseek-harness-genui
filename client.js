/**
 * Browser half of `@civilization/deepseek-genui`.
 *
 * Implements the Agent GenUI Runtime specified in `agent-genui-system-design.md`:
 *   - 100% Native DSH Unified UI design tokens (--dsw-alias-*)
 *   - Automatic theme adaptation (Light / Dark mode) with zero hardcoded black/gray boxes
 *   - Comprehensive 20+ charts, architecture diagrams, sequence flows, ER tables & Agent task plans
 *   - Categorized Tab navigation with tactile spring feedback and event stream console
 */
window.__ModuleLoader__.load({
  id: '@civilization/deepseek-genui',
  factory(require) {
    const React = require('react');
    const { useState, useEffect, useMemo, useCallback, useRef } = React;
    const h = React.createElement;

    let ReactDOM = null;
    let createRoot = null;
    try {
      ReactDOM = require('react-dom');
      if (ReactDOM && ReactDOM.createRoot) createRoot = ReactDOM.createRoot;
    } catch (_) {}
    if (!createRoot) {
      try {
        const ReactDOMClient = require('react-dom/client');
        if (ReactDOMClient && ReactDOMClient.createRoot) createRoot = ReactDOMClient.createRoot;
      } catch (_) {}
    }
    if (!ReactDOM && typeof window !== 'undefined' && window.ReactDOM) {
      ReactDOM = window.ReactDOM;
      if (ReactDOM.createRoot) createRoot = ReactDOM.createRoot;
    }

    const NS = 'deepseek-genui';
    const PANEL_ID = 'deepseek-genui';
    const STORAGE_CONFIG_KEY = 'dsh_genui_runtime_config';

    /** Default Runtime Configuration */
    const DEFAULT_CONFIG = {
      chatInPlaceEnabled: true,
      autoRepairEnabled: true,
      maxRepairAttempts: 2,
      strictMode: false,
      maxNodesLimit: 50,
      maxDslBytes: 128 * 1024,
      enforceUrlWhitelist: true,
      actionAllowlistCheck: true,
      enableVisualEngines: true,
      logEvents: true,
    };

    /** English strings */
    const en = {
      panel: 'GenUI',
      'page.title': 'Agent GenUI Runtime',
      'page.description': 'Declarative and interactive Generative UI runtime unified with DSH design system.',
      'tabs.settings': 'Settings',
      'tabs.preview': 'Feature Preview & Catalog',
      'settings.title': 'Runtime Configuration',
      'settings.subtitle': 'Control validation policies, self-healing limits, and engine capabilities.',
      'settings.save': 'Save Configuration',
      'settings.reset': 'Reset Defaults',
      'settings.saved.toast': 'Configuration saved successfully.',
      'preview.title': 'GenUI Component Catalog & Playground',
      'preview.subtitle': 'Browse categorized charts, diagrams and UI elements. Edit DSL in realtime to preview rendering.',
      'preview.editor.title': 'JSON UI DSL',
      'preview.editor.format': 'Format',
      'preview.editor.reset': 'Reset Template',
      'preview.canvas.title': 'Live Canvas',
      'preview.events.title': 'Event Stream Console',
      'preview.events.clear': 'Clear Log',
      'preview.events.empty': 'No events triggered yet. Interact with the form, table, or tasks above.',
      'cat.charts': 'Data Charts',
      'cat.diagrams': 'Architecture & Diagrams',
      'cat.agent': 'Agent & Task Flow',
      'cat.forms': 'Forms & Data Grids',
      'cat.healing': 'Self-Healing & Fallback',
    };

    /** Simplified Chinese strings */
    const zh = {
      panel: 'GenUI',
      'page.title': 'Agent GenUI 运行时',
      'page.description': '面向 Agent 对话产品的声明式、全图表与架构可视化支持的生成式界面运行时。',
      'tabs.settings': '设置',
      'tabs.preview': '功能与图表预览',
      'settings.title': 'Runtime 运行配置',
      'settings.subtitle': '配置校验策略、自愈重试上限、安全白名单及组件渲染引擎能力。',
      'settings.save': '保存配置',
      'settings.reset': '恢复默认',
      'settings.saved.toast': '配置已成功保存并即时生效。',
      'preview.title': 'GenUI 组件库与交互沙箱',
      'preview.subtitle': '按类别浏览统计图表、架构拓扑、时序图、Agent 任务流与通用表单，实时编辑与交互。',
      'preview.editor.title': 'JSON UI 描述（DSL）',
      'preview.editor.format': '格式化',
      'preview.editor.reset': '重置模板',
      'preview.canvas.title': '实时渲染画布 (Live Canvas)',
      'preview.events.title': '交互事件审计总线',
      'preview.events.clear': '清空日志',
      'preview.events.empty': '暂无事件。请在上方表单、表格、图表或任务中点击交互体验。',
      'cat.charts': '📊 统计数据可视化',
      'cat.diagrams': '🔀 架构拓扑与关系图',
      'cat.agent': '🤖 Agent 与任务流',
      'cat.forms': '📝 交互表单与数据网格',
      'cat.healing': '🛡️ 异常自愈与容错',
    };

    /**
     * DSH Native Design System Stylesheet:
     * - Uses exclusively official `--dsw-alias-*` theme tokens
     * - Perfectly matches Light / Dark host mode with zero disjointed black/gray blocks
     * - Smooth micro-animations (transform .16s ease, hover lift)
     */
    const PAGE_CSS = [
      /* Page Shell */
      '.dgen-page{box-sizing:border-box;height:100%;display:flex;flex-direction:column;align-items:center;overflow:auto;padding:0 clamp(24px,4vw,48px) 48px;color:var(--dsw-alias-label-primary);font:inherit}',
      '.dgen-page>*{width:100%;max-width:1080px}',
      '.dgen-head{box-sizing:border-box;padding-top:28px;display:flex;flex-direction:column;gap:6px}',
      '[data-platform=darwin] .dgen-head{padding-top:calc(28px + var(--dsh-frame-top-clearance,0px))}',
      '.dgen-title-row{display:flex;align-items:center;gap:12px}',
      '.dgen-title{margin:0;font-size:22px;font-weight:650;letter-spacing:-.4px;color:var(--dsw-alias-label-primary)}',
      '.dgen-version-badge{font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 12%,transparent);color:var(--dsw-alias-brand-primary,#3b82f6);border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 35%,var(--dsw-alias-border-l4))}',
      '.dgen-intro{margin:0;font-size:13px;line-height:1.55;color:var(--dsw-alias-label-secondary)}',

      /* Top Primary Tabs */
      '.dgen-tabs{box-sizing:border-box;display:flex;align-items:center;gap:8px;margin-top:20px;border-bottom:1px solid var(--dsw-alias-border-l4)}',
      '.dgen-tab{position:relative;display:inline-flex;align-items:center;gap:8px;padding:8px 16px 11px;background:transparent;border:none;font-size:14px;font-weight:500;color:var(--dsw-alias-label-secondary);cursor:pointer;transition:color .16s ease}',
      '.dgen-tab:hover{color:var(--dsw-alias-label-primary)}',
      '.dgen-tab.dgen-tab-active{color:var(--dsw-alias-brand-primary,#3b82f6);font-weight:650}',
      '.dgen-tab.dgen-tab-active::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--dsw-alias-brand-primary,#3b82f6);border-radius:2px 2px 0 0}',

      /* Category Subtabs (DSH Standard Filter Pattern) */
      '.dgen-subtabs{display:flex;padding:3px;border:1px solid var(--dsw-alias-border-l4);border-radius:10px;background:var(--dsw-alias-bg-layer-1);overflow-x:auto;gap:2px;margin-bottom:12px}',
      '.dgen-subtab{padding:6px 14px;border:0;background:transparent;border-radius:8px;color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;cursor:pointer;transition:all .16s ease;white-space:nowrap}',
      '.dgen-subtab:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.dgen-subtab.active{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600;box-shadow:0 1px 4px color-mix(in srgb,var(--dsw-alias-label-primary) 9%,transparent)}',

      /* Preset Chips */
      '.dgen-preset-bar{display:flex;align-items:center;gap:8px;overflow-x:auto;padding-bottom:12px;margin-bottom:16px;border-bottom:1px solid var(--dsw-alias-border-l4)}',
      '.dgen-preset-chip{flex-shrink:0;padding:5px 12px;border:1px solid var(--dsw-alias-border-l4);border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;cursor:pointer;transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease,color .16s ease}',
      '.dgen-preset-chip:hover{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 42%,var(--dsw-alias-border-l4));color:var(--dsw-alias-label-primary);transform:translateY(-1px)}',
      '.dgen-preset-chip:active{transform:scale(.97)}',
      '.dgen-preset-chip.active{border-color:var(--dsw-alias-brand-primary,#3b82f6);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 12%,transparent);color:var(--dsw-alias-brand-primary,#3b82f6);font-weight:600}',

      /* Content & Split Grid */
      '.dgen-content{box-sizing:border-box;width:100%;margin-top:20px}',
      '.dgen-preview-grid{display:grid;grid-template-columns:1fr 1.25fr;gap:18px;align-items:start}',
      '@media(max-width:960px){.dgen-preview-grid{grid-template-columns:1fr}}',

      /* Panels (Standard DSH card: border-l4 + bg-layer-2) */
      '.dgen-panel{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l4);border-radius:14px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}',
      '.dgen-panel-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 55%,transparent);border-bottom:1px solid var(--dsw-alias-border-l4)}',
      '.dgen-panel-title{font-size:13px;font-weight:650;display:flex;align-items:center;gap:8px;color:var(--dsw-alias-label-primary)}',
      '.dgen-live-dot{width:7px;height:7px;border-radius:50%;background:#38a169;box-shadow:0 0 0 3px color-mix(in srgb,#38a169 18%,transparent)}',
      '.dgen-btn-xs{padding:5px 10px;border:1px solid var(--dsw-alias-border-l4);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:11px;font-weight:500;cursor:pointer;transition:all .16s ease}',
      '.dgen-btn-xs:hover{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 42%,var(--dsw-alias-border-l4));color:var(--dsw-alias-label-primary)}',
      '.dgen-btn-xs:active{transform:scale(.97)}',

      /* Editor Input & Validation (Using bg-layer-1) */
      '.dgen-editor-textarea{box-sizing:border-box;width:100%;height:440px;padding:14px;background:var(--dsw-alias-bg-layer-1);border:none;color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,Consolas,Monaco,monospace;font-size:12px;line-height:1.55;resize:vertical;outline:none}',
      '.dgen-validation-box{padding:12px 16px;font-size:12px;border-top:1px solid var(--dsw-alias-border-l4);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 70%,transparent);display:flex;flex-direction:column;gap:6px}',
      '.dgen-badge-valid{color:#38a169;font-weight:650;display:inline-flex;align-items:center;gap:6px}',
      '.dgen-badge-repaired{color:#d69e2e;font-weight:650;display:inline-flex;align-items:center;gap:6px}',
      '.dgen-badge-invalid{color:#e53e3e;font-weight:650;display:inline-flex;align-items:center;gap:6px}',
      '.dgen-issue-list{margin:4px 0 0;padding-left:18px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1.5}',

      /* Canvas Body (Unified bg-layer-1!) */
      '.dgen-canvas-body{padding:18px;min-height:440px;box-sizing:border-box;background:var(--dsw-alias-bg-layer-1)}',
      '.dgen-canvas-inner{animation:dgenReveal .25s ease both}',
      '.dgen-layout-stack{display:flex;flex-direction:column;gap:18px;width:100%}',
      '.dgen-layout-stack > * + *{border-top:1px solid var(--dsw-alias-border-l4);padding-top:16px;margin-top:0}',
      '.dgen-layout-row{display:flex;flex-direction:row;flex-wrap:wrap;gap:14px;width:100%}',
      '.dgen-layout-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;width:100%}',

      /* KPI Metrics & Tiles */
      '.dgen-metric-kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;width:100%}',
      '.dgen-metric-tile{box-sizing:border-box;background:var(--dsw-alias-bg-layer-1);border:1px solid color-mix(in srgb,var(--dsw-alias-border-l4) 75%,transparent);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:4px;transition:border-color .15s ease}',
      '.dgen-metric-tile:hover{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 40%,var(--dsw-alias-border-l4))}',
      '.dgen-metric-box{display:flex;align-items:baseline;gap:6px;margin-top:2px}',
      '.dgen-metric-val{font-size:24px;font-weight:700;letter-spacing:-.02em;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}',
      '.dgen-metric-unit{font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.dgen-metric-change{font-size:11px;font-weight:650;padding:2px 7px;border-radius:999px}',
      '.dgen-metric-up{color:#38a169;background:color-mix(in srgb,#38a169 12%,transparent);border:1px solid color-mix(in srgb,#38a169 25%,transparent)}',
      '.dgen-metric-down{color:#e53e3e;background:color-mix(in srgb,#e53e3e 12%,transparent);border:1px solid color-mix(in srgb,#e53e3e 25%,transparent)}',

      /* Visual Graphics (Charts & Diagrams) - Frameless Sections */
      '.dgen-chart-block{box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:8px;background:transparent;border:none;padding:0}',
      '.dgen-diagram-block{box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:8px;background:transparent;border:none;padding:0}',
      '.dgen-table-block{box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:8px;background:transparent;border:none;padding:0}',
      '.dgen-list-block{box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:8px;background:transparent;border:none;padding:0}',
      '.dgen-markdown-block{box-sizing:border-box;width:100%;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-primary)}',
      '.dgen-accordion-block{box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:8px;background:transparent;border:none;padding:0}',
      '.dgen-image-block{box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:6px;background:transparent;border:none;padding:0}',
      '.dgen-gallery-block{box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:8px;background:transparent;border:none;padding:0}',
      '.dgen-media-block{box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:8px;background:transparent;border:none;padding:0}',

      /* Intrinsic Business Cards (Kept as structured card entity) */
      '.dgen-business-card, .dgen-comparison-card, .dgen-diff-card, .dgen-json-card, .dgen-tree-card, .dgen-task-card, .dgen-node-card{box-sizing:border-box;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l4);border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:8px}',
      '.dgen-node-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}',
      '.dgen-node-title{margin:0;font-size:13.5px;font-weight:650;color:var(--dsw-alias-label-primary)}',
      '.dgen-node-desc{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}',

      /* Code Card (DSH Unified Card, NO black box) */
      '.dgen-code-card{box-sizing:border-box;border-radius:12px;border:1px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-2);overflow:hidden}',
      '.dgen-code-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 50%,transparent);border-bottom:1px solid var(--dsw-alias-border-l4)}',
      '.dgen-code-body{padding:14px;margin:0;background:var(--dsw-alias-bg-layer-1);font-family:ui-monospace,SFMono-Regular,Consolas,Monaco,monospace;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-primary);overflow-x:auto}',

      /* Tables */
      '.dgen-table-wrap{width:100%;overflow-x:auto;border-radius:10px;border:1px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-2)}',
      '.dgen-table{width:100%;border-collapse:collapse;font-size:12px;text-align:left}',
      '.dgen-table th{background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 55%,transparent);padding:10px 14px;font-weight:650;color:var(--dsw-alias-label-secondary);cursor:pointer;user-select:none;border-bottom:1px solid var(--dsw-alias-border-l4)}',
      '.dgen-table th:hover{color:var(--dsw-alias-label-primary)}',
      '.dgen-table td{padding:10px 14px;border-bottom:1px solid var(--dsw-alias-border-l4);color:var(--dsw-alias-label-primary)}',
      '.dgen-table tr:last-child td{border-bottom:none}',
      '.dgen-table tr:hover td{background:color-mix(in srgb,var(--dsw-alias-bg-layer-3,rgba(0,0,0,0.03)) 40%,transparent)}',

      /* Forms */
      '.dgen-form{display:flex;flex-direction:column;gap:12px}',
      '.dgen-form-group{display:flex;flex-direction:column;gap:6px}',
      '.dgen-form-label{font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}',
      '.dgen-form-input{box-sizing:border-box;width:100%;padding:8px 10px;border:1px solid var(--dsw-alias-border-l4);border-radius:8px;outline:0;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;transition:border-color .16s ease,box-shadow .16s ease}',
      '.dgen-form-input:focus{border-color:var(--dsw-alias-brand-primary,#3b82f6);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 13%,transparent)}',

      /* Tasks */
      '.dgen-task-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l4);transition:transform .16s ease,border-color .16s ease}',
      '.dgen-task-item:hover{transform:translateX(2px);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 42%,var(--dsw-alias-border-l4))}',
      '.dgen-task-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}',
      '.dgen-task-completed{background:#38a169;box-shadow:0 0 0 3px color-mix(in srgb,#38a169 18%,transparent)}',
      '.dgen-task-running{background:var(--dsw-alias-brand-primary,#3b82f6);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 22%,transparent);animation:dgenBreathing 1.8s infinite ease-in-out}',
      '.dgen-task-pending{background:#858585}',
      '.dgen-task-failed{background:#e53e3e}',

      /* Comparisons */
      '.dgen-compare-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-top:8px}',
      '.dgen-compare-col{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l4);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;position:relative;transition:all .16s ease}',
      '.dgen-compare-col:hover{transform:translateY(-1px);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 42%,var(--dsw-alias-border-l4))}',
      '.dgen-compare-recom{border-color:var(--dsw-alias-brand-primary,#3b82f6);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 6%,transparent)}',
      '.dgen-badge-recom{position:absolute;top:-9px;right:10px;background:var(--dsw-alias-brand-primary,#3b82f6);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px}',

      /* ER & Sequence */
      '.dgen-er-table{border:1px solid var(--dsw-alias-border-l4);border-radius:8px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;min-width:180px}',
      '.dgen-er-head{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 12%,transparent);color:var(--dsw-alias-brand-primary,#3b82f6);padding:7px 12px;font-size:12px;font-weight:700;border-bottom:1px solid var(--dsw-alias-border-l4)}',
      '.dgen-er-row{display:flex;justify-content:space-between;padding:6px 12px;font-size:11px;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l4) 50%,transparent)}',
      '.dgen-seq-box{display:flex;flex-direction:column;gap:14px;padding:12px 0}',
      '.dgen-seq-actors{display:flex;justify-content:space-around;padding-bottom:10px;border-bottom:1px dashed var(--dsw-alias-border-l4)}',
      '.dgen-seq-actor{padding:5px 12px;border-radius:6px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l4);font-size:12px;font-weight:600}',
      '.dgen-seq-msg{display:flex;align-items:center;justify-content:center;position:relative;padding:6px 0;font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.dgen-seq-arrow{height:1.5px;background:var(--dsw-alias-brand-primary,#3b82f6);width:70%;position:relative}',
      '.dgen-seq-arrow::after{content:"▶";position:absolute;right:-5px;top:-5px;font-size:9px;color:var(--dsw-alias-brand-primary,#3b82f6)}',

      /* Event Console */
      '.dgen-console-box{margin-top:18px;border:1px solid var(--dsw-alias-border-l4);border-radius:14px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}',
      '.dgen-console-list{padding:10px 14px;max-height:180px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;background:var(--dsw-alias-bg-layer-1);font-family:ui-monospace,SFMono-Regular,Consolas,Monaco,monospace;font-size:11px}',
      '.dgen-event-row{display:flex;align-items:baseline;gap:8px;padding:5px 8px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l4);animation:dgenSlideIn .16s ease}',
      '.dgen-event-time{color:var(--dsw-alias-label-tertiary);flex-shrink:0}',
      '.dgen-event-cat{padding:2px 7px;border-radius:999px;font-size:10px;font-weight:600;text-transform:uppercase;border:1px solid var(--dsw-alias-border-l4)}',
      '.dgen-event-cat-local{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary)}',
      '.dgen-event-cat-action{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 12%,transparent);color:var(--dsw-alias-brand-primary,#3b82f6);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 30%,var(--dsw-alias-border-l4))}',
      '.dgen-event-cat-agent{background:color-mix(in srgb,#8b5cf6 12%,transparent);color:#8b5cf6;border-color:color-mix(in srgb,#8b5cf6 30%,var(--dsw-alias-border-l4))}',
      '.dgen-event-id{color:var(--dsw-alias-label-primary);font-weight:600}',
      '.dgen-event-payload{color:var(--dsw-alias-label-secondary);word-break:break-all}',

      /* Common Elements */
      '.dgen-btn-primary{border:1px solid var(--dsw-alias-brand-primary,#3b82f6);background:var(--dsw-alias-brand-primary,#3b82f6);color:#fff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;transition:opacity .16s ease,transform .16s ease}',
      '.dgen-btn-primary:hover{opacity:.9;transform:translateY(-1px)}',
      '.dgen-btn-primary:active{transform:scale(.97)}',
      '.dgen-btn-secondary{padding:7px 14px;border:1px solid var(--dsw-alias-border-l4);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:inherit;font-size:12px;cursor:pointer;transition:all .16s ease}',
      '.dgen-btn-secondary:hover{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 42%,var(--dsw-alias-border-l4))}',
      '.dgen-toast{padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;background:color-mix(in srgb,#38a169 12%,transparent);color:#38a169;border:1px solid color-mix(in srgb,#38a169 35%,transparent)}',
      '.dgen-callout{padding:12px 14px;border-radius:8px;border-left:3px solid var(--dsw-alias-brand-primary,#3b82f6);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 8%,transparent);font-size:12px;line-height:1.55;color:var(--dsw-alias-label-primary)}',
      '.dgen-fallback-box{padding:12px 14px;border-radius:8px;border:1px dashed #d69e2e;background:color-mix(in srgb,#d69e2e 8%,transparent);color:var(--dsw-alias-label-primary);font-size:12px}',
      '.dgen-approval-box{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:10px;background:color-mix(in srgb,#d69e2e 10%,transparent);border:1px solid color-mix(in srgb,#d69e2e 30%,var(--dsw-alias-border-l4))}',

      /* Form controls for settings */
      '.dgen-switch{position:relative;display:inline-block;width:38px;height:22px;cursor:pointer}',
      '.dgen-switch input{opacity:0;width:0;height:0}',
      '.dgen-slider{position:absolute;cursor:pointer;inset:0;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l4);border-radius:22px;transition:.2s}',
      '.dgen-slider:before{position:absolute;content:"";height:16px;width:16px;left:2px;bottom:2px;background:var(--dsw-alias-label-secondary);border-radius:50%;transition:.2s}',
      'input:checked + .dgen-slider{background:var(--dsw-alias-brand-primary,#3b82f6);border-color:var(--dsw-alias-brand-primary,#3b82f6)}',
      'input:checked + .dgen-slider:before{transform:translateX(16px);background:#fff}',
      '.dgen-input-num{width:88px;padding:6px 10px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l4);border-radius:6px;color:inherit;font-size:13px;outline:none}',
      '.dgen-input-num:focus{border-color:var(--dsw-alias-brand-primary,#3b82f6)}',

      /* Animations */
      '@keyframes dgenReveal{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}',
      '@keyframes dgenSlideIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}',
      '@keyframes dgenBreathing{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}',
      /* Heatmap Professional Styles */
      '.dgen-heatmap-wrap{width:100%;overflow-x:auto;padding-bottom:6px;margin-top:10px}',
      '.dgen-heatmap-grid{display:grid;grid-template-columns:46px repeat(12,minmax(24px,1fr));gap:5px;align-items:center}',
      '.dgen-heatmap-hcell{font-size:10px;color:var(--dsw-alias-label-tertiary);text-align:center;font-family:ui-monospace,monospace}',
      '.dgen-heatmap-ylabel{font-size:11px;font-weight:600;color:var(--dsw-alias-label-secondary);text-align:right;padding-right:8px}',
      '.dgen-heatmap-cell{aspect-ratio:1;border-radius:5px;border:1px solid color-mix(in srgb,var(--dsw-alias-border-l4) 80%,transparent);cursor:pointer;transition:transform .12s ease,box-shadow .12s ease;position:relative}',
      '.dgen-heatmap-cell:hover{transform:scale(1.18);z-index:3;box-shadow:0 4px 12px rgba(0,0,0,0.15);border-color:var(--dsw-alias-brand-primary,#3b82f6)}',
      '.dgen-heatmap-legend{display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:10px;border-top:1px dashed var(--dsw-alias-border-l4);font-size:11px;color:var(--dsw-alias-label-secondary);flex-wrap:wrap;gap:8px}',
      '.dgen-heatmap-ramp{display:flex;align-items:center;gap:4px}',
      '.dgen-heatmap-swatch{width:14px;height:14px;border-radius:3px;border:1px solid color-mix(in srgb,var(--dsw-alias-border-l4) 80%,transparent)}',

      /* Mermaid Engine & Loading */
      '.dgen-mermaid-output{width:100%;display:flex;justify-content:center;overflow-x:auto;padding:8px 0}',
      '.dgen-mermaid-output svg{max-width:100%;height:auto;display:block;margin:0 auto}',
      '.dgen-diagram-loading{display:flex;align-items:center;justify-content:center;gap:8px;padding:32px 0;font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.dgen-spinner{width:16px;height:16px;border:2px solid color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 25%,transparent);border-top-color:var(--dsw-alias-brand-primary,#3b82f6);border-radius:50%;animation:dgenSpin .8s linear infinite}',
      '@keyframes dgenSpin{to{transform:rotate(360deg)}}',

      /* React Flow & Topology Architecture Canvas */
      '.dgen-rf-box{border:1px solid var(--dsw-alias-border-l4);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:14px;position:relative;width:100%;box-sizing:border-box;margin-top:10px;overflow-x:auto}',
      '.dgen-rf-toolbar{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--dsw-alias-border-l4);flex-wrap:wrap;gap:8px}',
      '.dgen-rf-canvas-inner{position:relative;width:880px;min-width:880px;height:272px;box-sizing:border-box;margin:4px auto}',
      '.dgen-rf-grid{display:grid;grid-template-columns:repeat(4,210px);gap:13.33px;position:relative;z-index:1;width:880px;height:272px}',
      '.dgen-rf-tier{display:flex;flex-direction:column;gap:10px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 65%,transparent);border:1px dashed var(--dsw-alias-border-l4);border-radius:10px;padding:8px;box-sizing:border-box;height:100%}',
      '.dgen-rf-tier-title{font-size:11px;font-weight:700;color:var(--dsw-alias-label-secondary);text-transform:uppercase;letter-spacing:.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:5px;height:28px}',
      '.dgen-rf-node{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l4);border-radius:8px;padding:8px 12px;display:flex;flex-direction:column;gap:4px;box-shadow:0 1px 3px rgba(0,0,0,0.03);cursor:pointer;transition:all .18s ease;position:relative;height:62px;box-sizing:border-box;justify-content:center}',
      '.dgen-rf-node:hover,.dgen-rf-node.active{border-color:#3b82f6;transform:translateY(-2px);box-shadow:0 6px 16px rgba(59,130,246,0.2)}',
      '.dgen-rf-node-head{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dgen-rf-node-sub{font-size:10px;color:var(--dsw-alias-label-secondary);display:flex;align-items:center;justify-content:space-between;gap:6px}',
      '.dgen-rf-node-sla{font-size:9.5px;color:#2563eb;background:color-mix(in srgb,#2563eb 12%,transparent);padding:1px 5px;border-radius:4px;font-weight:600;white-space:nowrap}',
      '.dgen-rf-handle{position:absolute;width:8px;height:8px;border-radius:50%;background:#3b82f6;border:2px solid #ffffff;box-shadow:0 0 0 1.5px #3b82f6;z-index:2;transition:transform .15s ease,box-shadow .15s ease}',
      '.dgen-rf-node:hover .dgen-rf-handle{transform:translateY(-50%) scale(1.3);box-shadow:0 0 0 3px rgba(59,130,246,0.35)}',
      '.dgen-rf-handle-in{left:-5px;top:50%;transform:translateY(-50%)}',
      '.dgen-rf-handle-out{right:-5px;top:50%;transform:translateY(-50%)}',
      '.dgen-rf-svg{position:absolute;inset:0;pointer-events:none;width:880px;height:272px;z-index:3}',
      '@keyframes dgenFlowDash{from{stroke-dashoffset:20}to{stroke-dashoffset:0}}',
      '.dgen-flow-edge{stroke-dasharray:4 4;animation:dgenFlowDash 1.2s linear infinite}',
      '.dgen-flow-edge-dim{opacity:0.2;animation:none}',
      '.dgen-flow-edge-active{stroke:#2563eb;stroke-width:2.2;opacity:1}',
      '@media(prefers-reduced-motion:reduce){*,::before,::after{animation:none!important;transition:none!important}}',
,
      /* --- 7-Dimensional Extended Component Styles --- */
      '.dgen-image-card{width:100%;position:relative;overflow:hidden;border-radius:8px}',
      '.dgen-image-wrap{position:relative;width:100%;border-radius:6px;overflow:hidden;background:var(--dsw-alias-bg-layer-1);display:flex;align-items:center;justify-content:center}',
      '.dgen-image-img{width:100%;height:auto;display:block;object-fit:cover;transition:opacity 0.25s ease,transform 0.25s ease;cursor:zoom-in}',
      '.dgen-image-img:hover{transform:scale(1.012)}',
      '.dgen-image-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;color:var(--dsw-alias-label-tertiary);gap:8px;font-size:12px}',
      '.dgen-image-error{background:color-mix(in srgb,var(--dsw-alias-status-danger,#ef4444) 6%,var(--dsw-alias-bg-layer-1));border:1px dashed color-mix(in srgb,var(--dsw-alias-status-danger,#ef4444) 30%,transparent);color:var(--dsw-alias-label-secondary)}',
      '.dgen-image-caption{margin-top:8px;font-size:11px;color:var(--dsw-alias-label-secondary);text-align:center}',
      '.dgen-image-lightbox{position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(0,0,0,0.78);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px;cursor:zoom-out}',
      '.dgen-image-lightbox img{max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 16px 48px rgba(0,0,0,0.5);object-fit:contain}',
      '.dgen-gallery-thumbs{display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:4px}',
      '.dgen-gallery-thumb{width:64px;height:48px;border-radius:4px;border:2px solid var(--dsw-alias-border-l4);overflow:hidden;cursor:pointer;flex-shrink:0;opacity:0.65;transition:all 0.2s}',
      '.dgen-gallery-thumb.active{border-color:var(--dsw-alias-brand-primary,#3b82f6);opacity:1;box-shadow:0 0 0 1px var(--dsw-alias-brand-primary,#3b82f6)}',
      '.dgen-gallery-thumb img{width:100%;height:100%;object-fit:cover}',
      '.dgen-audio-box{display:flex;align-items:center;gap:12px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l4);border-radius:8px;padding:10px 14px}',
      '.dgen-audio-wave{display:flex;align-items:center;gap:3px;height:24px}',
      '.dgen-audio-bar{width:3px;background:var(--dsw-alias-brand-primary,#3b82f6);border-radius:2px;animation:dgenAudioPulse 1.2s ease-in-out infinite alternate}',
      '@keyframes dgenAudioPulse{0%{height:4px}100%{height:20px}}',
      '.dgen-video-wrap{width:100%;border-radius:8px;overflow:hidden;background:#000;position:relative}',
      '.dgen-diff-box{border:1px solid var(--dsw-alias-border-l4);border-radius:8px;overflow:hidden;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11px;background:var(--dsw-alias-bg-layer-1)}',
      '.dgen-diff-row{display:flex;line-height:20px}',
      '.dgen-diff-num{width:36px;text-align:right;padding-right:8px;color:var(--dsw-alias-label-tertiary);user-select:none;border-right:1px solid var(--dsw-alias-border-l4)}',
      '.dgen-diff-content{flex:1;padding:0 10px;white-space:pre-wrap;word-break:break-all}',
      '.dgen-diff-add{background:color-mix(in srgb,#22c55e 12%,transparent);color:#16a34a}',
      '.dgen-diff-del{background:color-mix(in srgb,#ef4444 12%,transparent);color:#dc2626}',
      '.dgen-diff-same{color:var(--dsw-alias-label-primary)}',
      '.dgen-tree-box{padding:8px 12px;font-family:inherit;font-size:12px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l4);border-radius:6px}',
      '.dgen-tree-node{display:flex;align-items:center;gap:6px;padding:4px 6px;border-radius:4px;cursor:pointer;user-select:none}',
      '.dgen-tree-node:hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 8%,transparent)}',
      '.dgen-terminal-box{background:#0d1117;border:1px solid #30363d;border-radius:8px;overflow:hidden;color:#c9d1d9;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11px}',
      '.dgen-terminal-head{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:#161b22;border-bottom:1px solid #30363d}',
      '.dgen-terminal-dots{display:flex;gap:6px}',
      '.dgen-terminal-dot{width:10px;height:10px;border-radius:50%}',
      '.dgen-terminal-body{padding:12px;max-height:240px;overflow-y:auto}',
      '.dgen-terminal-line{margin-bottom:4px;line-height:1.6}',
      '.dgen-accordion-item{border:1px solid var(--dsw-alias-border-l4);border-radius:6px;margin-bottom:8px;overflow:hidden;background:var(--dsw-alias-bg-layer-1)}',
      '.dgen-accordion-head{padding:10px 14px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;font-weight:500;user-select:none}',
      '.dgen-accordion-head:hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 6%,transparent)}',
      '.dgen-accordion-body{padding:12px 14px;border-top:1px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-2);font-size:12px}',
      '.dgen-ctrl-input{width:100%;padding:6px 10px;border-radius:6px;border:1px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:12px;outline:none;box-sizing:border-box}',
      '.dgen-ctrl-input:focus{border-color:var(--dsw-alias-brand-primary,#3b82f6)}',
      '.dgen-ctrl-select{padding:6px 10px;border-radius:6px;border:1px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:12px;outline:none;cursor:pointer}',
      '.dgen-range-input{width:100%;height:6px;background:var(--dsw-alias-border-l4,#e2e8f0);border-radius:999px;outline:none;cursor:pointer;accent-color:var(--dsw-alias-brand-primary,#3b82f6);margin:6px 0}',

      /* --- Chat In-Place Direct Rendering Styles (Single Unified Card Container) --- */
      '.dgen-chat-block-mount{margin:10px 0;width:100%;box-sizing:border-box}',
      '.dgen-chat-direct-wrap{margin:10px 0;width:100%;box-sizing:border-box;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l4);border-radius:12px;padding:16px 18px;box-shadow:0 1px 4px rgba(0,0,0,0.03)}',
      '.dgen-chat-direct-wrap .dgen-canvas-inner{width:100%}',
      '.dgen-canvas-body .dgen-canvas-inner{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l4);border-radius:12px;padding:16px 18px;box-shadow:0 1px 4px rgba(0,0,0,0.03)}',

      /* --- High-Fidelity Skeleton Screen Animations --- */
      '@keyframes dgen-skeleton-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}',
      '@keyframes dgen-pulse-dot{0%,100%{opacity:.4;transform:scale(.9)}50%{opacity:1;transform:scale(1.2)}}',
      '.dgen-skeleton-card{background:var(--dsw-alias-bg-layer-2,#ffffff);border:1px dashed color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 38%,var(--dsw-alias-border-l3,#cbd5e1))!important;box-shadow:0 4px 16px rgba(59,130,246,0.06)!important}',
      '.dgen-skeleton-box{background:linear-gradient(90deg,color-mix(in srgb,var(--dsw-alias-bg-layer-1,#f1f5f9) 92%,var(--dsw-alias-border-l3,#cbd5e1)) 25%,color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 12%,var(--dsw-alias-bg-layer-2,#ffffff)) 45%,color-mix(in srgb,var(--dsw-alias-bg-layer-1,#f1f5f9) 92%,var(--dsw-alias-border-l3,#cbd5e1)) 65%);background-size:200% 100%;animation:dgen-skeleton-shimmer 1.8s ease-in-out infinite;border-radius:var(--dsw-radius-sm,4px)}',
      '.dgen-skeleton-dot{width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-brand-primary,#3b82f6);box-shadow:0 0 8px var(--dsw-alias-brand-primary,#3b82f6);animation:dgen-pulse-dot 1.2s ease-in-out infinite;flex-shrink:0}',

    ].join('');

    /**
     * Pure Offline Vector SVG Generator for Air-Gap Environments
     */
    function getOfflineDemoImage(title, subtitle, accent = '#3b82f6') {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">' +
        '<defs>' +
          '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#0f172a"/>' +
            '<stop offset="100%" stop-color="#1e293b"/>' +
          '</linearGradient>' +
          '<linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">' +
            '<stop offset="0%" stop-color="' + accent + '"/>' +
            '<stop offset="100%" stop-color="#38bdf8"/>' +
          '</linearGradient>' +
          '<pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">' +
            '<path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>' +
          '</pattern>' +
        '</defs>' +
        '<rect width="800" height="450" fill="url(#bg)"/>' +
        '<rect width="800" height="450" fill="url(#grid)"/>' +
        '<circle cx="400" cy="225" r="160" fill="none" stroke="' + accent + '" stroke-opacity="0.15" stroke-width="2"/>' +
        '<circle cx="400" cy="225" r="110" fill="none" stroke="' + accent + '" stroke-opacity="0.25" stroke-width="1.5" stroke-dasharray="6 4"/>' +
        '<circle cx="400" cy="225" r="60" fill="none" stroke="' + accent + '" stroke-opacity="0.35" stroke-width="1"/>' +
        '<circle cx="400" cy="225" r="32" fill="url(#accent)"/>' +
        '<circle cx="250" cy="170" r="22" fill="#1e293b" stroke="' + accent + '" stroke-width="2"/>' +
        '<circle cx="550" cy="170" r="22" fill="#1e293b" stroke="' + accent + '" stroke-width="2"/>' +
        '<circle cx="250" cy="280" r="22" fill="#1e293b" stroke="' + accent + '" stroke-width="2"/>' +
        '<circle cx="550" cy="280" r="22" fill="#1e293b" stroke="' + accent + '" stroke-width="2"/>' +
        '<line x1="250" y1="170" x2="400" y2="225" stroke="' + accent + '" stroke-width="1.5" stroke-dasharray="4 3"/>' +
        '<line x1="550" y1="170" x2="400" y2="225" stroke="' + accent + '" stroke-width="1.5" stroke-dasharray="4 3"/>' +
        '<line x1="250" y1="280" x2="400" y2="225" stroke="' + accent + '" stroke-width="1.5" stroke-dasharray="4 3"/>' +
        '<line x1="550" y1="280" x2="400" y2="225" stroke="' + accent + '" stroke-width="1.5" stroke-dasharray="4 3"/>' +
        '<text x="400" y="229" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#ffffff">CORE</text>' +
        '<text x="250" y="174" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" fill="#38bdf8">EDGE</text>' +
        '<text x="550" y="174" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" fill="#38bdf8">GATE</text>' +
        '<text x="250" y="284" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" fill="#38bdf8">CACHE</text>' +
        '<text x="550" y="284" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" fill="#38bdf8">DB</text>' +
        '<text x="400" y="68" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="#f8fafc">' + title + '</text>' +
        '<text x="400" y="96" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8">' + subtitle + '</text>' +
        '<rect x="40" y="392" width="160" height="28" rx="6" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.1)"/>' +
        '<circle cx="56" cy="406" r="4.5" fill="#22c55e"/>' +
        '<text x="68" y="410" font-family="system-ui, sans-serif" font-size="10" fill="#e2e8f0">Cluster Health 99.9%</text>' +
        '<rect x="600" y="392" width="160" height="28" rx="6" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.1)"/>' +
        '<text x="680" y="410" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#38bdf8">Latency: 18ms (P99)</text>' +
      '</svg>';
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }

    /** Categorized Presets covering all 20+ charts, diagrams and patterns */
    const PRESET_CATEGORIES = [
      {
        id: 'cat-basic',
        label: '📄 基础展示',
        items: [
          {
            id: 'basic-markdown',
            name: '📝 Markdown 富文本 (Markdown)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_basic_md',
              title: '智能助手技术规范速查',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'md-1',
                  type: 'markdown',
                  version: '1',
                  props: {
                    title: 'DeepSeek GenUI 工业级规范指南',
                    content: '### 核心设计原则\n- **宿主隔离保护**: 任何单个图表或图片异常绝不引起 DSH 主窗口崩溃。\n- **统一设计系统**: 全面接入 DSH `--dsw-alias-*` 设计令牌变量。\n- **端到端类型自愈**: 对畸变协议参数实行自动修补与降级兜底。\n\n> 提示：点击左侧编辑区可实时修改 Markdown 语法并在右侧预览。'
                  }
                }
              ]
            }
          },
          {
            id: 'basic-list-badge',
            name: '🏷️ 列表与状态标签 (List & Badge)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_basic_list',
              title: '云服务节点运行状态清单',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'list-1',
                  type: 'list',
                  version: '1',
                  props: {
                    title: '核心服务微集群健康巡检',
                    items: [
                      { icon: '🌐', label: '边缘 API 网关集群', badge: '在线 99.99%' },
                      { icon: '🧠', label: 'DeepSeek-V3 推理算力池', badge: '负载 68%' },
                      { icon: '🛡️', label: 'WAF 安全防御引擎', badge: '规则就绪' },
                      { icon: '🗄️', label: '分布式矢量数据库', badge: '集群健康' }
                    ]
                  }
                }
              ]
            }
          },
          {
            id: 'basic-accordion',
            name: '📂 折叠面板 (Accordion)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_basic_accordion',
              title: '技术架构关键问题 FAQ',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'acc-1',
                  type: 'accordion',
                  version: '1',
                  props: {
                    title: '常见技术问题解答 (FAQ)',
                    items: [
                      { title: '1. 为什么采用 DSH Unified UI 统一变量？', content: '使用 --dsw-alias-* 能够确保无论宿主处于亮色还是暗色模式，卡片、文本、边框及图表均能完美契合宿主视觉主题。' },
                      { title: '2. 图片和图表加载失败如何防止影响主功能？', content: 'GenUI 内置 SafeRendererHost 与 ComponentErrorBoundary 双层屏障，发生渲染异常时自动转换为行内警示卡片，彻底避免 host slot 崩溃。' },
                      { title: '3. 如何在 React Flow 与 Mermaid 视图间切换？', content: '拓扑图组件右上方常驻模式切换按钮，用户可随时在动态泳道画布与声明式文本语法间来回切换。' }
                    ]
                  }
                }
              ]
            }
          }
        ]
      },
      {
        id: 'cat-layout',
        label: '🍱 布局容器',
        items: [
          {
            id: 'layout-grid',
            name: '🔲 响应式网格 (Grid Matrix)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_layout_grid',
              title: '双列指标监控面板',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'grid-1',
                  type: 'grid',
                  version: '1',
                  props: {
                    columns: 2,
                    children: [
                      {
                        id: 'm1',
                        type: 'metric',
                        props: { title: '峰值并发吞吐 (QPS)', value: '8,420', unit: 'req/s', change: '+14.2%', changeType: 'up' }
                      },
                      {
                        id: 'm2',
                        type: 'metric',
                        props: { title: '端到端平均延迟', value: '28', unit: 'ms', change: '-4.6ms', changeType: 'down' }
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            id: 'layout-split',
            name: '🌗 双列分栏 (Split View)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_layout_split',
              title: '左右双列对照布局',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'split-1',
                  type: 'split',
                  version: '1',
                  props: {
                    ratio: '1fr 1fr',
                    children: [
                      {
                        id: 'card-l',
                        type: 'card',
                        props: { title: '左侧业务概览', content: '包含用户侧访问请求量与实时连接数。' }
                      },
                      {
                        id: 'card-r',
                        type: 'card',
                        props: { title: '右侧资源水位', content: '当前计算节点内存占用 42%，CPU 38%。' }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      },
      {
        id: 'cat-controls',
        label: '🎛️ 交互控件',
        items: [
          {
            id: 'ctrl-inputs',
            name: '📝 输入与滑动调节 (Controls)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_ctrls',
              title: '运行时参数动态微调',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'c-card',
                  type: 'card',
                  version: '1',
                  props: {
                    title: '模型采样控制参数',
                    content: '调节参数后将自动通过 agent-genui-event 发送本地事件。'
                  }
                },
                {
                  id: 'in-1',
                  type: 'input',
                  version: '1',
                  props: { label: '会话提示词前缀 (System Prompt)', placeholder: '请输入系统角色设定...' }
                },
                {
                  id: 'sel-1',
                  type: 'select',
                  version: '1',
                  props: {
                    label: '推理模型版本 (Model Selection)',
                    value: 'deepseek-v3',
                    options: [
                      { label: 'DeepSeek-V3 核心推理基座', value: 'deepseek-v3' },
                      { label: 'DeepSeek-R1 深度长思维链', value: 'deepseek-r1' },
                      { label: 'DeepSeek-Coder 代码大模型', value: 'deepseek-coder' }
                    ]
                  }
                },
                {
                  id: 'sl-1',
                  type: 'slider',
                  version: '1',
                  props: { label: '核采样阈值 (Top-P)', min: 0, max: 100, value: 85, unit: '%' }
                },
                {
                  id: 'sw-1',
                  type: 'switch',
                  version: '1',
                  props: { label: '启用推理思维链输出 (Thinking Mode)', checked: true }
                },
                {
                  id: 'dp-1',
                  type: 'datePicker',
                  version: '1',
                  props: { label: '归档截止日期 (Archive Cutoff)' }
                },
                {
                  id: 'btn-1',
                  type: 'button',
                  version: '1',
                  props: {
                    variant: 'primary',
                    label: '💾 确认并下发模型参数',
                    action: 'submit_params',
                    style: { width: '100%', marginTop: '8px' }
                  }
                }
              ]
            }
          }
        ]
      },
      {
        id: 'cat-charts',
        label: '📊 数据可视化',
        items: [
          {
            id: 'chart-line',
            name: '📈 折线趋势图 (Line)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_chart_line',
              title: '24 小时服务请求峰值走势',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'line-1',
                  type: 'chart',
                  version: '1',
                  props: {
                    chartType: 'line',
                    title: 'QPS 吞吐量时序曲线',
                    series: [
                      { label: '00:00', value: 120 },
                      { label: '04:00', value: 85 },
                      { label: '08:00', value: 380 },
                      { label: '12:00', value: 650 },
                      { label: '16:00', value: 590 },
                      { label: '20:00', value: 480 },
                      { label: '24:00', value: 230 }
                    ]
                  }
                }
              ]
            }
          },
          {
            id: 'chart-heatmap',
            name: '🔥 全时段吞吐热力矩阵 (Heatmap)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_chart_heatmap',
              title: '周周期服务吞吐热度分布',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'hm-1',
                  type: 'chart',
                  version: '1',
                  props: {
                    chartType: 'heatmap',
                    title: '7x24h 集群吞吐密度热力图'
                  }
                }
              ]
            }
          },
          {
            id: 'chart-bar',
            name: '📊 柱状对比图 (Bar)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_chart_bar',
              title: '各业务集群资源利用率对比',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'bar-1',
                  type: 'chart',
                  version: '1',
                  props: {
                    chartType: 'bar',
                    title: 'CPU 负载对比 (百分比)',
                    series: [
                      { label: '网关', value: 45 },
                      { label: '推理算力', value: 88 },
                      { label: '存储 DB', value: 62 },
                      { label: '日志检索', value: 35 },
                      { label: '任务调度', value: 54 }
                    ]
                  }
                }
              ]
            }
          },
          {
            id: 'chart-donut',
            name: '🍩 环形占比图 (Donut)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_chart_donut',
              title: '存储类型分布占比',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'donut-1',
                  type: 'chart',
                  version: '1',
                  props: {
                    chartType: 'donut',
                    title: '分布式存储配额占用',
                    series: [
                      { label: '对象存储', value: 45 },
                      { label: '块存储', value: 30 },
                      { label: '缓存盘', value: 25 }
                    ]
                  }
                }
              ]
            }
          },
          {
            id: 'chart-scatter',
            name: '🎯 散点分布图 (Scatter)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_chart_scatter',
              title: '请求规模与延迟散点分布',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'sc-1',
                  type: 'chart',
                  version: '1',
                  props: {
                    chartType: 'scatter',
                    title: 'Token 规模与端到端耗时对应关系',
                    points: [
                      { x: 350, y: 25 },
                      { x: 800, y: 38 },
                      { x: 1200, y: 46 },
                      { x: 1800, y: 68 },
                      { x: 2500, y: 92 },
                      { x: 3200, y: 125 },
                      { x: 3800, y: 148 }
                    ]
                  }
                }
              ]
            }
          },
          {
            id: 'chart-gauge',
            name: '⏱️ 仪表盘 (Gauge)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_chart_gauge',
              title: '服务可用性 SLO 仪表盘',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'g-1',
                  type: 'chart',
                  version: '1',
                  props: {
                    chartType: 'gauge',
                    title: '生产集群可用性评分',
                    value: 99.8,
                    unit: '%',
                    target: 99.9
                  }
                }
              ]
            }
          }
        ]
      },
      {
        id: 'cat-diagrams',
        label: '🔀 图形可视化',
        items: [
          {
            id: 'diag-arch',
            name: '🏛️ 架构拓扑 (React Flow & Mermaid)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_diag_arch',
              title: '多层分布式生产系统架构拓扑',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'arch-1',
                  type: 'diagram',
                  version: '1',
                  props: {
                    diagramType: 'architecture',
                    title: '现代端到端服务分层拓扑架构',
                    tiers: [
                      { name: '接入层 (Client)', nodes: ['Web 宿主', '移动端 App', '桌面端 DSH'] },
                      { name: '网关层 (API Gateway)', nodes: ['WAF 防护', 'Kong 网关', 'OAuth2 鉴权中心'] },
                      { name: '服务层 (Core Services)', nodes: ['Agent Runtime', 'GenUI 渲染服务', '任务编排器'] },
                      { name: '存储层 (Storage & DB)', nodes: ['Redis 缓存', 'PostgreSQL', '向量数据库'] }
                    ]
                  }
                }
              ]
            }
          },
          {
            id: 'diag-flow',
            name: '🔄 流程图 (Flowchart)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_diag_flow',
              title: '用户下单与自动化库存扣减工作流',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'flow-1',
                  type: 'diagram',
                  version: '1',
                  props: {
                    diagramType: 'flowchart',
                    direction: 'LR',
                    nodes: [
                      { id: 'start', label: '用户发起请求' },
                      { id: 'auth', label: '鉴权与限流' },
                      { id: 'exec', label: '扣减库存' },
                      { id: 'success', label: '回包成功' }
                    ],
                    edges: [
                      { from: 'start', to: 'auth' },
                      { from: 'auth', to: 'exec' },
                      { from: 'exec', to: 'success' }
                    ]
                  }
                }
              ]
            }
          },
          {
            id: 'diag-seq',
            name: '⏱️ 时序交互图 (Sequence)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_diag_seq',
              title: 'Agent 推理与工具调用交互时序',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'seq-1',
                  type: 'diagram',
                  version: '1',
                  props: {
                    diagramType: 'sequence',
                    actors: ['User', 'DSH', 'DeepSeekAgent', 'ToolService'],
                    steps: [
                      { from: 'User', to: 'DSH', msg: '提出复杂问题' },
                      { from: 'DSH', to: 'DeepSeekAgent', msg: '分发 Prompt' },
                      { from: 'DeepSeekAgent', to: 'ToolService', msg: '调用外部检索' },
                      { from: 'ToolService', to: 'DeepSeekAgent', msg: '返回知识库数据' },
                      { from: 'DeepSeekAgent', to: 'DSH', msg: '生成 GenUI 卡片' },
                      { from: 'DSH', to: 'User', msg: '渲染高保真 UI' }
                    ]
                  }
                }
              ]
            }
          },
          {
            id: 'diag-er',
            name: '🗄️ 实体关系图 (ER Diagram)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_diag_er',
              title: '电商系统数据库实体关系',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'er-1',
                  type: 'diagram',
                  version: '1',
                  props: {
                    diagramType: 'er',
                    tables: [
                      { name: 'users', columns: [{ name: 'id (PK)', type: 'bigint' }, { name: 'email', type: 'varchar' }] },
                      { name: 'orders', columns: [{ name: 'id (PK)', type: 'bigint' }, { name: 'user_id (FK)', type: 'bigint' }, { name: 'total', type: 'decimal' }] },
                      { name: 'order_items', columns: [{ name: 'id (PK)', type: 'bigint' }, { name: 'order_id (FK)', type: 'bigint' }, { name: 'sku_id', type: 'varchar' }] }
                    ],
                    relations: [
                      'USERS ||--o{ ORDERS : places',
                      'ORDERS ||--|{ ORDER_ITEMS : contains'
                    ]
                  }
                }
              ]
            }
          },
          {
            id: 'diag-state',
            name: '🚦 状态机流转图 (State Machine)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_diag_state',
              title: '工作流订单生命周期状态机',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'state-1',
                  type: 'diagram',
                  version: '1',
                  props: {
                    diagramType: 'stateMachine',
                    states: [
                      { id: 's1', label: '草稿创建 (Draft)', status: 'completed' },
                      { id: 's2', label: '审批中 (Reviewing)', status: 'running' },
                      { id: 's3', label: '已核准 (Approved)', status: 'pending' },
                      { id: 's4', label: '已归档 (Archived)', status: 'pending' }
                    ],
                    transitions: [
                      { from: 's1', to: 's2', label: '提交审批' },
                      { from: 's2', to: 's3', label: '通过审核' },
                      { from: 's3', to: 's4', label: '完成归档' }
                    ]
                  }
                }
              ]
            }
          }
        ]
      },
      {
        id: 'cat-dev',
        label: '💻 开发者 UI',
        items: [
          {
            id: 'dev-code',
            name: '📜 代码高亮与复制 (Code)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_dev_code',
              title: 'Node.js 服务端安全校验逻辑',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'code-1',
                  type: 'code',
                  version: '1',
                  props: {
                    language: 'typescript',
                    code: 'export function sanitizeInput(raw: string): string {\n  // 1. 过滤危险的脚本注入标签\n  const cleaned = raw.replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, "");\n  // 2. 限制最大输入长度\n  return cleaned.trim().slice(0, 10000);\n}'
                  }
                }
              ]
            }
          },
          {
            id: 'dev-diff',
            name: '⚖️ 代码对比 (Diff Viewer)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_dev_diff',
              title: 'CORS 跨域安全策略配置变更',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'diff-1',
                  type: 'diffViewer',
                  version: '1',
                  props: {
                    title: '安全加固: express-cors 规则修复',
                    oldHeader: 'v1.0 (存在通配符漏洞)',
                    newHeader: 'v1.1 (严格域名白名单)',
                    lines: [
                      { type: 'same', content: 'const app = express();', oldNum: 1, newNum: 1 },
                      { type: 'del', content: 'app.use(cors({ origin: "*" })); // 漏洞：允许任何站点跨域访问', oldNum: 2, newNum: null },
                      { type: 'add', content: 'app.use(cors({ origin: ["https://dsh.local"], credentials: true })); // 修复：仅白名单域名放行', oldNum: null, newNum: 2 },
                      { type: 'same', content: 'app.listen(port);', oldNum: 3, newNum: 3 }
                    ]
                  }
                }
              ]
            }
          },
          {
            id: 'dev-json',
            name: '🌳 交互式 JSON 树 (JSON Viewer)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_dev_json',
              title: 'GenUI 协议负载元数据',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'json-1',
                  type: 'jsonViewer',
                  version: '1',
                  props: {
                    title: '协议报文结构分析',
                    data: {
                      protocol: 'agent-genui',
                      version: '1.0',
                      timestamp: 1729864200000,
                      runtime: {
                        host: 'DSH-Desktop',
                        isolation: 'SafeRendererHost',
                        mermaid: '10.9.1'
                      },
                      features: ['HeatmapChart', 'ReactFlowArchitecture', 'SafeImage', 'DiffViewer']
                    }
                  }
                }
              ]
            }
          },
          {
            id: 'dev-tree',
            name: '📁 项目目录树 (Tree View)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_dev_tree',
              title: '插件模块目录架构',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'tree-1',
                  type: 'treeView',
                  version: '1',
                  props: {
                    title: '@civilization/deepseek-genui 源码结构'
                  }
                }
              ]
            }
          },
          {
            id: 'dev-terminal',
            name: '🖥️ 模拟终端日志 (Terminal)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_dev_term',
              title: '插件热重载与编译输出',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'term-1',
                  type: 'terminal',
                  version: '1',
                  props: {
                    title: 'dsh-plugin-runtime'
                  }
                }
              ]
            }
          }
        ]
      },
      {
        id: 'cat-media',
        label: '🎬 多媒体组件',
        items: [
          {
            id: 'media-image',
            name: '🖼️ 安全图片与缩放 (Safe Image)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_media_image',
              title: '云原生拓扑大图展示',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'img-1',
                  type: 'image',
                  version: '1',
                  props: {
                    src: getOfflineDemoImage('云原生多可用区架构拓扑', '核心生产集群高可用全景拓扑 (纯本地离线矢量 · 0ms加载)', '#3b82f6'),
                    alt: '系统拓扑全景图',
                    caption: '核心生产集群多可用区架构拓扑图 (纯本地离线矢量 · 点击可查看大图)',
                    aspectRatio: '16/9',
                    preview: true
                  }
                }
              ]
            }
          },
          {
            id: 'media-gallery',
            name: '🎞️ 多图画廊 (Image Gallery)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_media_gallery',
              title: '系统多视图监控画廊',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'gal-1',
                  type: 'imageGallery',
                  version: '1',
                  props: {
                    title: '生产监控视图集锦 (纯本地离线矢量)',
                    items: [
                      { src: getOfflineDemoImage('云原生微服务拓扑', '核心集群多可用区架构全景 (纯离线矢量)', '#3b82f6'), title: '云原生拓扑大图', caption: '核心生产集群多可用区架构拓扑 (100% 纯本地离线矢量)' },
                      { src: getOfflineDemoImage('智能监控与流量分析', '全链路延迟与微服务吞吐看板 (纯离线矢量)', '#8b5cf6'), title: '智能监控大屏', caption: '全链路延迟与微服务流量追踪 (100% 纯本地离线矢量)' },
                      { src: getOfflineDemoImage('分布式边缘加速节点', '多副本容灾与边缘计算单元 (纯离线矢量)', '#10b981'), title: '硬件基础设施', caption: '边缘加速计算节点与缓存层 (100% 纯本地离线矢量)' }
                    ]
                  }
                }
              ]
            }
          },
          {
            id: 'media-audio',
            name: '🎵 音频播放器 (Audio Player)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_media_audio',
              title: '系统报警通知语音播报',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'aud-1',
                  type: 'audio',
                  version: '1',
                  props: {
                    title: '生产集群自动告警播报录音',
                    author: 'DeepSeek Voice TTS Engine',
                    duration: '01:42'
                  }
                }
              ]
            }
          },
          {
            id: 'media-video',
            name: '🎥 视频播放器 (Video Player)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_media_video',
              title: '操作教学视频回放',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'vid-1',
                  type: 'video',
                  version: '1',
                  props: {
                    title: 'GenUI 组件系统操作教程',
                    duration: '05:30'
                  }
                }
              ]
            }
          }
        ]
      },
      {
        id: 'cat-agent',
        label: '🤖 Agent 决策流',
        items: [
          {
            id: 'agent-comparison',
            name: '💡 方案决策智能推荐 (Comparison)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_agent_compare',
              title: '微服务架构迁移决策评估',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'comp-1',
                  type: 'comparison',
                  version: '1',
                  props: {
                    recommendedOptionId: 'opt-b',
                    recommendationReason: '方案 B 在改造成本与响应性能之间达到了最佳平衡，且对现有业务零停机中断。',
                    options: [
                      { id: 'opt-a', label: '方案 A: 原地全量重构' },
                      { id: 'opt-b', label: '方案 B: 绞杀者灰度演进' },
                      { id: 'opt-c', label: '方案 C: 保持单体并横向扩容' }
                    ],
                    criteria: [
                      { key: 'cost', label: '实施改造周期', values: { 'opt-a': '6 个月 (高风险)', 'opt-b': '6 周 (渐进低风险)', 'opt-c': '1 周 (无改动)' } },
                      { key: 'perf', label: '吞吐提升预期', values: { 'opt-a': '+300%', 'opt-b': '+240%', 'opt-c': '+30%' } },
                      { key: 'downtime', label: '预期业务停机', values: { 'opt-a': '需要维护窗口', 'opt-b': '零停机', 'opt-c': '零停机' } }
                    ]
                  }
                }
              ]
            }
          },
          {
            id: 'agent-task-plan',
            name: '📋 分布式任务计划 (Task Plan)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_agent_task',
              title: '自动化构建发布流水线',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'task-1',
                  type: 'taskPlan',
                  version: '1',
                  props: {
                    title: '持续集成交付流水线 (CI/CD Pipeline)',
                    steps: [
                      { id: 'step-1', label: '静态代码分析与 ESLint 校验', status: 'completed' },
                      { id: 'step-2', label: 'Mermaid 架构图与 HeatmapChart 编译', status: 'completed' },
                      { id: 'step-3', label: 'DSH 宿主槽位错误隔离保护校验', status: 'running' },
                      { id: 'step-4', label: '全量生产集群灰度发布生效', status: 'pending' }
                    ]
                  }
                }
              ]
            }
          },
          {
            id: 'agent-prompt-spec',
            name: '🤖 大模型提示词规范 (System Prompt Kit)',
            dsl: {
              protocol: 'agent-genui',
              version: '1.0',
              id: 'ui_agent_prompt_spec',
              title: 'DeepSeek 专用 System Prompt 指令套件',
              layout: { type: 'stack', gap: 'md' },
              children: [
                {
                  id: 'spec-md',
                  type: 'markdown',
                  version: '1',
                  props: {
                    title: 'DeepSeek-V3 / R1 专用 GenUI 提示词规范',
                    content: '### 🎯 模型角色与行为准则\\n当你需要为用户呈现数据图表、架构拓扑、技术方案选型对比或交互控件时，除了简短的文字总结外，**必须**输出符合 `agent-genui` 规范的代码块：\\n\\n\`\`\`genui\\n{\\n  "protocol": "agent-genui",\\n  "version": "1.0",\\n  "id": "ui_task_example",\\n  "title": "任务结果展示",\\n  "layout": { "type": "stack", "gap": "md" },\\n  "children": [ ... ]\\n}\\n\`\`\`\\n\\n### 📌 关键规则\\n1. **图表必须配备坐标系**：输出折线/面积/散点图时必须提供 X 轴基线与刻度，热力图采用 7x24h 矩阵。\\n2. **方案对比使用 `comparison`**：标明 `recommendedOptionId`，方便用户单选并一键提交采纳。\\n3. **架构拓扑使用 `diagram` (architecture)**：声明分层清晰的 tiers，用户可在 React Flow 画布与 Mermaid 之间自由切换。'
                  }
                },
                {
                  id: 'spec-code',
                  type: 'code',
                  version: '1',
                  props: {
                    language: 'markdown',
                    code: '【DeepSeek System Prompt 模板】\n你是一名高级 AI 工程师。当用户要求展示系统架构、多方案选型或数据分析时：\n1. 优先使用 ```genui 标准 JSON 渲染高保真 UI；\n2. 遵循 7 大维度组件体系：card, metric, chart (line/bar/scatter/heatmap), diagram (architecture/sequence), comparison, taskPlan；\n3. 保持数据真实完整，坐标轴单位清晰。'
                  }
                }
              ]
            }
          }
        ]
      }
    ];

    /** Parser & Normalizer with Deterministic Repair (Section 7.2) */
    function parseAndNormalizeDSL(rawText, config) {
      const repairs = [];
      let parsed;

      try {
        parsed = JSON.parse(rawText);
      } catch (err) {
        return {
          valid: false,
          error: 'JSON 语法解析错误: ' + err.message,
          dsl: null,
          repairs: [],
        };
      }

      if (typeof parsed !== 'object' || parsed === null) {
        return { valid: false, error: 'DSL 顶层必须为 Object', dsl: null, repairs: [] };
      }

      // Root Normalization
      if (!parsed.protocol) {
        parsed.protocol = 'agent-genui';
        repairs.push('补充缺失的根字段: protocol="agent-genui"');
      }
      if (!parsed.version) {
        parsed.version = '1.0';
        repairs.push('补充缺失的根版本: version="1.0"');
      }
      if (!parsed.id) {
        parsed.id = 'ui_' + Math.random().toString(36).substring(2, 9);
        repairs.push('生成稳定的根实例 ID: ' + parsed.id);
      }
      if (!parsed.layout || typeof parsed.layout !== 'object') {
        parsed.layout = { type: 'stack', gap: 'md' };
        repairs.push('补齐缺失的根布局: { type: "stack", gap: "md" }');
      } else if (!parsed.layout.gap) {
        parsed.layout.gap = 'md';
        repairs.push('补充默认布局间距: gap="md"');
      }

      // Children normalization
      if (!Array.isArray(parsed.children)) {
        if (parsed.children) {
          parsed.children = [parsed.children];
          repairs.push('将单个 child 规范化封装为 children 数组');
        } else {
          parsed.children = [];
          repairs.push('初始化空的 children 数组');
        }
      }

      parsed.children = parsed.children.map((child, idx) => {
        if (typeof child !== 'object' || child === null) return child;
        const normalized = { ...child };
        if (!normalized.id) {
          normalized.id = 'node_' + idx + '_' + Math.random().toString(36).substring(2, 6);
          repairs.push(`节点 #${idx} 自动分配稳定 ID: ${normalized.id}`);
        }
        if (!normalized.version) {
          normalized.version = '1';
        }
        if (!normalized.props || typeof normalized.props !== 'object') {
          normalized.props = {};
          repairs.push(`节点 #${idx} (${normalized.type || 'unknown'}) 初始化 props 对象`);
        }
        return normalized;
      });

      return {
        valid: true,
        error: null,
        dsl: parsed,
        repairs,
      };
    }

    /** Multi-layer Validator (Section 7.1) */
    function validateDSL(dsl, config) {
      const issues = [];

      // Layer 1 & 2: Root Schema
      if (dsl.protocol !== 'agent-genui') {
        issues.push({ path: 'protocol', message: '协议名称必须为 agent-genui' });
      }
      if (dsl.version !== '1.0') {
        issues.push({ path: 'version', message: '协议版本暂仅支持 1.0' });
      }
      if (dsl.children.length > config.maxNodesLimit) {
        issues.push({ path: 'children', message: `节点数 (${dsl.children.length}) 超过安全配额限制 (${config.maxNodesLimit})` });
      }

      // Layer 3 & 4: Component Contracts & Semantics
      const registeredTypes = ['card', 'metric', 'table', 'form', 'comparison', 'taskPlan', 'chart', 'diagram', 'code', 'callout', 'text', 'approval'];
      const seenIds = new Set();

      dsl.children.forEach((child, index) => {
        const path = `children[${index}]`;
        if (!child.id) {
          issues.push({ path: `${path}.id`, message: '节点缺少必填标识 id' });
        } else {
          if (seenIds.has(child.id)) {
            issues.push({ path: `${path}.id`, message: `节点 ID 重复: ${child.id}` });
          }
          seenIds.add(child.id);
        }

        if (!child.type) {
          issues.push({ path: `${path}.type`, message: '节点缺少组件类型 type' });
        } else if (!registeredTypes.includes(child.type)) {
          if (config.strictMode) {
            issues.push({ path: `${path}.type`, message: `未知组件类型: ${child.type}` });
          }
        }

        // Action check
        if (config.actionAllowlistCheck && child.props && child.props.submitAction) {
          if (typeof child.props.submitAction !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(child.props.submitAction)) {
            issues.push({ path: `${path}.props.submitAction`, message: '动作 ID 格式不符合安全规范' });
          }
        }
      });

      return {
        valid: issues.length === 0,
        issues,
      };
    }

    /** Component Error Boundary (Section 9.3) */
    class ComponentErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }
      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }
      componentDidCatch(error, errorInfo) {
        console.error('[GenUI ErrorBoundary]', error, errorInfo);
      }
      render() {
        if (this.state.hasError) {
          return h('div', { className: 'dgen-fallback-box' },
            h('strong', null, '⚠️ 渲染错误捕获 (Error Boundary)'),
            h('p', { style: { margin: '4px 0 0' } }, this.state.error?.message || '组件渲染失败')
          );
        }
        return this.props.children;
      }
    }


    /**
     * Mermaid Engine & Compilers (Aligning with agent-genui-system-design.md)
     */
    let _mermaidReady = false;
    let _mermaidPromise = null;

    function ensureMermaid() {
      if (typeof window === 'undefined') return Promise.resolve(null);
      if (window.mermaid) {
        if (!_mermaidReady) {
          try {
            const isDark = document.body.classList.contains('dark') || document.documentElement.classList.contains('dark');
            window.mermaid.initialize({
              startOnLoad: false,
              securityLevel: 'loose',
              suppressErrorRendering: true,
              theme: isDark ? 'dark' : 'neutral',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              themeVariables: {
                fontSize: '12px',
                primaryColor: isDark ? '#1e293b' : '#f8fafc',
                primaryBorderColor: 'var(--dsw-alias-brand-primary, #3b82f6)',
                primaryTextColor: isDark ? '#f8fafc' : '#0f172a',
                lineColor: 'var(--dsw-alias-brand-primary, #3b82f6)',
                textColor: isDark ? '#f8fafc' : '#0f172a',
                mainBkg: isDark ? '#0f172a' : '#ffffff',
                nodeBorder: 'var(--dsw-alias-border-l4, #e2e8f0)',
                actorBkg: isDark ? '#1e293b' : '#f8fafc',
                actorBorder: 'var(--dsw-alias-brand-primary, #3b82f6)',
                actorTextColor: isDark ? '#f8fafc' : '#0f172a',
                actorLineColor: 'var(--dsw-alias-border-l4, #cbd5e1)',
                signalColor: 'var(--dsw-alias-brand-primary, #3b82f6)',
                signalTextColor: isDark ? '#f8fafc' : '#0f172a',
                labelBoxBkgColor: isDark ? '#0f172a' : '#ffffff',
                labelBoxBorderColor: 'var(--dsw-alias-border-l4, #e2e8f0)',
                labelTextColor: isDark ? '#f8fafc' : '#0f172a',
                loopTextColor: isDark ? '#f8fafc' : '#0f172a',
                noteBkgColor: isDark ? '#1e293b' : '#eff6ff',
                noteBorderColor: 'var(--dsw-alias-brand-primary, #3b82f6)',
                noteTextColor: isDark ? '#f8fafc' : '#1e3a8a'
              }
            });
            _mermaidReady = true;
          } catch (e) {
            console.warn('[GenUI Mermaid init warning]:', e);
          }
        }
        return Promise.resolve(window.mermaid);
      }

      if (!_mermaidPromise) {
        _mermaidPromise = new Promise((resolve) => {
          const tryLoad = (src, fallback) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = () => {
              try {
                const isDark = document.body.classList.contains('dark') || document.documentElement.classList.contains('dark');
                window.mermaid.initialize({
                  startOnLoad: false,
                  securityLevel: 'loose',
                  suppressErrorRendering: true,
                  theme: isDark ? 'dark' : 'neutral',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                });
                _mermaidReady = true;
                resolve(window.mermaid);
              } catch (e) {
                if (fallback) fallback();
                else resolve(null);
              }
            };
            s.onerror = () => {
              if (fallback) fallback();
              else resolve(null);
            };
            document.head.appendChild(s);
          };

          // 1. Try local bundled vendor path served by DSH
          tryLoad('/deepseek-genui/vendor/mermaid.min.js', () => {
            // 2. Fallback to official CDN
            tryLoad('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js', () => {
              resolve(null);
            });
          });
        });
      }
      return _mermaidPromise;
    }

    function compileSequenceToMermaid(actors, steps) {
      const sanitize = (s) => (s || '').replace(/[\"\:\;\#\n\r]/g, ' ').trim();
      const actorMap = new Map();
      actors.forEach((a, idx) => actorMap.set(a, 'A' + idx));
      let code = 'sequenceDiagram\n  autonumber\n';
      actors.forEach((a) => {
        code += '  participant ' + actorMap.get(a) + ' as ' + sanitize(a) + '\n';
      });
      steps.forEach((st) => {
        const fromId = actorMap.get(st.from) || 'A0';
        const toId = actorMap.get(st.to) || 'A1';
        const msg = sanitize(st.msg || '');
        if (fromId === toId) {
          code += '  Note over ' + fromId + ': ' + msg + '\n';
        } else if (msg.includes('返回') || msg.includes('响应')) {
          code += '  ' + fromId + '-->>' + toId + ': ' + msg + '\n';
        } else {
          code += '  ' + fromId + '->>' + toId + ': ' + msg + '\n';
        }
      });
      return code;
    }

    function compileFlowchartToMermaid(nodes, edges, direction = 'LR') {
      const sanitize = (s) => (s || '').replace(/[\"\[\]\(\)\{\}\;\n\r]/g, ' ').trim();
      const safeId = (id) => {
        const raw = String(id || '').trim();
        if (!raw) return 'node_0';
        const lower = raw.toLowerCase();
        if (['end', 'subgraph', 'class', 'style', 'click', 'default'].includes(lower) || /^[0-9]/.test(raw)) {
          return 'node_' + raw;
        }
        return raw.replace(/[^a-zA-Z0-9_-]/g, '_');
      };

      let code = 'flowchart ' + direction + '\n';
      (nodes || []).forEach((n) => {
        const sid = safeId(n.id);
        const shape = n.shape || 'rect';
        const label = sanitize(n.label || n.id);
        if (shape === 'diamond') {
          code += '  ' + sid + '{"' + label + '"}\n';
        } else if (shape === 'round') {
          code += '  ' + sid + '("' + label + '")\n';
        } else {
          code += '  ' + sid + '["' + label + '"]\n';
        }
      });
      if (edges && edges.length > 0) {
        edges.forEach((e) => {
          const fromSid = safeId(e.from);
          const toSid = safeId(e.to);
          if (e.label) {
            code += '  ' + fromSid + ' -->|' + sanitize(e.label) + '| ' + toSid + '\n';
          } else {
            code += '  ' + fromSid + ' --> ' + toSid + '\n';
          }
        });
      } else {
        for (let i = 0; i < (nodes || []).length - 1; i++) {
          code += '  ' + safeId(nodes[i].id) + ' --> ' + safeId(nodes[i + 1].id) + '\n';
        }
      }
      return code;
    }

    function compileErToMermaid(tables, relations) {
      let code = 'erDiagram\n';
      if (relations && relations.length > 0) {
        relations.forEach((rel) => {
          code += '  ' + rel + '\n';
        });
      }
      tables.forEach((t) => {
        const cleanName = (t.name || '').replace(/[\s\(\)\（\）]/g, '_').toUpperCase();
        code += '  ' + cleanName + ' {\n';
        (t.columns || []).forEach((c) => {
          const type = (c.type || 'string').toLowerCase();
          const colName = (c.name || 'col').replace(/[\s\(\)\（\）]/g, '_');
          const flag = c.name.includes('(PK)') || c.pk ? ' PK' : (c.name.includes('(FK)') || c.fk ? ' FK' : '');
          code += '    ' + type + ' ' + colName + flag + '\n';
        });
        code += '  }\n';
      });
      return code;
    }

    function compileStateToMermaid(states, transitions) {
      let code = 'stateDiagram-v2\n';
      const sanitize = (s) => (s || '').replace(/[\"\[\]\(\)\{\}\;\:\n\r]/g, ' ').trim();
      const safeId = (id) => {
        const raw = String(id || '').trim();
        if (!raw) return 's0';
        if (['end', 'state', 'note', 'class'].includes(raw.toLowerCase()) || /^[0-9]/.test(raw)) {
          return 's_' + raw;
        }
        return raw.replace(/[^a-zA-Z0-9_-]/g, '_');
      };

      (states || []).forEach((st) => {
        const sid = safeId(st.id);
        const label = sanitize(st.label || st.id);
        if (label && label !== sid) {
          code += '  state "' + label + '" as ' + sid + '\n';
        }
      });

      if (transitions && transitions.length > 0) {
        transitions.forEach((tr) => {
          const fromId = safeId(tr.from);
          const toId = safeId(tr.to);
          const label = sanitize(tr.label || tr.event || '');
          if (label) {
            code += '  ' + fromId + ' --> ' + toId + ': ' + label + '\n';
          } else {
            code += '  ' + fromId + ' --> ' + toId + '\n';
          }
        });
      } else {
        code += '  [*] --> ' + safeId(states[0]?.id || 'start') + '\n';
        for (let i = 0; i < (states || []).length - 1; i++) {
          code += '  ' + safeId(states[i].id) + ' --> ' + safeId(states[i + 1].id) + '\n';
        }
        code += '  ' + safeId(states[(states || []).length - 1]?.id || 'end') + ' --> [*]\n';
      }
      return code;
    }

    function compileArchitectureToMermaid(tiers) {
      if (!Array.isArray(tiers) || tiers.length === 0) {
        return 'flowchart LR\n  A["接入层"] --> B["网关层"] --> C["核心服务"] --> D[("存储缓存")]';
      }

      let code = 'flowchart LR\n';
      const nodeMap = [];

      tiers.forEach((t, ti) => {
        const tierId = 'T' + ti;
        const tierTitle = t.name || `层级 ${ti + 1}`;
        code += `  subgraph ${tierId}["${tierTitle}"]\n`;
        const tierNodeIds = [];
        (t.nodes || []).forEach((n, ni) => {
          const nodeName = typeof n === 'string' ? n : (n.name || n.label || `节点 ${ni + 1}`);
          const nodeId = `T${ti}_N${ni}`;
          tierNodeIds.push(nodeId);

          const isStorage = tierTitle.includes('存储') || tierTitle.includes('DB') || tierTitle.includes('数据库')
            || nodeName.includes('Redis') || nodeName.includes('SQL') || nodeName.includes('库');
          if (isStorage) {
            code += `    ${nodeId}[("${nodeName}")]\n`;
          } else {
            code += `    ${nodeId}["${nodeName}"]\n`;
          }
        });
        code += '  end\n';
        nodeMap.push(tierNodeIds);
      });

      // Semantic Architectural DAG Connections:
      // 1. All client nodes in Tier 0 converge into Ingress of Tier 1 (e.g. WAF)
      if (nodeMap.length >= 2) {
        const clientTier = nodeMap[0];
        const gatewayTier = nodeMap[1];
        if (clientTier.length > 0 && gatewayTier.length > 0) {
          const ingress = gatewayTier[0];
          clientTier.forEach((c) => {
            code += `  ${c} --> ${ingress}\n`;
          });
          // Internal Gateway flow: WAF -> Kong, Kong -> Auth
          for (let g = 0; g < gatewayTier.length - 1; g++) {
            if (g === 1 && gatewayTier.length >= 3) {
              code += `  ${gatewayTier[1]} -. 鉴权 .-> ${gatewayTier[2]}\n`;
            } else {
              code += `  ${gatewayTier[g]} --> ${gatewayTier[g + 1]}\n`;
            }
          }
        }
      }

      // 2. Gateway Dispatch (Kong) -> Core Services (Tier 2)
      if (nodeMap.length >= 3) {
        const gatewayTier = nodeMap[1];
        const serviceTier = nodeMap[2];
        const dispatchNode = gatewayTier.length > 1 ? gatewayTier[1] : gatewayTier[0];
        serviceTier.forEach((svc) => {
          code += `  ${dispatchNode} --> ${svc}\n`;
        });
      }

      // 3. Core Services (Tier 2) -> Storage & Cache (Tier 3)
      if (nodeMap.length >= 4) {
        const serviceTier = nodeMap[2];
        const storageTier = nodeMap[3];
        serviceTier.forEach((svc, sIdx) => {
          const targetDb = storageTier[sIdx % storageTier.length];
          code += `  ${svc} --> ${targetDb}\n`;
        });
      }

      return code;
    }

    /**
     * Component: MermaidDiagramBody (Raw SVG Rendering inside card or toolbar)
     */
    function MermaidDiagramBody({ code, fallbackSvg }) {
      const [svgHtml, setSvgHtml] = useState(null);
      const [error, setError] = useState(null);
      const [loading, setLoading] = useState(true);
      const [viewSource, setViewSource] = useState(false);

      useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        ensureMermaid().then(async (mmd) => {
          if (cancelled) return;
          if (!mmd) {
            setError('Mermaid 引擎离线或加载超时，已平滑降级至原生高精度 SVG 模式呈现');
            setLoading(false);
            return;
          }
          try {
            const uniqueId = 'dgen-mmd-' + Math.random().toString(36).slice(2, 9);
            const { svg } = await mmd.render(uniqueId, code);
            if (!cancelled) {
              setSvgHtml(svg);
              setLoading(false);
            }
          } catch (err) {
            if (!cancelled) {
              console.warn('[GenUI Mermaid parse error]:', err);
              try {
                const stray = document.getElementById(uniqueId);
                if (stray) stray.remove();
                const strayWrapper = document.getElementById('d' + uniqueId);
                if (strayWrapper) strayWrapper.remove();
              } catch (_) {}
              setError(err.message || String(err));
              setLoading(false);
            }
          }
        });

        return () => { cancelled = true; };
      }, [code]);

      return h('div', { style: { width: '100%' } },
        loading && !svgHtml && !fallbackSvg && h('div', { className: 'dgen-diagram-loading' },
          h('div', { className: 'dgen-spinner' }),
          h('span', null, '正在调用 Mermaid 引擎编译渲染...')
        ),
        svgHtml ? h('div', {
          className: 'dgen-mermaid-output',
          dangerouslySetInnerHTML: { __html: svgHtml }
        }) : (fallbackSvg ? fallbackSvg() : (error ? h('div', {
          style: {
            padding: '12px 14px',
            borderRadius: '8px',
            background: 'color-mix(in srgb, var(--dsw-alias-status-danger, #ef4444) 10%, transparent)',
            border: '1px solid var(--dsw-alias-status-danger, #ef4444)',
            fontSize: '12px',
            lineHeight: 1.5,
            color: 'var(--dsw-alias-label-primary)'
          }
        },
          h('div', { style: { fontWeight: 600, color: 'var(--dsw-alias-status-danger, #ef4444)', marginBottom: '4px' } }, '⚠️ 图表解析失败'),
          h('div', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: '11px', fontFamily: 'monospace' } }, error)
        ) : null))
      );
    }

    /**
     * Component: MermaidDiagram (Frameless Graphic Canvas)
     */
    function MermaidDiagram({ code, fallbackSvg, title }) {
      return h('div', { className: 'dgen-diagram-block' },
        title ? h('div', { className: 'dgen-node-card-head' },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            h('h3', { className: 'dgen-node-title' }, title),
            h('span', { style: { fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'color-mix(in srgb, var(--dsw-alias-brand-primary,#3b82f6) 12%, transparent)', color: 'var(--dsw-alias-brand-primary,#3b82f6)', fontWeight: 600 } }, 'Mermaid')
          )
        ) : null,
        h(MermaidDiagramBody, { code, fallbackSvg })
      );
    }

    /**
     * Component: ReactFlowArchitecture (Persistent Toolbars & Scrollable Swimlanes)
     */

    /**
     * Component: ComparisonCard (Interactive Plan Selection with Radio & Submit)
     */
    function ComparisonCard({ options = [], criteria = [], recommendedOptionId, recommendationReason, onSelect }) {
      const [selectedId, setSelectedId] = useState(recommendedOptionId || options[0]?.id || null);
      const [submitted, setSubmitted] = useState(false);

      const handleChoose = (optId) => {
        setSelectedId(optId);
        setSubmitted(false);
      };

      const handleSubmit = () => {
        const chosen = options.find((o) => o.id === selectedId);
        if (chosen && onSelect) {
          onSelect(chosen);
          setSubmitted(true);
        }
      };

      return h('div', { className: 'dgen-comparison-card' },
        recommendationReason && h('div', { className: 'dgen-callout', style: { marginBottom: '8px' } },
          h('strong', null, '💡 推荐决策方案: '),
          recommendationReason
        ),
        h('div', { className: 'dgen-compare-grid' },
          options.map((opt) => {
            const isSelected = opt.id === selectedId;
            const isRecom = opt.id === recommendedOptionId;
            return h('div', {
              key: opt.id,
              className: 'dgen-compare-col' + (isSelected ? ' selected' : '') + (isRecom ? ' dgen-compare-recom' : ''),
              style: {
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--dsw-alias-brand-primary,#3b82f6)' : (isRecom ? 'color-mix(in srgb, var(--dsw-alias-brand-primary,#3b82f6) 40%, var(--dsw-alias-border-l4))' : 'var(--dsw-alias-border-l4)'),
                background: isSelected ? 'color-mix(in srgb, var(--dsw-alias-brand-primary,#3b82f6) 10%, var(--dsw-alias-bg-layer-2))' : 'var(--dsw-alias-bg-layer-1)',
                boxShadow: isSelected ? '0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary,#3b82f6) 30%, transparent)' : 'none',
                position: 'relative',
              },
              onClick: () => handleChoose(opt.id)
            },
              isRecom && h('span', { className: 'dgen-badge-recom' }, '推荐'),
              h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' } },
                h('input', {
                  type: 'radio',
                  name: 'dgen-compare-radio',
                  checked: isSelected,
                  onChange: () => handleChoose(opt.id),
                  style: { cursor: 'pointer', accentColor: 'var(--dsw-alias-brand-primary,#3b82f6)', margin: 0 }
                }),
                h('strong', { style: { fontSize: '13px', color: 'var(--dsw-alias-label-primary)' } }, opt.label)
              ),
              criteria.map((c) =>
                h('div', { key: c.key, style: { fontSize: '11px', lineHeight: '1.5', display: 'flex', flexDirection: 'column', marginTop: '4px' } },
                  h('span', { style: { color: 'var(--dsw-alias-label-secondary)', fontWeight: 600 } }, c.label),
                  h('span', { style: { color: 'var(--dsw-alias-label-primary)' } }, c.values?.[opt.id] || '-')
                )
              ),
              h('button', {
                type: 'button',
                className: isSelected ? 'dgen-btn-primary' : 'dgen-btn-xs',
                style: { marginTop: '10px', width: '100%' },
                onClick: (e) => {
                  e.stopPropagation();
                  handleChoose(opt.id);
                }
              }, isSelected ? '✓ 当前已选中' : '点击选择此方案')
            );
          })
        ),
        h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px dashed var(--dsw-alias-border-l4)',
            flexWrap: 'wrap',
            gap: '10px'
          }
        },
          h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } },
            '已选方案: ',
            h('strong', { style: { color: 'var(--dsw-alias-brand-primary,#3b82f6)', fontSize: '13px' } }, options.find((o) => o.id === selectedId)?.label || '未选择'),
            submitted && h('span', { style: { marginLeft: '10px', color: '#38a169', fontWeight: 600 } }, '✓ 已提交确认采纳')
          ),
          h('button', {
            type: 'button',
            className: 'dgen-btn-primary',
            disabled: !selectedId,
            onClick: handleSubmit
          }, submitted ? '重新提交方案' : '确认并采纳此方案')
        )
      );
    }

    function ReactFlowArchitecture({ tiers, title, edges }) {
      const [mode, setMode] = useState('mermaid');
      const [hoveredNode, setHoveredNode] = useState(null);
      const [copied, setCopied] = useState(false);

      const safeTiers = useMemo(() => {
        const raw = (tiers && tiers.length > 0) ? tiers : [
          { name: '接入层 (Client)', nodes: ['Web 宿主', '移动端 App', '桌面端 DSH'] },
          { name: '网关层 (API Gateway)', nodes: ['WAF 防护', 'Kong 网关', 'OAuth2 鉴权中心'] },
          { name: '服务层 (Core Services)', nodes: ['Agent Runtime', 'GenUI 渲染服务', '任务编排器'] },
          { name: '存储层 (Storage & DB)', nodes: ['Redis 缓存', 'PostgreSQL', '向量数据库'] },
        ];
        return raw.map((tier, ti) => ({
          name: tier.name || `层级 ${ti + 1}`,
          nodes: (tier.nodes || []).map((node, ni) => {
            if (typeof node === 'string') {
              return { id: `t${ti}_n${ni}`, name: node };
            }
            return {
              id: node.id || `t${ti}_n${ni}`,
              name: node.name || node.label || `节点 ${ni + 1}`,
              role: node.role || node.desc || node.sub,
              badge: node.badge || node.tag
            };
          })
        }));
      }, [tiers]);

      const mmdCode = useMemo(() => compileArchitectureToMermaid(safeTiers), [safeTiers]);

      const handleCopyMermaid = () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(mmdCode);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      };

      // Realistic Architectural DAG connections
      const dynamicEdges = useMemo(() => {
        if (Array.isArray(edges) && edges.length > 0) {
          return edges;
        }
        const edgeList = [];
        const T = safeTiers.length;
        if (T < 2) return edgeList;

        // Tier 0 (Clients) -> Tier 1 (Gateway Ingress Node 0, e.g. WAF)
        const t0 = safeTiers[0].nodes;
        const t1 = safeTiers[1].nodes;
        t0.forEach((_, cIdx) => {
          edgeList.push({ from: [0, cIdx], to: [1, 0], type: 'ingress' });
        });

        // Gateway internal pipeline: WAF (1,0) -> Kong (1,1) -> OAuth2 (1,2)
        if (t1.length >= 2) {
          edgeList.push({ from: [1, 0], to: [1, 1], type: 'pipe' });
          if (t1.length >= 3) {
            edgeList.push({ from: [1, 1], to: [1, 2], type: 'auth', dashed: true });
          }
        }

        // Kong Gateway -> Core Services (Tier 2) fan-out
        if (T >= 3) {
          const t2 = safeTiers[2].nodes;
          const gwIdx = t1.length >= 2 ? [1, 1] : [1, 0];
          t2.forEach((_, sIdx) => {
            edgeList.push({ from: gwIdx, to: [2, sIdx], type: 'dispatch' });
          });
        }

        // Core Services (Tier 2) -> Storage (Tier 3)
        if (T >= 4) {
          const t2 = safeTiers[2].nodes;
          const t3 = safeTiers[3].nodes;
          if (t3.length > 0) {
            t2.forEach((_, sIdx) => {
              const primaryDb = sIdx % t3.length;
              edgeList.push({ from: [2, sIdx], to: [3, primaryDb], type: 'persist' });
              // Shared cache / vector connections
              if (primaryDb !== 0 && sIdx % 2 === 0) {
                edgeList.push({ from: [2, sIdx], to: [3, 0], type: 'cache', dashed: true });
              }
            });
          }
        }

        return edgeList;
      }, [safeTiers, edges]);

      // Compute dynamic SVG curves matching exact 880px handle coordinates
      const svgEdges = useMemo(() => {
        const T = safeTiers.length;
        if (T === 0) return [];

        const colLefts = [0, 223.33, 446.66, 670];
        const cardYCenters = [73, 147, 221];

        return dynamicEdges.map((e, idx) => {
          const [fTi, fNi] = e.from;
          const [tTi, tNi] = e.to;

          const fromKey = `${fTi}-${fNi}`;
          const toKey = `${tTi}-${tNi}`;
          const isConnected = hoveredNode ? (hoveredNode === fromKey || hoveredNode === toKey) : false;

          let d = '';
          if (tTi > fTi) {
            // Forward inter-tier connection: from col A right handle to col B left handle
            const x1 = (colLefts[fTi] !== undefined ? colLefts[fTi] : (fTi * 223.33)) + 202;
            const y1 = cardYCenters[fNi] !== undefined ? cardYCenters[fNi] : (73 + fNi * 74);
            const x2 = (colLefts[tTi] !== undefined ? colLefts[tTi] : (tTi * 223.33)) + 8;
            const y2 = cardYCenters[tNi] !== undefined ? cardYCenters[tNi] : (73 + tNi * 74);
            const dx = x2 - x1;

            if (Math.abs(y1 - y2) < 4) {
              d = `M ${x1} ${y1} L ${x2} ${y2}`;
            } else {
              d = `M ${x1} ${y1} C ${x1 + dx * 0.55} ${y1}, ${x2 - dx * 0.55} ${y2}, ${x2} ${y2}`;
            }
          } else if (tTi === fTi) {
            // Internal intra-tier connection (e.g. WAF -> Kong, Kong -> OAuth2 in Tier 1)
            const colL = colLefts[fTi] !== undefined ? colLefts[fTi] : (fTi * 223.33);
            const cardCenterX = colL + 105;
            const y1 = (cardYCenters[fNi] !== undefined ? cardYCenters[fNi] : (73 + fNi * 74)) + 31;
            const y2 = (cardYCenters[tNi] !== undefined ? cardYCenters[tNi] : (73 + tNi * 74)) - 31;
            d = `M ${cardCenterX} ${y1} L ${cardCenterX} ${y2}`;
          }

          return {
            key: idx,
            d,
            dashed: e.dashed,
            fromKey,
            toKey,
            isConnected
          };
        });
      }, [safeTiers, dynamicEdges, hoveredNode]);

      const defaultRole = (ti, ni) => {
        if (ti === 0) return '客户端接入';
        if (ti === 1) return ni === 0 ? '安全过滤与防护' : ni === 1 ? '动态路由分发' : '鉴权与凭证校验';
        if (ti === 2) return ni === 0 ? '智能 Agent 核心' : ni === 1 ? '动态界面渲染' : '流程与调度引擎';
        return ni === 0 ? '高速分布式缓存' : ni === 1 ? '核心关系型业务库' : '高维语义向量存储';
      };

      return h('div', { className: 'dgen-diagram-block' },
        h('div', { className: 'dgen-rf-toolbar' },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            h('h3', { className: 'dgen-node-title' }, title || '分布式系统架构拓扑 (Architecture)'),
            h('span', {
              style: {
                fontSize: '10px',
                padding: '2px 7px',
                borderRadius: '4px',
                background: mode === 'mermaid' ? 'color-mix(in srgb, var(--dsw-alias-brand-primary,#3b82f6) 12%, transparent)' : 'color-mix(in srgb, #8b5cf6 14%, transparent)',
                color: mode === 'mermaid' ? 'var(--dsw-alias-brand-primary,#3b82f6)' : '#8b5cf6',
                fontWeight: 600
              }
            }, mode === 'mermaid' ? 'Mermaid 规范拓扑 (精准 DAG)' : '交互式泳道拓扑')
          ),
          h('div', { style: { display: 'flex', gap: '6px' } },
            h('button', {
              className: 'dgen-btn-xs',
              style: mode === 'mermaid' ? {
                background: 'color-mix(in srgb, var(--dsw-alias-brand-primary,#3b82f6) 12%, transparent)',
                color: 'var(--dsw-alias-brand-primary,#3b82f6)',
                borderColor: 'var(--dsw-alias-brand-primary,#3b82f6)',
                fontWeight: 600
              } : {},
              onClick: () => setMode('mermaid')
            }, '📊 Mermaid 规范视图'),
            h('button', {
              className: 'dgen-btn-xs',
              style: mode === 'topology' ? {
                background: 'color-mix(in srgb, var(--dsw-alias-brand-primary,#3b82f6) 12%, transparent)',
                color: 'var(--dsw-alias-brand-primary,#3b82f6)',
                borderColor: 'var(--dsw-alias-brand-primary,#3b82f6)',
                fontWeight: 600
              } : {},
              onClick: () => setMode('topology')
            }, '⚡ 交互泳道画布'),
            h('button', {
              className: 'dgen-btn-xs',
              onClick: handleCopyMermaid
            }, copied ? '✓ 已复制语法' : '📋 复制 Mermaid')
          )
        ),
        mode === 'mermaid' ? (
          h('div', { style: { marginTop: '12px' } },
            h(MermaidDiagramBody, { code: mmdCode })
          )
        ) : (
          h('div', { className: 'dgen-rf-box' },
            h('div', { className: 'dgen-rf-canvas-inner' },
              h('svg', {
                className: 'dgen-rf-svg',
                viewBox: '0 0 880 272',
                preserveAspectRatio: 'none'
              },
                h('defs', null,
                  h('marker', { id: 'rf-arrow', viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto' },
                    h('path', { d: 'M 0 1.5 L 8 5 L 0 8.5 z', fill: '#2563eb' })
                  )
                ),
                svgEdges.map((edge) => {
                  const isActive = !hoveredNode || edge.isConnected;
                  return h('path', {
                    key: edge.key,
                    d: edge.d,
                    fill: 'none',
                    stroke: isActive ? '#2563eb' : 'var(--dsw-alias-border-l4)',
                    strokeWidth: edge.isConnected ? '2.4' : '1.6',
                    strokeDasharray: edge.dashed ? '4 4' : (isActive ? '5 5' : 'none'),
                    className: isActive ? 'dgen-flow-edge dgen-flow-edge-active' : 'dgen-flow-edge-dim',
                    markerEnd: 'url(#rf-arrow)'
                  });
                })
              ),
              h('div', { className: 'dgen-rf-grid' },
                safeTiers.map((tier, ti) =>
                  h('div', { key: ti, className: 'dgen-rf-tier' },
                    h('div', { className: 'dgen-rf-tier-title', title: tier.name },
                      h('span', null, ['🌐', '🛡️', '⚙️', '🗄️'][ti % 4]),
                      tier.name
                    ),
                    (tier.nodes || []).map((node, ni) => {
                      const nodeKey = `${ti}-${ni}`;
                      const isHovered = hoveredNode === nodeKey;
                      return h('div', {
                        key: ni,
                        className: 'dgen-rf-node' + (isHovered ? ' active' : ''),
                        onMouseEnter: () => setHoveredNode(nodeKey),
                        onMouseLeave: () => setHoveredNode(null),
                      },
                        ti > 0 && h('span', { className: 'dgen-rf-handle dgen-rf-handle-in' }),
                        h('div', { className: 'dgen-rf-node-head', title: node.name },
                          h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, node.name)
                        ),
                        h('div', { className: 'dgen-rf-node-sub' },
                          h('span', null, node.role || defaultRole(ti, ni)),
                          node.badge && h('span', { className: 'dgen-rf-node-sla' }, node.badge)
                        ),
                        ti < safeTiers.length - 1 && h('span', { className: 'dgen-rf-handle dgen-rf-handle-out' })
                      );
                    })
                  )
                )
              )
            )
          )
        )
      );
    }


    /**
     * Component: HeatmapChart (Full Thermal Matrix with Day/Hour Axes & Tooltip)
     */
    function HeatmapChart({ title, dataset }) {
      const [hoveredCell, setHoveredCell] = useState(null);

      const WEEKDAYS = ['周一 (Mon)', '周二 (Tue)', '周三 (Wed)', '周四 (Thu)', '周五 (Fri)', '周六 (Sat)', '周日 (Sun)'];
      const TIME_SLOTS = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

      const MATRIX = dataset || [
        [12,  8,  6, 25, 75, 88, 55, 92, 85, 62, 38, 20],
        [15, 10,  8, 30, 82, 95, 60, 98, 90, 70, 42, 22],
        [18, 12, 10, 35, 88, 98, 65, 100, 95, 75, 45, 25],
        [16, 11,  9, 32, 80, 92, 58, 96, 88, 68, 40, 22],
        [14,  9,  7, 28, 72, 85, 62, 82, 75, 60, 48, 30],
        [20, 15, 10, 15, 30, 45, 52, 65, 70, 72, 65, 40],
        [18, 12,  8, 12, 25, 40, 48, 58, 68, 78, 55, 28],
      ];

      const getHeatStyle = (val) => {
        let bg;
        if (val < 18) {
          bg = 'color-mix(in srgb, var(--dsw-alias-brand-primary,#3b82f6) 8%, var(--dsw-alias-bg-layer-1))';
        } else if (val < 40) {
          bg = 'color-mix(in srgb, var(--dsw-alias-brand-primary,#3b82f6) 26%, var(--dsw-alias-bg-layer-1))';
        } else if (val < 65) {
          bg = 'color-mix(in srgb, var(--dsw-alias-brand-primary,#3b82f6) 52%, var(--dsw-alias-bg-layer-1))';
        } else if (val < 85) {
          bg = 'color-mix(in srgb, var(--dsw-alias-brand-primary,#3b82f6) 78%, var(--dsw-alias-bg-layer-1))';
        } else {
          bg = 'var(--dsw-alias-brand-primary,#3b82f6)';
        }
        return {
          background: bg,
          borderColor: val > 65 ? 'var(--dsw-alias-brand-primary,#3b82f6)' : 'var(--dsw-alias-border-l4)',
        };
      };

      return h('div', { className: 'dgen-chart-block' },
        h('div', { className: 'dgen-node-card-head' },
          h('div', null,
            h('h3', { className: 'dgen-node-title' }, title || '全时段请求热度分布 (24h Traffic Density)'),
            h('p', { className: 'dgen-node-desc' }, '以周为周期、2 小时为粒度的服务集群 QPS 吞吐热度监控')
          ),
          hoveredCell ? h('span', {
            style: {
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'color-mix(in srgb, var(--dsw-alias-brand-primary,#3b82f6) 12%, transparent)',
              color: 'var(--dsw-alias-brand-primary,#3b82f6)'
            }
          }, WEEKDAYS[hoveredCell.r] + ' ' + TIME_SLOTS[hoveredCell.c] + ' · ' + Math.round(hoveredCell.val * 52) + ' QPS (热度 ' + hoveredCell.val + '%)') : null
        ),
        h('div', { className: 'dgen-heatmap-wrap' },
          h('div', { className: 'dgen-heatmap-grid' },
            h('div', null),
            TIME_SLOTS.map((slot, ci) =>
              h('div', { key: ci, className: 'dgen-heatmap-hcell' }, slot)
            ),
            MATRIX.map((rowVals, ri) =>
              h(React.Fragment, { key: ri },
                h('div', { className: 'dgen-heatmap-ylabel' }, WEEKDAYS[ri].slice(0, 2)),
                rowVals.map((val, ci) => {
                  const style = getHeatStyle(val);
                  return h('div', {
                    key: ci,
                    className: 'dgen-heatmap-cell',
                    style,
                    onMouseEnter: () => setHoveredCell({ r: ri, c: ci, val }),
                    onMouseLeave: () => setHoveredCell(null),
                    title: WEEKDAYS[ri] + ' ' + TIME_SLOTS[ci] + ': 热度 ' + val + '%, QPS: ' + Math.round(val * 52)
                  });
                })
              )
            )
          )
        ),
        h('div', { className: 'dgen-heatmap-legend' },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            h('span', null, '图例:'),
            h('span', { style: { color: 'var(--dsw-alias-label-tertiary)' } }, '低负载 (0 QPS)'),
            h('div', { className: 'dgen-heatmap-ramp' },
              [10, 30, 50, 75, 95].map((level, i) =>
                h('span', { key: i, className: 'dgen-heatmap-swatch', style: getHeatStyle(level) })
              )
            ),
            h('span', { style: { color: 'var(--dsw-alias-label-tertiary)' } }, '高负载 (> 5,000 QPS)')
          ),
          h('div', { style: { display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--dsw-alias-label-secondary)' } },
            h('span', null, '周总吞吐: 28.4M 请求'),
            h('span', null, '峰值时段: 周三 14:00 (5,200 QPS)')
          )
        )
      );
    }

    /**
     * Component: SafeImage (CSP-Safe, Non-Blocking, Error-Fallback & Lightbox Zoom)
     */
    function SafeImage({ src, alt, caption, aspectRatio, width, height, preview = true }) {
      const [status, setStatus] = useState('loading'); // 'loading' | 'loaded' | 'error'
      const [modalOpen, setModalOpen] = useState(false);

      const isSafeUrl = useMemo(() => {
        if (!src || typeof src !== 'string') return false;
        const clean = src.trim().toLowerCase();
        return clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:image/') || clean.startsWith('/') || clean.startsWith('./');
      }, [src]);

      return h('div', { className: 'dgen-image-card' },
        h('div', {
          className: 'dgen-image-wrap',
          style: {
            aspectRatio: aspectRatio || 'auto',
            maxHeight: '360px',
            width: width || '100%',
          }
        },
          !isSafeUrl || status === 'error' ? (
            h('div', { className: 'dgen-image-placeholder dgen-image-error' },
              h('span', { style: { fontSize: '24px' } }, '🖼️'),
              h('strong', null, '图片无法加载或协议不安全'),
              h('p', { style: { margin: 0, fontSize: '11px', opacity: 0.8 } }, src ? (src.length > 50 ? src.slice(0, 50) + '...' : src) : '未提供有效图片地址')
            )
          ) : (
            h(React.Fragment, null,
              status === 'loading' && h('div', { className: 'dgen-image-placeholder' },
                h('span', { className: 'dgen-spinner' }),
                h('span', null, '图片载入中...')
              ),
              h('img', {
                src,
                alt: alt || 'GenUI 图片展示',
                className: 'dgen-image-img',
                style: { display: status === 'loading' ? 'none' : 'block' },
                onLoad: () => setStatus('loaded'),
                onError: () => {
                  console.warn('[GenUI Image] Load failed gracefully:', src);
                  setStatus('error');
                },
                onClick: () => {
                  if (preview && status === 'loaded') setModalOpen(true);
                }
              })
            )
          )
        ),
        caption && h('div', { className: 'dgen-image-caption' }, caption),
        modalOpen && h('div', {
          className: 'dgen-image-lightbox',
          onClick: () => setModalOpen(false)
        },
          h('img', { src, alt: alt || '大图预览' }),
          h('div', {
            style: {
              position: 'absolute',
              top: '20px',
              right: '24px',
              color: '#fff',
              fontSize: '28px',
              cursor: 'pointer',
              fontWeight: 300
            }
          }, '✕')
        )
      );
    }

    /**
     * Component: ImageGallery (Thumbnails, Counter & Lightbox)
     */
    function ImageGallery({ items = [], title }) {
      const [currentIndex, setCurrentIndex] = useState(0);
      const safeItems = items && items.length > 0 ? items : [
        { src: getOfflineDemoImage('云原生微服务拓扑', '核心集群多可用区架构全景 (纯离线矢量)', '#3b82f6'), title: '云原生拓扑大图', caption: '核心生产集群多可用区架构拓扑 (100% 纯本地离线矢量)' },
        { src: getOfflineDemoImage('智能监控与流量分析', '全链路延迟与微服务吞吐看板 (纯离线矢量)', '#8b5cf6'), title: '智能监控大屏', caption: '全链路延迟与微服务流量追踪 (100% 纯本地离线矢量)' },
        { src: getOfflineDemoImage('分布式边缘加速节点', '多副本容灾与边缘计算单元 (纯离线矢量)', '#10b981'), title: '硬件基础设施', caption: '边缘加速计算节点与缓存层 (100% 纯本地离线矢量)' }
      ];
      const current = safeItems[currentIndex] || safeItems[0] || {};

      return h('div', { className: 'dgen-gallery-block' },
        h('div', { className: 'dgen-node-card-head' },
          h('h3', { className: 'dgen-node-title' }, title || '多媒体画廊 (Image Gallery)'),
          h('span', { className: 'dgen-version-badge' }, (currentIndex + 1) + ' / ' + safeItems.length)
        ),
        h(SafeImage, {
          src: current.src,
          alt: current.title,
          caption: current.caption || current.title,
          aspectRatio: '16/9'
        }),
        safeItems.length > 1 && h('div', { className: 'dgen-gallery-thumbs' },
          safeItems.map((it, idx) =>
            h('div', {
              key: idx,
              className: 'dgen-gallery-thumb' + (idx === currentIndex ? ' active' : ''),
              onClick: () => setCurrentIndex(idx)
            },
              h('img', { src: it.src, alt: it.title || ('图 ' + (idx + 1)) })
            )
          )
        )
      );
    }

    /**
     * Component: AudioPlayer (Waveform, Scrub Bar & Safe Controls)
     */
    function AudioPlayer({ src, title, duration, author }) {
      const [playing, setPlaying] = useState(false);
      const [progress, setProgress] = useState(30);

      return h('div', { className: 'dgen-media-block' },
        h('div', { className: 'dgen-node-card-head' },
          h('div', null,
            h('h3', { className: 'dgen-node-title' }, title || '音频多媒体播放器 (Audio Player)'),
            author && h('p', { className: 'dgen-node-desc' }, author)
          ),
          h('span', { className: 'dgen-version-badge' }, duration || '03:12')
        ),
        h('div', { className: 'dgen-audio-box' },
          h('button', {
            type: 'button',
            className: 'dgen-btn-primary',
            style: { width: '36px', height: '36px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' },
            onClick: () => setPlaying(!playing)
          }, playing ? '⏸' : '▶'),
          h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' } },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--dsw-alias-label-secondary)' } },
              h('span', null, playing ? '播放中...' : '已暂停'),
              h('span', null, duration || '03:12')
            ),
            h('input', {
              type: 'range',
              min: 0,
              max: 100,
              value: progress,
              className: 'dgen-range-input',
              style: { width: '100%', margin: 0 },
              onChange: (e) => setProgress(Number(e.target.value))
            })
          ),
          h('div', { className: 'dgen-audio-wave' },
            [1, 2, 3, 4, 5, 6].map((bar, i) =>
              h('span', {
                key: i,
                className: 'dgen-audio-bar',
                style: {
                  animationPlayState: playing ? 'running' : 'paused',
                  animationDelay: (i * 0.15) + 's',
                  height: playing ? undefined : '6px'
                }
              })
            )
          )
        )
      );
    }

    /**
     * Component: VideoPlayer (Native Container with Poster & Fallback)
     */
    function VideoPlayer({ src, poster, title, duration }) {
      return h('div', { className: 'dgen-media-block' },
        h('div', { className: 'dgen-node-card-head' },
          h('h3', { className: 'dgen-node-title' }, title || '视频多媒体播放器 (Video Player)'),
          duration && h('span', { className: 'dgen-version-badge' }, duration)
        ),
        h('div', { className: 'dgen-video-wrap' },
          src ? h('video', {
            src,
            poster,
            controls: true,
            style: { width: '100%', maxHeight: '320px', borderRadius: '6px' }
          }) : h('div', {
            style: {
              aspectRatio: '16/9',
              background: 'var(--dsw-alias-bg-layer-1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--dsw-alias-label-secondary)'
            }
          },
            h('span', { style: { fontSize: '32px' } }, '🎬'),
            h('strong', null, '视频媒体载入容器 (Video Player Ready)'),
            h('span', { style: { fontSize: '11px', opacity: 0.8 } }, '支持 MP4、WebM、HLS 流式协议播放')
          )
        )
      );
    }

    /**
     * Component: DiffViewer (Git-Style Split/Unified Code Difference)
     */
    function DiffViewer({ title, oldHeader, newHeader, diffText, lines }) {
      const parsedLines = useMemo(() => {
        if (lines && Array.isArray(lines)) return lines;
        if (diffText && typeof diffText === 'string') {
          return diffText.split('\n').map((l, i) => {
            if (l.startsWith('+')) return { type: 'add', content: l.slice(1), oldNum: null, newNum: i + 1 };
            if (l.startsWith('-')) return { type: 'del', content: l.slice(1), oldNum: i + 1, newNum: null };
            return { type: 'same', content: l.startsWith(' ') ? l.slice(1) : l, oldNum: i + 1, newNum: i + 1 };
          });
        }
        return [
          { type: 'same', content: 'const server = express();', oldNum: 1, newNum: 1 },
          { type: 'del', content: 'server.use(cors({ origin: "*" })); // ⚠️ 存在通配符安全隐患', oldNum: 2, newNum: null },
          { type: 'add', content: 'server.use(cors({ origin: allowedOrigins, credentials: true })); // ✓ 精确放行白名单', oldNum: null, newNum: 2 },
          { type: 'same', content: 'server.listen(port);', oldNum: 3, newNum: 3 },
        ];
      }, [lines, diffText]);

      return h('div', { className: 'dgen-diff-card' },
        h('div', { className: 'dgen-node-card-head' },
          h('h3', { className: 'dgen-node-title' }, title || '代码变更版本对比 (Diff Viewer)'),
          h('div', { style: { display: 'flex', gap: '8px', fontSize: '11px' } },
            h('span', { style: { color: '#dc2626', fontWeight: 600 } }, '- ' + (oldHeader || '源版本 (v1.0)')),
            h('span', { style: { color: '#16a34a', fontWeight: 600 } }, '+ ' + (newHeader || '修复后版本 (v1.1)'))
          )
        ),
        h('div', { className: 'dgen-diff-box' },
          parsedLines.map((line, idx) =>
            h('div', { key: idx, className: 'dgen-diff-row dgen-diff-' + line.type },
              h('span', { className: 'dgen-diff-num' }, line.type === 'add' ? '+' : line.type === 'del' ? '-' : (line.newNum || line.oldNum || ' ')),
              h('span', { className: 'dgen-diff-content' }, line.content)
            )
          )
        )
      );
    }

    /**
     * Component: JsonViewer (Collapsible Interactive JSON Explorer)
     */
    function JsonViewer({ title, data }) {
      const [collapsed, setCollapsed] = useState({});
      const [copied, setCopied] = useState(false);

      const toggle = (path) => {
        setCollapsed(prev => ({ ...prev, [path]: !prev[path] }));
      };

      const jsonStr = useMemo(() => {
        try {
          return JSON.stringify(data, null, 2);
        } catch (_) {
          return String(data);
        }
      }, [data]);

      const handleCopy = () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(jsonStr);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      };

      const renderValue = (val, path = 'root', depth = 0) => {
        if (val === null) return h('span', { style: { color: '#a0aec0' } }, 'null');
        if (typeof val === 'boolean') return h('span', { style: { color: '#805ad5', fontWeight: 600 } }, String(val));
        if (typeof val === 'number') return h('span', { style: { color: 'var(--dsw-alias-brand-primary,#3b82f6)', fontWeight: 600 } }, String(val));
        if (typeof val === 'string') return h('span', { style: { color: '#38a169' } }, '"' + val + '"');

        const isArr = Array.isArray(val);
        const keys = isArr ? val : Object.keys(val);
        const isCollapsed = collapsed[path];

        return h('div', { style: { paddingLeft: depth > 0 ? '16px' : '0' } },
          h('span', {
            style: { cursor: 'pointer', userSelect: 'none', color: 'var(--dsw-alias-label-tertiary)', marginRight: '4px' },
            onClick: () => toggle(path)
          }, isCollapsed ? '▶ ' : '▼ '),
          h('span', { style: { color: 'var(--dsw-alias-label-secondary)' } }, isArr ? ('Array(' + val.length + ') [') : '{'),
          isCollapsed ? (
            h('span', { style: { color: 'var(--dsw-alias-label-tertiary)', margin: '0 4px', cursor: 'pointer' }, onClick: () => toggle(path) }, '...')
          ) : (
            h('div', null,
              keys.map((k, idx) => {
                const itemKey = isArr ? idx : k;
                const itemVal = isArr ? k : val[k];
                const childPath = path + '.' + itemKey;
                return h('div', { key: idx, style: { lineHeight: '1.6' } },
                  !isArr && h('span', { style: { color: 'var(--dsw-alias-label-primary)', fontWeight: 500 } }, '"' + k + '": '),
                  renderValue(itemVal, childPath, depth + 1)
                );
              })
            )
          ),
          h('span', { style: { color: 'var(--dsw-alias-label-secondary)' } }, isArr ? ']' : '}')
        );
      };

      const sampleData = data || {
        protocol: 'agent-genui',
        version: '1.0',
        metadata: { agent: 'DeepSeek-V3', latency: '38ms' },
        nodes: [
          { type: 'chart', id: 'c1', rendered: true },
          { type: 'diagram', id: 'd1', engine: 'mermaid' }
        ]
      };

      return h('div', { className: 'dgen-json-card' },
        h('div', { className: 'dgen-node-card-head' },
          h('h3', { className: 'dgen-node-title' }, title || 'JSON 数据树结构 (JSON Viewer)'),
          h('button', {
            className: 'dgen-btn-xs',
            onClick: handleCopy
          }, copied ? '✓ 已复制' : '复制 JSON')
        ),
        h('div', {
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '11px',
            padding: '10px 12px',
            borderRadius: '6px',
            background: 'var(--dsw-alias-bg-layer-1)',
            border: '1px solid var(--dsw-alias-border-l4)',
            maxHeight: '300px',
            overflowY: 'auto'
          }
        },
          renderValue(sampleData)
        )
      );
    }

    /**
     * Component: TreeView (Directory & Component Hierarchy Explorer)
     */
    function TreeView({ title, items = [] }) {
      const [expanded, setExpanded] = useState({ 'root': true, '0-0': true, '0-1': true });

      const toggle = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
      };

      const renderNodes = (nodes, parentPath = '0', level = 0) => {
        return nodes.map((node, i) => {
          const curPath = parentPath + '-' + i;
          const isFolder = node.children && node.children.length > 0;
          const isOpen = expanded[curPath];

          return h('div', { key: curPath },
            h('div', {
              className: 'dgen-tree-node',
              style: { paddingLeft: (level * 16 + 6) + 'px' },
              onClick: () => isFolder && toggle(curPath)
            },
              isFolder && h('span', { style: { fontSize: '10px', width: '12px', color: 'var(--dsw-alias-label-tertiary)' } }, isOpen ? '▼' : '▶'),
              h('span', null, isFolder ? (isOpen ? '📂' : '📁') : (node.icon || '📄')),
              h('span', { style: { fontWeight: isFolder ? 600 : 400, color: 'var(--dsw-alias-label-primary)' } }, node.name || node.label),
              node.badge && h('span', { className: 'dgen-version-badge', style: { marginLeft: 'auto', fontSize: '9px' } }, node.badge)
            ),
            isFolder && isOpen && renderNodes(node.children, curPath, level + 1)
          );
        });
      };

      const defaultTree = [
        {
          name: 'deepseek-genui',
          children: [
            {
              name: 'src/components',
              children: [
                { name: 'HeatmapChart.jsx', badge: 'v1.0' },
                { name: 'MermaidEngine.jsx', badge: 'offline' },
                { name: 'SafeImage.jsx', badge: 'fault-tolerant' },
                { name: 'DiffViewer.jsx' }
              ]
            },
            {
              name: 'dsl/runtime',
              children: [
                { name: 'validator.js' },
                { name: 'normalizer.js' }
              ]
            },
            { name: 'package.json', badge: 'v1.0.0' },
            { name: 'README.md' }
          ]
        }
      ];

      return h('div', { className: 'dgen-tree-card' },
        h('div', { className: 'dgen-node-card-head' },
          h('h3', { className: 'dgen-node-title' }, title || '项目文件目录树 (Tree View)'),
          h('span', { className: 'dgen-version-badge' }, 'File Tree')
        ),
        h('div', { className: 'dgen-tree-box' },
          renderNodes(items.length > 0 ? items : defaultTree)
        )
      );
    }

    /**
     * Component: TerminalViewer (Simulated Bash Console)
     */
    function TerminalViewer({ title, logs = [], cwd }) {
      const defaultLogs = [
        { type: 'command', text: '$ agy plugin reload deepseek-genui' },
        { type: 'info', text: '[INFO] Initializing GenUI runtime with 7-dimensional component system...' },
        { type: 'success', text: '[SUCCESS] HeatmapChart and SafeRendererHost registered.' },
        { type: 'success', text: '[SUCCESS] Host slot isolation boundary verified (0 uncaught exceptions).' },
        { type: 'info', text: '[READY] Local static vendor ready on /deepseek-genui/vendor/mermaid.min.js' }
      ];

      const logList = logs.length > 0 ? logs : defaultLogs;

      return h('div', { className: 'dgen-terminal-box' },
        h('div', { className: 'dgen-terminal-head' },
          h('div', { className: 'dgen-terminal-dots' },
            h('span', { className: 'dgen-terminal-dot', style: { background: '#ff5f56' } }),
            h('span', { className: 'dgen-terminal-dot', style: { background: '#ffbd2e' } }),
            h('span', { className: 'dgen-terminal-dot', style: { background: '#27c93f' } })
          ),
          h('span', { style: { fontSize: '11px', color: '#8b949e' } }, title || ('bash - ' + (cwd || '~/dsh-plugins/deepseek-genui'))),
          h('span', { style: { width: '40px' } })
        ),
        h('div', { className: 'dgen-terminal-body' },
          logList.map((l, i) => {
            const text = typeof l === 'string' ? l : l.text;
            const type = typeof l === 'string' ? 'info' : (l.type || 'info');
            const color = type === 'success' ? '#3fb950' : type === 'error' ? '#f85149' : type === 'command' ? '#58a6ff' : '#c9d1d9';
            return h('div', { key: i, className: 'dgen-terminal-line', style: { color } }, text);
          })
        )
      );
    }

    /**
     * Component: MarkdownRenderer (Safe Markdown parser for headers, lists, quotes)
     */
    function MarkdownRenderer({ content = '', title }) {
      const renderedElements = useMemo(() => {
        const lines = (content || '').split('\n');
        return lines.map((line, i) => {
          if (line.startsWith('### ')) {
            return h('h4', { key: i, style: { margin: '8px 0 4px', fontSize: '13px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, line.slice(4));
          }
          if (line.startsWith('## ')) {
            return h('h3', { key: i, style: { margin: '10px 0 6px', fontSize: '14px', fontWeight: 700, color: 'var(--dsw-alias-label-primary)' } }, line.slice(3));
          }
          if (line.startsWith('# ')) {
            return h('h2', { key: i, style: { margin: '12px 0 8px', fontSize: '16px', fontWeight: 700, color: 'var(--dsw-alias-label-primary)' } }, line.slice(2));
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return h('div', { key: i, style: { display: 'flex', gap: '6px', margin: '3px 0', fontSize: '12px', color: 'var(--dsw-alias-label-primary)' } },
              h('span', { style: { color: 'var(--dsw-alias-brand-primary,#3b82f6)' } }, '•'),
              h('span', null, line.slice(2))
            );
          }
          if (line.startsWith('> ')) {
            return h('blockquote', {
              key: i,
              style: {
                margin: '6px 0',
                padding: '6px 12px',
                borderLeft: '3px solid var(--dsw-alias-brand-primary,#3b82f6)',
                background: 'var(--dsw-alias-bg-layer-1)',
                fontSize: '12px',
                color: 'var(--dsw-alias-label-secondary)'
              }
            }, line.slice(2));
          }
          if (!line.trim()) {
            return h('div', { key: i, style: { height: '6px' } });
          }
          return h('p', { key: i, style: { margin: '4px 0', fontSize: '12px', lineHeight: '1.6', color: 'var(--dsw-alias-label-primary)' } }, line);
        });
      }, [content]);

      return h('div', { className: 'dgen-markdown-block' },
        title && h('h3', { className: 'dgen-node-title', style: { marginBottom: '8px' } }, title),
        h('div', null, renderedElements)
      );
    }

    /**
     * Component: AccordionComponent (Collapsible Panels)
     */
    function AccordionComponent({ title, items = [], context }) {
      const [openIndex, setOpenIndex] = useState(0);

      const safeItems = items && items.length > 0 ? items : [
        { title: '1. 运行时容错与自愈机制', content: '当组件抛出异常时，通过 SafeRendererHost 与 ErrorBoundary 自动隔离，保护宿主 DSH 界面绝不崩溃。' },
        { title: '2. DSH Unified UI 设计系统对齐', content: '全局采用 --dsw-alias-* 变量映射系统主题色，支持亮色/暗色自适应切换。' },
        { title: '3. 离线双引擎图形渲染拓扑', content: '支持 Mermaid 声明式文本图表引擎与 React Flow 交互画布双向自由无缝切换。' }
      ];

      return h('div', { className: 'dgen-accordion-block' },
        title && h('h3', { className: 'dgen-node-title', style: { marginBottom: '10px' } }, title),
        safeItems.map((item, idx) => {
          const isOpen = openIndex === idx;
          return h('div', { key: idx, className: 'dgen-accordion-item' },
            h('div', {
              className: 'dgen-accordion-head',
              onClick: () => setOpenIndex(isOpen ? null : idx)
            },
              h('span', { style: { color: 'var(--dsw-alias-label-primary)' } }, item.title || item.header),
              h('span', { style: { fontSize: '10px', color: 'var(--dsw-alias-label-tertiary)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' } }, '▼')
            ),
            isOpen && h('div', { className: 'dgen-accordion-body' },
              item.content || (item.children && h(RenderGenuiNode, { node: item.children, context }))
            )
          );
        })
      );
    }

    /**
     * Interactive Controls: Input, Select, Switch, Slider, DatePicker
     */
    function InputControl({ label, placeholder, value, context }) {
      const [val, setVal] = useState(value || '');
      const timerRef = useRef(null);
      const lastCommittedRef = useRef(value || '');

      useEffect(() => {
        setVal(value || '');
        lastCommittedRef.current = value || '';
      }, [value]);

      const commit = useCallback((text) => {
        if (text !== lastCommittedRef.current) {
          lastCommittedRef.current = text;
          context?.dispatchEvent?.('input_change', { value: text });
        }
      }, [context]);

      const handleChange = (e) => {
        const text = e.target.value;
        setVal(text);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          commit(text);
        }, 400);
      };

      const handleBlur = (e) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        commit(e.target.value);
      };

      const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
          if (timerRef.current) clearTimeout(timerRef.current);
          commit(e.target.value);
        }
      };

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' } },
        label && h('label', { style: { fontSize: '11px', fontWeight: 600, color: 'var(--dsw-alias-label-secondary)' } }, label),
        h('input', {
          type: 'text',
          className: 'dgen-ctrl-input',
          placeholder: placeholder || '请输入内容...',
          value: val,
          onChange: handleChange,
          onBlur: handleBlur,
          onKeyDown: handleKeyDown
        })
      );
    }

    function SelectControl({ label, options = [], value, context }) {
      const [val, setVal] = useState(value || options[0]?.value || options[0] || '');
      const handleChange = (e) => {
        setVal(e.target.value);
        context?.dispatchEvent?.('select_change', { value: e.target.value });
      };
      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' } },
        label && h('label', { style: { fontSize: '11px', fontWeight: 600, color: 'var(--dsw-alias-label-secondary)' } }, label),
        h('select', {
          className: 'dgen-ctrl-select',
          value: val,
          onChange: handleChange
        },
          options.map((opt, i) =>
            h('option', { key: i, value: typeof opt === 'object' ? opt.value : opt }, typeof opt === 'object' ? opt.label : opt)
          )
        )
      );
    }

    function SwitchControl({ label, checked, context }) {
      const [isOn, setIsOn] = useState(Boolean(checked));
      const handleToggle = () => {
        const next = !isOn;
        setIsOn(next);
        context?.dispatchEvent?.('switch_toggle', { checked: next });
      };
      return h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' } },
        h('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-primary)' } }, label || '开关选项'),
        h('label', { className: 'dgen-switch' },
          h('input', { type: 'checkbox', checked: isOn, onChange: handleToggle }),
          h('span', { className: 'dgen-slider' })
        )
      );
    }

    function SliderControl({ label, min = 0, max = 100, step = 1, value = 50, unit = '', context }) {
      const [val, setVal] = useState(value);
      const lastCommittedRef = useRef(value);

      useEffect(() => {
        setVal(value);
        lastCommittedRef.current = value;
      }, [value]);

      const commit = useCallback((newVal) => {
        if (newVal !== lastCommittedRef.current) {
          lastCommittedRef.current = newVal;
          context?.dispatchEvent?.('slider_change', { value: newVal });
        }
      }, [context]);

      // 1. 拖动过程中：仅高频更新本地数值展示（保证 60fps 平滑视觉），不向外部事件总线抛出高频事件
      const handleInput = (e) => {
        const num = Number(e.target.value);
        setVal(num);
      };

      // 2. 释放拖动（手指抬起/松开鼠标按键/键盘调整完毕）时：仅派发一次最终确定值的提交事件
      const handleCommit = (e) => {
        const num = Number(e.target.value);
        commit(num);
      };

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' } },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '11px' } },
          h('span', { style: { color: 'var(--dsw-alias-label-secondary)', fontWeight: 600 } }, label || '数值调节'),
          h('span', { style: { color: 'var(--dsw-alias-brand-primary,#3b82f6)', fontWeight: 700 } }, val + (unit || ''))
        ),
        h('input', {
          type: 'range',
          min,
          max,
          step,
          value: val,
          className: 'dgen-range-input',
          style: { width: '100%', margin: '4px 0', cursor: 'pointer', accentColor: 'var(--dsw-alias-brand-primary,#3b82f6)' },
          onInput: handleInput,
          onChange: handleInput,
          onPointerUp: handleCommit,
          onMouseUp: handleCommit,
          onTouchEnd: handleCommit,
          onKeyUp: handleCommit,
          onBlur: handleCommit
        })
      );
    }

    function DatePickerControl({ label, value, context }) {
      const [date, setDate] = useState(value || new Date().toISOString().split('T')[0]);
      const handleChange = (e) => {
        setDate(e.target.value);
        context?.dispatchEvent?.('date_change', { date: e.target.value });
      };
      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' } },
        label && h('label', { style: { fontSize: '11px', fontWeight: 600, color: 'var(--dsw-alias-label-secondary)' } }, label),
        h('input', {
          type: 'date',
          className: 'dgen-ctrl-input',
          value: date,
          onChange: handleChange
        })
      );
    }

    /**
     * Component: SafeRendererHost (Fault-Tolerant Sandbox Host)
     * Executes renderer functions inside try-catch to guarantee DSH slot isolation.
     */
    function SafeRendererHost({ renderer, node, context }) {
      try {
        return renderer(node.props || {}, {
          ...context,
          componentId: node.id,
          dispatchEvent: (event, payload, category = 'local') => {
            context.onEvent?.({
              protocol: 'agent-genui-event',
              version: '1.0',
              eventId: 'evt_' + Math.random().toString(36).substring(2, 8),
              uiId: context.uiId,
              componentId: node.id,
              event,
              payload,
              category,
              timestamp: new Date().toLocaleTimeString(),
            });
          },
        });
      } catch (err) {
        console.error('[GenUI Host Isolation] Renderer caught exception for node [' + node.type + ']:', err);
        return h('div', { className: 'dgen-fallback-box' },
          h('strong', null, '⚠️ 组件 [' + (node.type || 'unknown') + '] 异常已隔离保护 (宿主正常运行)'),
          h('p', { style: { margin: '4px 0 0', fontSize: '11px', color: 'var(--dsw-alias-label-secondary)' } }, err?.message || '运行时异常')
        );
      }
    }

    /** Component Renderers with DSH Unified UI Variables */
    const Renderers = {
      card(props, context) {
        const items = props.items || props.sections || [];
        return h('div', {
          className: 'dgen-business-card',
          style: {
            boxSizing: 'border-box'
          }
        },
          (props.title || props.header) && h('div', {
            className: 'dgen-node-card-head',
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: items.length > 0 ? '14px' : '8px'
            }
          },
            h('h3', { className: 'dgen-node-title', style: { margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--dsw-alias-label-primary)' } }, props.title || props.header),
            props.badge && h('span', { className: 'dgen-version-badge' }, props.badge),
            props.tone && h('span', { className: 'dgen-version-badge' }, props.tone)
          ),
          props.description && h('p', { className: 'dgen-node-desc', style: { margin: '0 0 12px', fontSize: '13px', color: 'var(--dsw-alias-label-secondary)' } }, props.description),
          items.length > 0 && h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
            items.map((it, idx) => (
              h('div', {
                key: idx,
                style: {
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  paddingTop: idx > 0 ? '12px' : '0',
                  borderTop: idx > 0 ? '1px solid var(--dsw-alias-border-l4, rgba(255,255,255,0.06))' : 'none'
                }
              },
                it.icon && h('div', {
                  style: {
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'color-mix(in srgb, var(--dsw-alias-brand-primary,#3b82f6) 12%, transparent)',
                    color: 'var(--dsw-alias-brand-primary,#3b82f6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                    flexShrink: 0
                  }
                }, it.icon),
                h('div', { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' } },
                  h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
                    h('span', { style: { fontWeight: 650, fontSize: '13.5px', color: 'var(--dsw-alias-label-primary)' } }, it.title || it.label),
                    it.badge && h('span', { className: 'dgen-version-badge' }, it.badge)
                  ),
                  (it.content || it.tags || it.text) && h('div', { style: { fontSize: '12.5px', color: 'var(--dsw-alias-label-secondary)', lineHeight: 1.5 } },
                    Array.isArray(it.tags) ? it.tags.join('、') : (it.content || it.text)
                  ),
                  it.description && h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-tertiary)', lineHeight: 1.5, marginTop: '2px' } }, it.description)
                )
              )
            ))
          ),
          props.content && h('div', { style: { marginTop: '8px', fontSize: '13px' } }, props.content)
        );
      },

      metric(props, context) {
        return h('div', { className: 'dgen-metric-tile' },
          props.title && h('span', {
            style: {
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--dsw-alias-label-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }
          }, props.title),
          h('div', { className: 'dgen-metric-box' },
            h('span', { className: 'dgen-metric-val' }, props.value ?? '--'),
            props.unit && h('span', { className: 'dgen-metric-unit' }, props.unit),
            props.change && h('span', { className: `dgen-metric-change dgen-metric-${props.changeType === 'down' ? 'down' : 'up'}` }, props.change)
          ),
          props.description && h('p', { className: 'dgen-node-desc', style: { fontSize: '11px', color: 'var(--dsw-alias-label-tertiary)', margin: '2px 0 0' } }, props.description)
        );
      },

      code(props) {
        const [copied, setCopied] = useState(false);
        const handleCopy = () => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(props.code || '');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        };

        const lines = (props.code || '').split('\n');

        return h('div', { className: 'dgen-code-card' },
          h('div', { className: 'dgen-code-bar' },
            h('span', { style: { fontSize: '12px', fontWeight: 600, color: 'var(--dsw-alias-label-secondary)' } }, props.language || 'text'),
            h('button', {
              className: 'dgen-btn-xs',
              onClick: handleCopy
            }, copied ? '✓ 已复制' : '复制代码')
          ),
          h('pre', { className: 'dgen-code-body' },
            lines.map((line, idx) =>
              h('div', { key: idx, style: { display: 'flex', gap: '12px' } },
                h('span', { style: { color: 'var(--dsw-alias-label-tertiary)', userSelect: 'none', width: '24px', textAlign: 'right' } }, idx + 1),
                h('span', null, line)
              )
            )
          )
        );
      },

      chart(props) {
        const chartType = props.chartType || 'line';
        const series = props.series || [];

        // 1. Line Chart with Full Cartesian Coordinates (X-axis ticks, labels, grid)
        if (chartType === 'line') {
          const maxVal = Math.max(...series.map((s) => s.value || 0), 100);
          const plotW = 280;
          const plotH = 80;
          const leftX = 45;
          const baseY = 100;

          const pts = series.map((s, idx) => {
            const x = leftX + (idx / Math.max(series.length - 1, 1)) * plotW;
            const y = baseY - (s.value / maxVal) * plotH;
            return `${x},${y}`;
          }).join(' ');

          return h('div', { className: 'dgen-chart-block' },
            props.title && h('h3', { className: 'dgen-node-title' }, props.title),
            h('svg', { viewBox: '0 0 350 135', style: { width: '100%', height: '150px', marginTop: '6px' } },
              // Grid lines & Y scale
              [0, 0.33, 0.66, 1].map((ratio, i) => {
                const y = baseY - ratio * plotH;
                const val = Math.round(ratio * maxVal);
                return h('g', { key: i },
                  h('line', { x1: leftX, y1: y, x2: leftX + plotW, y2: y, stroke: 'var(--dsw-alias-border-l4)', strokeDasharray: i === 0 ? 'none' : '3 3', strokeWidth: 1 }),
                  h('text', { x: leftX - 6, y: y + 3, textAnchor: 'end', fontSize: 9, fill: 'var(--dsw-alias-label-tertiary)' }, val)
                );
              }),
              // Axes
              h('line', { x1: leftX, y1: baseY - plotH - 5, x2: leftX, y2: baseY, stroke: 'var(--dsw-alias-border-l4)', strokeWidth: 1.2 }),
              h('line', { x1: leftX, y1: baseY, x2: leftX + plotW + 10, y2: baseY, stroke: 'var(--dsw-alias-border-l4)', strokeWidth: 1.2 }),
              // Line
              h('polyline', {
                fill: 'none',
                stroke: 'var(--dsw-alias-brand-primary,#3b82f6)',
                strokeWidth: '2.5',
                strokeLinecap: 'round',
                points: pts,
              }),
              // Points & X Labels
              series.map((s, idx) => {
                const cx = leftX + (idx / Math.max(series.length - 1, 1)) * plotW;
                const cy = baseY - (s.value / maxVal) * plotH;
                return h('g', { key: idx },
                  h('circle', { cx, cy, r: 3.5, fill: 'var(--dsw-alias-brand-primary,#3b82f6)', stroke: 'var(--dsw-alias-bg-layer-2)', strokeWidth: 1.5 }),
                  h('line', { x1: cx, y1: baseY, x2: cx, y2: baseY + 4, stroke: 'var(--dsw-alias-border-l4)' }),
                  h('text', { x: cx, y: baseY + 16, textAnchor: 'middle', fill: 'var(--dsw-alias-label-secondary)', fontSize: 9, fontWeight: 500 }, s.label)
                );
              }),
              h('text', { x: leftX + plotW, y: baseY + 28, textAnchor: 'end', fontSize: 9, fill: 'var(--dsw-alias-label-tertiary)' }, '横坐标: 采样时段 (24h)')
            )
          );
        }

        // 2. Area Chart with Full Cartesian Coordinates (X-axis labels, fill gradient)
        if (chartType === 'area') {
          const maxVal = Math.max(...series.map((s) => s.value || 0), 100);
          const plotW = 280;
          const plotH = 80;
          const leftX = 45;
          const baseY = 100;

          const linePts = series.map((s, idx) => {
            const x = leftX + (idx / Math.max(series.length - 1, 1)) * plotW;
            const y = baseY - (s.value / maxVal) * plotH;
            return `${x},${y}`;
          });
          const polyPts = `${leftX},${baseY} ${linePts.join(' ')} ${leftX + plotW},${baseY}`;

          return h('div', { className: 'dgen-chart-block' },
            props.title && h('h3', { className: 'dgen-node-title' }, props.title),
            h('svg', { viewBox: '0 0 350 135', style: { width: '100%', height: '150px', marginTop: '6px' } },
              [0, 0.33, 0.66, 1].map((ratio, i) => {
                const y = baseY - ratio * plotH;
                const val = Math.round(ratio * maxVal);
                return h('g', { key: i },
                  h('line', { x1: leftX, y1: y, x2: leftX + plotW, y2: y, stroke: 'var(--dsw-alias-border-l4)', strokeDasharray: i === 0 ? 'none' : '3 3', strokeWidth: 1 }),
                  h('text', { x: leftX - 6, y: y + 3, textAnchor: 'end', fontSize: 9, fill: 'var(--dsw-alias-label-tertiary)' }, val + 'G')
                );
              }),
              h('line', { x1: leftX, y1: baseY - plotH - 5, x2: leftX, y2: baseY, stroke: 'var(--dsw-alias-border-l4)', strokeWidth: 1.2 }),
              h('line', { x1: leftX, y1: baseY, x2: leftX + plotW + 10, y2: baseY, stroke: 'var(--dsw-alias-border-l4)', strokeWidth: 1.2 }),
              h('polygon', { fill: 'color-mix(in srgb, var(--dsw-alias-brand-primary, #3b82f6) 18%, transparent)', points: polyPts }),
              h('polyline', { fill: 'none', stroke: 'var(--dsw-alias-brand-primary,#3b82f6)', strokeWidth: '2.5', points: linePts.join(' ') }),
              series.map((s, idx) => {
                const cx = leftX + (idx / Math.max(series.length - 1, 1)) * plotW;
                return h('g', { key: idx },
                  h('line', { x1: cx, y1: baseY, x2: cx, y2: baseY + 4, stroke: 'var(--dsw-alias-border-l4)' }),
                  h('text', { x: cx, y: baseY + 16, textAnchor: 'middle', fill: 'var(--dsw-alias-label-secondary)', fontSize: 9, fontWeight: 500 }, s.label)
                );
              }),
              h('text', { x: leftX + plotW, y: baseY + 28, textAnchor: 'end', fontSize: 9, fill: 'var(--dsw-alias-label-tertiary)' }, '横坐标: 监控时间')
            )
          );
        }

        // 3. Bar Chart with Vertical Bars & Clear Horizontal X-Axis
        if (chartType === 'bar') {
          const maxVal = Math.max(...series.map((s) => s.value || 0), 100);
          const plotW = 280;
          const plotH = 80;
          const leftX = 45;
          const baseY = 100;
          const colCount = series.length || 1;
          const slotW = plotW / colCount;
          const barW = Math.min(slotW * 0.55, 34);

          return h('div', { className: 'dgen-chart-block' },
            props.title && h('h3', { className: 'dgen-node-title' }, props.title),
            h('svg', { viewBox: '0 0 350 145', style: { width: '100%', height: '160px', marginTop: '6px' } },
              [0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = baseY - ratio * plotH;
                const val = Math.round(ratio * maxVal);
                return h('g', { key: i },
                  h('line', { x1: leftX, y1: y, x2: leftX + plotW, y2: y, stroke: 'var(--dsw-alias-border-l4)', strokeDasharray: i === 0 ? 'none' : '3 3', strokeWidth: 1 }),
                  h('text', { x: leftX - 6, y: y + 3, textAnchor: 'end', fontSize: 9, fill: 'var(--dsw-alias-label-tertiary)' }, val + '%')
                );
              }),
              h('line', { x1: leftX, y1: baseY - plotH - 5, x2: leftX, y2: baseY, stroke: 'var(--dsw-alias-border-l4)', strokeWidth: 1.2 }),
              h('line', { x1: leftX, y1: baseY, x2: leftX + plotW + 10, y2: baseY, stroke: 'var(--dsw-alias-border-l4)', strokeWidth: 1.2 }),
              series.map((s, i) => {
                const cx = leftX + i * slotW + slotW / 2;
                const hVal = (s.value / maxVal) * plotH;
                const bx = cx - barW / 2;
                const by = baseY - hVal;
                return h('g', { key: i },
                  h('text', { x: cx, y: by - 4, textAnchor: 'middle', fontSize: 9, fontWeight: 600, fill: 'var(--dsw-alias-label-primary)' }, s.value + '%'),
                  h('rect', {
                    x: bx,
                    y: by,
                    width: barW,
                    height: Math.max(hVal, 2),
                    rx: 3,
                    fill: 'var(--dsw-alias-brand-primary,#3b82f6)',
                  }),
                  h('line', { x1: cx, y1: baseY, x2: cx, y2: baseY + 4, stroke: 'var(--dsw-alias-border-l4)' }),
                  h('text', { x: cx, y: baseY + 16, textAnchor: 'middle', fontSize: 9, fontWeight: 500, fill: 'var(--dsw-alias-label-secondary)' }, s.label)
                );
              }),
              h('text', { x: leftX + plotW, y: baseY + 32, textAnchor: 'end', fontSize: 9, fill: 'var(--dsw-alias-label-tertiary)' }, '横坐标: 集群业务模块')
            )
          );
        }

        // 4. Donut / Pie Chart
        if (chartType === 'donut' || chartType === 'pie') {
          const total = series.reduce((acc, s) => acc + (s.value || 0), 0) || 1;
          const colors = ['#3b82f6', '#38a169', '#d69e2e', '#8b5cf6', '#e53e3e'];
          let cumulativeAngle = 0;

          return h('div', { className: 'dgen-chart-block' },
            props.title && h('h3', { className: 'dgen-node-title' }, props.title),
            h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px', marginTop: '12px' } },
              h('svg', { viewBox: '0 0 100 100', width: 110, height: 110 },
                series.map((s, i) => {
                  const percent = (s.value || 0) / total;
                  const strokeDasharray = `${percent * 251.2} 251.2`;
                  const strokeDashoffset = -cumulativeAngle * 251.2;
                  cumulativeAngle += percent;
                  return h('circle', {
                    key: i,
                    cx: 50,
                    cy: 50,
                    r: 40,
                    fill: 'transparent',
                    stroke: colors[i % colors.length],
                    strokeWidth: 16,
                    strokeDasharray,
                    strokeDashoffset,
                    transform: 'rotate(-90 50 50)',
                  });
                }),
                h('text', { x: 50, y: 54, textAnchor: 'middle', fontSize: 13, fontWeight: 700, fill: 'var(--dsw-alias-label-primary)' }, `${series[0]?.value || 0}%`)
              ),
              h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' } },
                series.map((s, i) =>
                  h('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                    h('span', { style: { width: '8px', height: '8px', borderRadius: '2px', background: colors[i % colors.length] } }),
                    h('span', { style: { color: 'var(--dsw-alias-label-secondary)' } }, `${s.label} (${Math.round(((s.value || 0) / total) * 100)}%)`)
                  )
                )
              )
            )
          );
        }

        // 5. Gauge Chart
        if (chartType === 'gauge') {
          const val = props.value || 0;
          const pct = Math.min(Math.max(val, 0), 100);

          return h('div', { className: 'dgen-chart-block', style: { alignItems: 'center', textAlign: 'center' } },
            props.title && h('h3', { className: 'dgen-node-title' }, props.title),
            h('svg', { viewBox: '0 0 140 85', width: 160, height: 95, style: { marginTop: '8px' } },
              h('path', { d: 'M 15 75 A 55 55 0 0 1 125 75', fill: 'none', stroke: 'color-mix(in srgb, var(--dsw-alias-border-l4) 50%, transparent)', strokeWidth: 12, strokeLinecap: 'round' }),
              h('path', {
                d: 'M 15 75 A 55 55 0 0 1 125 75',
                fill: 'none',
                stroke: pct > 90 ? '#38a169' : pct > 70 ? '#d69e2e' : '#e53e3e',
                strokeWidth: 12,
                strokeLinecap: 'round',
                strokeDasharray: '172.78',
                strokeDashoffset: 172.78 * (1 - pct / 100),
              }),
              h('text', { x: 70, y: 72, textAnchor: 'middle', fontSize: 22, fontWeight: 700, fill: 'var(--dsw-alias-label-primary)' }, `${val}${props.unit || ''}`)
            ),
            h('span', { style: { fontSize: '11px', color: 'var(--dsw-alias-label-secondary)' } }, `目标基线: ${props.target || 99.9}%`)
          );
        }

        // 6. Scatter Plot with Full Cartesian Coordinates (X-axis ticks: 0, 1000, 2000, 3000, 4000)
        if (chartType === 'scatter') {
          const pts = props.points || [];
          const leftX = 45;
          const baseY = 100;
          const plotW = 280;
          const plotH = 80;

          return h('div', { className: 'dgen-chart-block' },
            props.title && h('h3', { className: 'dgen-node-title' }, props.title),
            h('svg', { viewBox: '0 0 350 145', style: { width: '100%', height: '160px', marginTop: '6px' } },
              [0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = baseY - ratio * plotH;
                const val = Math.round(ratio * 160);
                return h('g', { key: i },
                  h('line', { x1: leftX, y1: y, x2: leftX + plotW, y2: y, stroke: 'var(--dsw-alias-border-l4)', strokeDasharray: i === 0 ? 'none' : '3 3', strokeWidth: 1 }),
                  h('text', { x: leftX - 6, y: y + 3, textAnchor: 'end', fontSize: 9, fill: 'var(--dsw-alias-label-tertiary)' }, val + 'ms')
                );
              }),
              h('line', { x1: leftX, y1: baseY - plotH - 5, x2: leftX, y2: baseY, stroke: 'var(--dsw-alias-border-l4)', strokeWidth: 1.2 }),
              h('line', { x1: leftX, y1: baseY, x2: leftX + plotW + 10, y2: baseY, stroke: 'var(--dsw-alias-border-l4)', strokeWidth: 1.2 }),
              [0, 1000, 2000, 3000, 4000].map((tVal, ti) => {
                const tx = leftX + (tVal / 4000) * plotW;
                return h('g', { key: ti },
                  h('line', { x1: tx, y1: baseY, x2: tx, y2: baseY + 4, stroke: 'var(--dsw-alias-border-l4)' }),
                  h('text', { x: tx, y: baseY + 16, textAnchor: 'middle', fontSize: 9, fill: 'var(--dsw-alias-label-secondary)' }, tVal === 0 ? '0' : (tVal / 1000) + 'k')
                );
              }),
              h('text', { x: leftX + plotW, y: baseY + 30, textAnchor: 'end', fontSize: 9, fill: 'var(--dsw-alias-label-tertiary)' }, '横坐标: Prompt 规模 (Tokens)'),
              pts.map((p, idx) => {
                const cx = leftX + (p.x / 4000) * plotW;
                const cy = baseY - (p.y / 160) * plotH;
                return h('circle', {
                  key: idx,
                  cx,
                  cy,
                  r: 4.5,
                  fill: 'var(--dsw-alias-brand-primary,#3b82f6)',
                  stroke: 'var(--dsw-alias-bg-layer-2)',
                  strokeWidth: 1.5,
                });
              })
            )
          );
        }

        // 7. Heatmap (Professional Thermal Gradient Matrix with Day & Hour Axes)
        if (chartType === 'heatmap') {
          return h(HeatmapChart, {
            title: props.title,
            dataset: props.dataset,
          });
        }

        return h('div', null, '未知图表格式');
      },

      diagram(props) {
        const diagramType = props.diagramType || (props.mermaidCode ? 'mermaid' : 'flowchart');

        // 0. Direct Raw Mermaid Code
        if (props.mermaidCode || diagramType === 'mermaid') {
          return h(MermaidDiagram, {
            code: props.mermaidCode || 'flowchart LR\n  A --> B',
            title: props.title || 'Mermaid 架构图表',
          });
        }

        // 1. Flowchart
        if (diagramType === 'flowchart') {
          const nodes = props.nodes || [];
          const edges = props.edges || [];
          const mmdCode = compileFlowchartToMermaid(nodes, edges, props.direction || 'LR');

          const fallbackSvg = () => h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', padding: '12px 0' } },
            nodes.map((n, i) =>
              h(React.Fragment, { key: n.id },
                h('div', {
                  style: {
                    padding: '8px 14px',
                    borderRadius: n.shape === 'round' ? '999px' : '8px',
                    background: 'var(--dsw-alias-bg-layer-1)',
                    border: '1px solid var(--dsw-alias-border-l4)',
                    color: 'var(--dsw-alias-label-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                  },
                }, n.label),
                i < nodes.length - 1 && h('span', { style: { color: 'var(--dsw-alias-brand-primary,#3b82f6)', fontWeight: 700 } }, '➔')
              )
            )
          );

          return h(MermaidDiagram, {
            code: mmdCode,
            fallbackSvg,
            title: props.title || '业务流程链路图 (Flowchart)',
          });
        }

        // 2. Architecture Diagram (Mermaid DAG & Interactive Canvas)
        if (diagramType === 'architecture') {
          return h(ReactFlowArchitecture, {
            tiers: props.tiers,
            edges: props.edges,
            title: props.title || '分布式系统架构拓扑 (Architecture)',
          });
        }

        // 3. Sequence Diagram (Compiles to Mermaid sequenceDiagram with SVG Lifelines Fallback)
        if (diagramType === 'sequence') {
          const actors = props.actors || ['User 用户', 'Agent 核心', 'GenUI 运行时', 'Tool 服务端'];
          const steps = props.steps || [];
          const mmdCode = compileSequenceToMermaid(actors, steps);

          const fallbackSvg = () => {
            const svgWidth = 600;
            const actorCount = actors.length;
            const spacing = (svgWidth - 100) / Math.max(actorCount - 1, 1);
            const actorPositions = actors.map((_, i) => 50 + i * spacing);
            const totalHeight = 80 + steps.length * 48;

            return h('svg', {
              viewBox: `0 0 ${svgWidth} ${totalHeight}`,
              style: { width: '100%', height: 'auto', display: 'block', margin: '10px 0' }
            },
              h('defs', null,
                h('marker', { id: 'dgen-seq-arr', viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto' },
                  h('path', { d: 'M 0 1 L 10 5 L 0 9 z', fill: 'var(--dsw-alias-brand-primary,#3b82f6)' })
                )
              ),
              actors.map((act, i) => {
                const x = actorPositions[i];
                return h('g', { key: i },
                  h('line', { x1: x, y1: 34, x2: x, y2: totalHeight - 20, stroke: 'var(--dsw-alias-border-l4)', strokeDasharray: '4 4' }),
                  h('rect', { x: x - 45, y: 6, width: 90, height: 28, rx: 6, fill: 'var(--dsw-alias-bg-layer-2)', stroke: 'var(--dsw-alias-border-l4)' }),
                  h('text', { x: x, y: 24, textAnchor: 'middle', fontSize: '11', fontWeight: '600', fill: 'var(--dsw-alias-label-primary)' }, act)
                );
              }),
              steps.map((st, i) => {
                const y = 64 + i * 46;
                const fromIdx = Math.max(0, actors.indexOf(st.from));
                const toIdx = Math.max(0, actors.indexOf(st.to));
                const x1 = actorPositions[fromIdx];
                const x2 = actorPositions[toIdx];
                const isReturn = (st.msg || '').includes('返回') || (st.msg || '').includes('响应');

                if (x1 === x2) {
                  return h('g', { key: i },
                    h('path', { d: `M ${x1} ${y} h 28 v 16 h -28`, fill: 'none', stroke: 'var(--dsw-alias-brand-primary,#3b82f6)', markerEnd: 'url(#dgen-seq-arr)' }),
                    h('text', { x: x1 + 34, y: y + 12, fontSize: '10', fill: 'var(--dsw-alias-label-secondary)' }, st.msg)
                  );
                }

                return h('g', { key: i },
                  h('line', {
                    x1, y1: y, x2, y2: y,
                    stroke: 'var(--dsw-alias-brand-primary,#3b82f6)',
                    strokeWidth: '1.6',
                    strokeDasharray: isReturn ? '4 3' : 'none',
                    markerEnd: 'url(#dgen-seq-arr)'
                  }),
                  h('rect', {
                    x: Math.min(x1, x2) + Math.abs(x1 - x2) / 2 - 75,
                    y: y - 16,
                    width: 150,
                    height: 18,
                    rx: 4,
                    fill: 'var(--dsw-alias-bg-layer-2)',
                    stroke: 'var(--dsw-alias-border-l4)'
                  }),
                  h('text', {
                    x: Math.min(x1, x2) + Math.abs(x1 - x2) / 2,
                    y: y - 3,
                    textAnchor: 'middle',
                    fontSize: '10',
                    fontWeight: '500',
                    fill: 'var(--dsw-alias-label-primary)'
                  }, (i + 1) + '. ' + st.msg)
                );
              })
            );
          };

          return h(MermaidDiagram, {
            code: mmdCode,
            fallbackSvg,
            title: props.title || '通信时序交互流 (Sequence Diagram)',
          });
        }

        // 4. ER Diagram (Compiles to Mermaid erDiagram)
        if (diagramType === 'er') {
          const tables = props.tables || [];
          const relations = props.relations || [];
          const mmdCode = compileErToMermaid(tables, relations);

          return h(MermaidDiagram, {
            code: mmdCode,
            title: props.title || '数据库实体关系模型 (ER Diagram)',
          });
        }

        // 5. State Machine (Compiles to Mermaid stateDiagram-v2)
        if (diagramType === 'stateMachine') {
          const states = props.states || [];
          const transitions = props.transitions || [];
          const mmdCode = compileStateToMermaid(states, transitions);

          return h(MermaidDiagram, {
            code: mmdCode,
            title: props.title || '生命周期状态机 (State Machine)',
          });
        }

        return h('div', null, '未知图表格式');
      },

      table(props, context) {
        const rawRows = useMemo(() => {
          if (Array.isArray(props.rows)) return props.rows;
          if (Array.isArray(props.data)) return props.data;
          if (Array.isArray(props.dataSource)) return props.dataSource;
          if (Array.isArray(props.items)) return props.items;
          return [];
        }, [props.rows, props.data, props.dataSource, props.items]);

        const normalizedColumns = useMemo(() => {
          if (Array.isArray(props.columns) && props.columns.length > 0) {
            return props.columns.map((c, i) => {
              if (typeof c === 'string') return { key: c, label: c };
              const key = c.key || c.dataIndex || c.id || c.field || c.name || `col_${i}`;
              const label = c.label || c.title || c.header || c.name || key;
              return { key, label, width: c.width, align: c.align };
            });
          }
          if (rawRows.length > 0 && typeof rawRows[0] === 'object' && rawRows[0] !== null) {
            return Object.keys(rawRows[0]).map((k) => ({ key: k, label: k }));
          }
          return [];
        }, [props.columns, rawRows]);

        const [sortKey, setSortKey] = useState(null);
        const [sortOrder, setSortOrder] = useState('asc');

        const sortedRows = useMemo(() => {
          const list = [...rawRows];
          if (!sortKey) return list;
          return list.sort((a, b) => {
            const va = a?.[sortKey] ?? '';
            const vb = b?.[sortKey] ?? '';
            if (typeof va === 'number' && typeof vb === 'number') {
              return sortOrder === 'asc' ? va - vb : vb - va;
            }
            return sortOrder === 'asc'
              ? String(va).localeCompare(String(vb))
              : String(vb).localeCompare(String(va));
          });
        }, [rawRows, sortKey, sortOrder]);

        const handleSort = (key) => {
          const nextOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
          setSortKey(key);
          setSortOrder(nextOrder);
          if (context?.dispatchEvent) {
            context.dispatchEvent('sort', { column: key, order: nextOrder }, 'local');
          }
        };

        return h('div', {
          className: 'dgen-table-wrap',
          style: {
            width: '100%',
            overflowX: 'auto',
            border: '1px solid var(--dsw-alias-border-l4, #e2e8f0)',
            borderRadius: '10px',
            background: 'var(--dsw-alias-bg-layer-2, #ffffff)'
          }
        },
          (props.title || props.header) && h('div', {
            style: {
              padding: '10px 14px',
              fontWeight: 650,
              fontSize: '13.5px',
              color: 'var(--dsw-alias-label-primary)',
              borderBottom: '1px solid var(--dsw-alias-border-l4)',
              background: 'color-mix(in srgb, var(--dsw-alias-bg-layer-1) 50%, transparent)'
            }
          }, props.title || props.header),
          h('table', {
            className: 'dgen-table',
            style: { width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }
          },
            h('thead', null,
              h('tr', null,
                normalizedColumns.map((c) =>
                  h('th', {
                    key: c.key,
                    style: {
                      padding: '10px 14px',
                      background: 'color-mix(in srgb, var(--dsw-alias-bg-layer-1) 55%, transparent)',
                      fontWeight: 650,
                      color: 'var(--dsw-alias-label-secondary)',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--dsw-alias-border-l4)',
                      textAlign: c.align || 'left',
                      width: c.width
                    },
                    onClick: () => handleSort(c.key)
                  },
                    c.label,
                    sortKey === c.key ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''
                  )
                )
              )
            ),
            h('tbody', null,
              sortedRows.length > 0 ? (
                sortedRows.map((r, ri) =>
                  h('tr', { key: ri },
                    normalizedColumns.map((c) =>
                      h('td', {
                        key: c.key,
                        style: {
                          padding: '10px 14px',
                          borderBottom: ri === sortedRows.length - 1 ? 'none' : '1px solid var(--dsw-alias-border-l4)',
                          color: 'var(--dsw-alias-label-primary)',
                          textAlign: c.align || 'left'
                        }
                      },
                        r?.[c.key] !== undefined && r?.[c.key] !== null ? String(r[c.key]) : '—'
                      )
                    )
                  )
                )
              ) : (
                h('tr', null,
                  h('td', {
                    colSpan: Math.max(normalizedColumns.length, 1),
                    style: { textAlign: 'center', padding: '24px', color: 'var(--dsw-alias-label-tertiary)', fontSize: '13px' }
                  }, '暂无数据行')
                )
              )
            )
          )
        );
      },

      form(props, context) {
        const fields = props.fields || [];
        const [formData, setFormData] = useState({});

        const handleChange = (name, value) => {
          setFormData((prev) => ({ ...prev, [name]: value }));
        };

        const handleSubmit = (e) => {
          e.preventDefault();
          context.dispatchEvent(props.submitAction || 'submit', formData, 'action');
        };

        return h('form', { className: 'dgen-business-card dgen-form', onSubmit: handleSubmit },
          props.title && h('h3', { className: 'dgen-node-title' }, props.title),
          fields.map((f) => {
            return h('div', { key: f.name, className: 'dgen-form-group' },
              h('label', { className: 'dgen-form-label' }, f.label || f.name),
              f.type === 'select'
                ? h('select', {
                    className: 'dgen-form-input',
                    value: formData[f.name] || '',
                    onChange: (e) => handleChange(f.name, e.target.value),
                  },
                  (f.options || []).map((opt) => h('option', { key: opt.value, value: opt.value }, opt.label))
                )
                : f.type === 'radio'
                ? h('div', { style: { display: 'flex', gap: '14px', marginTop: '4px' } },
                    (f.options || []).map((opt) =>
                      h('label', { key: opt.value, style: { fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' } },
                        h('input', {
                          type: 'radio',
                          name: f.name,
                          value: opt.value,
                          checked: formData[f.name] === opt.value,
                          onChange: () => handleChange(f.name, opt.value),
                        }),
                        opt.label
                      )
                    )
                  )
                : h('input', {
                    type: 'text',
                    className: 'dgen-form-input',
                    placeholder: f.placeholder || '',
                    value: formData[f.name] || '',
                    onChange: (e) => handleChange(f.name, e.target.value),
                  })
            );
          }),
          h('button', {
            type: 'submit',
            className: 'dgen-btn-primary',
            style: { alignSelf: 'flex-start', marginTop: '8px' },
          }, props.submitText || '提交')
        );
      },

      comparison(props, context) {
        return h(ComparisonCard, {
          options: props.options || [],
          criteria: props.criteria || [],
          recommendedOptionId: props.recommendedOptionId,
          recommendationReason: props.recommendationReason,
          onSelect: (chosen) => {
            context.dispatchEvent('choose_option', { optionId: chosen.id, label: chosen.label }, 'agent');
          }
        });
      },

      taskPlan(props, context) {
        const items = props.items || [];
        const completedCount = items.filter((i) => i.status === 'completed').length;
        const percent = Math.round((completedCount / (items.length || 1)) * 100);

        return h('div', { className: 'dgen-task-card' },
          h('div', { className: 'dgen-node-card-head' },
            h('h3', { className: 'dgen-node-title' }, 'Agent 任务执行进展'),
            h('span', { className: 'dgen-version-badge' }, `${percent}% 完成`)
          ),
          h('div', { style: { width: '100%', height: '5px', background: 'color-mix(in srgb, var(--dsw-alias-border-l4) 50%, transparent)', borderRadius: '3px', overflow: 'hidden' } },
            h('div', { style: { width: `${percent}%`, height: '100%', background: '#38a169', transition: 'width .2s ease' } })
          ),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' } },
            items.map((it) =>
              h('div', {
                key: it.id,
                className: 'dgen-task-item',
                style: { cursor: 'pointer' },
                onClick: () => context.dispatchEvent('task_inspect', { stepId: it.id, status: it.status }, 'local'),
              },
                h('span', { className: `dgen-task-dot dgen-task-${it.status || 'pending'}` }),
                h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1 } },
                  h('span', { style: { fontSize: '12px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, it.label),
                  it.details && h('span', { style: { fontSize: '11px', color: 'var(--dsw-alias-label-secondary)' } }, it.details)
                ),
                h('span', { style: { fontSize: '11px', textTransform: 'capitalize', fontWeight: 600, color: 'var(--dsw-alias-label-secondary)' } }, it.status)
              )
            )
          )
        );
      },

      callout(props) {
        return h('div', { className: 'dgen-callout' },
          props.title && h('strong', { style: { display: 'block', marginBottom: '2px' } }, props.title),
          h('span', null, props.message || '')
        );
      },

      text(props) {
        return h('div', { style: { fontSize: '13px', lineHeight: '1.55', color: 'var(--dsw-alias-label-primary)' } }, props.content || '');
      },

      // --- Dimension 1: Basic Display Components ---
      markdown(props) {
        return h(MarkdownRenderer, props);
      },

      list(props) {
        const items = props.items || [];
        return h('div', { className: 'dgen-list-block' },
          props.title && h('h3', { className: 'dgen-node-title', style: { marginBottom: '8px' } }, props.title),
          h('ul', { style: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' } },
            items.map((it, idx) => {
              const text = typeof it === 'string' ? it : it.text || it.label;
              const icon = typeof it === 'object' ? it.icon : '•';
              const badge = typeof it === 'object' ? it.badge : null;
              return h('li', {
                key: idx,
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'var(--dsw-alias-bg-layer-1)',
                  border: '1px solid var(--dsw-alias-border-l4)',
                  fontSize: '12px'
                }
              },
                h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                  h('span', { style: { color: 'var(--dsw-alias-brand-primary,#3b82f6)' } }, icon || '•'),
                  h('span', null, text)
                ),
                badge && h('span', { className: 'dgen-version-badge' }, badge)
              );
            })
          )
        );
      },

      badge(props) {
        const toneColors = {
          success: '#38a169',
          warning: '#d69e2e',
          danger: '#e53e3e',
          info: 'var(--dsw-alias-brand-primary,#3b82f6)'
        };
        const color = toneColors[props.tone] || toneColors.info;
        return h('span', {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 9px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 600,
            background: 'color-mix(in srgb, ' + color + ' 12%, transparent)',
            color: color,
            border: '1px solid color-mix(in srgb, ' + color + ' 25%, transparent)'
          }
        }, props.icon && h('span', null, props.icon), props.label || props.text || '状态标签');
      },

      accordion(props, context) {
        return h(AccordionComponent, { ...props, context });
      },

      // --- Dimension 2: Layout Containers ---
      grid(props, context) {
        const cols = props.columns || 2;
        return h('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(' + cols + ', minmax(0, 1fr))',
            gap: props.gap || '12px',
            width: '100%'
          }
        },
          (props.children || []).map((child, idx) =>
            h(RenderGenuiNode, { key: child.id || idx, node: child, context })
          )
        );
      },

      stack(props, context) {
        return h('div', {
          style: {
            display: 'flex',
            flexDirection: props.direction === 'horizontal' ? 'row' : 'column',
            gap: props.gap || '10px',
            alignItems: props.align || 'stretch',
            justifyContent: props.justify || 'flex-start',
            width: '100%'
          }
        },
          (props.children || []).map((child, idx) =>
            h(RenderGenuiNode, { key: child.id || idx, node: child, context })
          )
        );
      },

      split(props, context) {
        const ratio = props.ratio || '1fr 1fr';
        return h('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: ratio,
            gap: props.gap || '12px',
            width: '100%'
          }
        },
          (props.children || []).map((child, idx) =>
            h(RenderGenuiNode, { key: child.id || idx, node: child, context })
          )
        );
      },

      container(props, context) {
        return h('div', {
          style: {
            padding: props.padding || '12px',
            borderRadius: '8px',
            background: props.bordered ? 'var(--dsw-alias-bg-layer-2)' : 'transparent',
            border: props.bordered ? '1px solid var(--dsw-alias-border-l4)' : 'none',
            width: '100%'
          }
        },
          (props.children || []).map((child, idx) =>
            h(RenderGenuiNode, { key: child.id || idx, node: child, context })
          )
        );
      },

      // --- Dimension 3: Interactive Controls ---
      button(props, context) {
        const handleClick = () => {
          context.dispatchEvent?.(props.action || 'button_click', { buttonId: props.id, label: props.label });
        };
        return h('button', {
          type: 'button',
          className: props.variant === 'primary' ? 'dgen-btn-primary' : 'dgen-btn-xs',
          disabled: props.disabled,
          onClick: handleClick,
          style: props.style
        }, props.icon && h('span', { style: { marginRight: '4px' } }, props.icon), props.label || '操作按钮');
      },

      input(props, context) {
        return h(InputControl, { ...props, context });
      },

      select(props, context) {
        return h(SelectControl, { ...props, context });
      },

      switch(props, context) {
        return h(SwitchControl, { ...props, context });
      },

      slider(props, context) {
        return h(SliderControl, { ...props, context });
      },

      datePicker(props, context) {
        return h(DatePickerControl, { ...props, context });
      },

      // --- Dimension 6: Developer UI ---
      diffViewer(props) {
        return h(DiffViewer, props);
      },

      jsonViewer(props) {
        return h(JsonViewer, props);
      },

      treeView(props) {
        return h(TreeView, props);
      },

      terminal(props) {
        return h(TerminalViewer, props);
      },

      // --- Dimension 7: Multimedia Components ---
      image(props) {
        return h(SafeImage, props);
      },

      imageGallery(props) {
        return h(ImageGallery, props);
      },

      audio(props) {
        return h(AudioPlayer, props);
      },

      video(props) {
        return h(VideoPlayer, props);
      },

    };

    /** Render Single Node with Fallback */
    function RenderGenuiNode({ node, context }) {
      if (!node) return null;
      const renderer = Renderers[node.type];
      if (!renderer) {
        return h('div', { className: 'dgen-fallback-box' },
          h('strong', null, `未知组件 [${node.type || 'unknown'}] 降级展示`),
          h('div', { style: { marginTop: '4px', opacity: 0.8, fontSize: '11px' } }, JSON.stringify(node.props || {}))
        );
      }

      return h(ComponentErrorBoundary, null,
        h(SafeRendererHost, { renderer, node, context })
      );
    }

    /**
     * Component: GenuiCardTree
     * Recursively renders full DSL node tree with layout container.
     */
    function GenuiCardTree({ dsl, onEvent }) {
      if (!dsl || !Array.isArray(dsl.children)) {
        return h('div', { style: { padding: '12px', color: 'var(--dsw-alias-label-tertiary)', fontSize: '12px' } }, '无有效子组件');
      }
      const layoutType = dsl.layout?.type || 'stack';
      const layoutClass = layoutType === 'grid' ? 'dgen-layout-grid' : (layoutType === 'row' ? 'dgen-layout-row' : 'dgen-layout-stack');
      const firstChildHasSameTitle = dsl.children.length === 1 && (dsl.children[0]?.props?.title === dsl.title || dsl.children[0]?.props?.header === dsl.title);
      const shouldShowDslTitle = Boolean(dsl.title && !firstChildHasSameTitle);

      // Smart Auto-Grouping: Group consecutive metric nodes into a responsive KPI grid
      const renderedItems = useMemo(() => {
        const items = [];
        let metricGroup = [];

        const flushMetrics = () => {
          if (metricGroup.length > 0) {
            const mgId = 'mg_' + metricGroup[0].id;
            const count = metricGroup.length;
            const colCount = Math.min(count, 4);
            const minCol = count === 1 ? '180px' : (colCount >= 3 ? '140px' : '170px');
            const maxCol = count === 1 ? '260px' : '1fr';
            items.push(h('div', {
              key: mgId,
              className: 'dgen-metric-kpi-grid',
              style: {
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fit, minmax(${minCol}, ${maxCol}))`,
                gap: '10px',
                width: '100%'
              }
            },
              metricGroup.map((m) =>
                h(RenderGenuiNode, {
                  key: m.id,
                  node: m,
                  context: { uiId: dsl.id, isTile: true, onEvent: onEvent || (() => {}) }
                })
              )
            ));
            metricGroup = [];
          }
        };

        dsl.children.forEach((child) => {
          if (child && child.type === 'metric') {
            metricGroup.push(child);
          } else {
            flushMetrics();
            items.push(h(RenderGenuiNode, {
              key: child.id,
              node: child,
              context: { uiId: dsl.id, onEvent: onEvent || (() => {}) }
            }));
          }
        });
        flushMetrics();
        return items;
      }, [dsl.children, dsl.id, layoutType, onEvent]);

      return h('div', { className: `dgen-canvas-inner ${layoutClass}`, style: { width: '100%' } },
        shouldShowDslTitle && h('div', {
          style: {
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--dsw-alias-label-primary)',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }
        },
          h('span', null, dsl.title)
        ),
        renderedItems
      );
    }

    /**
     * Component: GenuiSkeletonCard (Clean, Headerless Skeleton Screen)
     */
    function GenuiSkeletonCard({ rawCode }) {
      let tempTitle = '';
      try {
        const match = (rawCode || '').match(/"title"\s*:\s*"([^"]+)"/);
        if (match && match[1]) tempTitle = match[1];
      } catch (_) {}

      return h('div', {
        className: 'dgen-skeleton-card',
        style: {
          margin: '10px 0',
          width: '100%',
          padding: '16px',
          borderRadius: '10px',
          background: 'var(--dsw-alias-bg-layer-2, #ffffff)',
          border: '1px solid var(--dsw-alias-border-l4, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxSizing: 'border-box'
        }
      },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          h('span', { className: 'dgen-skeleton-dot' }),
          h('div', { className: 'dgen-skeleton-box', style: { width: tempTitle ? '140px' : '100px', height: '14px' } }),
          tempTitle && h('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, tempTitle)
        ),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
          h('div', { className: 'dgen-skeleton-box', style: { width: '100%', height: '32px' } }),
          h('div', { className: 'dgen-skeleton-box', style: { width: '100%', height: '32px' } }),
          h('div', { className: 'dgen-skeleton-box', style: { width: '100%', height: '32px' } })
        )
      );
    }

    /**
     * Component: ChatGenuiCard (Pure, Borderless Native Component in Conversation Flow)
     * Renders pure components directly into the conversation flow without nested wrappers or debug buttons.
     */
    function ChatGenuiCard({ rawCode, onOpenInPlayground }) {
      const parsed = useMemo(() => {
        return parseAndNormalizeDSL(rawCode, DEFAULT_CONFIG);
      }, [rawCode]);

      const dsl = parsed.dsl;
      const isStreaming = !parsed.valid && rawCode.includes('agent-genui') && !rawCode.trim().endsWith('}');

      if (isStreaming) {
        return h(GenuiSkeletonCard, { rawCode });
      }

      if (!parsed.valid || !dsl) {
        return h('div', {
          className: 'dgen-chat-error-box',
          style: {
            padding: '12px 14px',
            borderRadius: '8px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444',
            fontSize: '12px',
            margin: '8px 0'
          }
        },
          h('div', { style: { fontWeight: 600 } }, '⚠️ GenUI DSL 解析错误：'),
          h('div', { style: { marginTop: '4px', opacity: 0.9 } }, parsed.error || 'DSL 格式不满足规范')
        );
      }

      // Render the GenUI tree DIRECTLY into the message stream without artificial wrappers or debug toolbars
      return h('div', {
        className: 'dgen-chat-direct-wrap',
        style: {
          margin: '8px 0',
          width: '100%',
          boxSizing: 'border-box'
        }
      },
        h(ComponentErrorBoundary, null,
          h(GenuiCardTree, { dsl })
        )
      );
    }

    /**
     * Chat In-Place Codeblock Scanner & MutationObserver Engine
     */
    let _chatObserver = null;
    let _scanTimer = null;
    const _mountRoots = new WeakMap();

    function ensureGlobalStyles() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('dgen-global-styles')) return;
      const styleEl = document.createElement('style');
      styleEl.id = 'dgen-global-styles';
      styleEl.textContent = Array.isArray(PAGE_CSS) ? PAGE_CSS.join('\n') : PAGE_CSS;
      document.head.appendChild(styleEl);
    }

    function scheduleChatScan() {
      if (_scanTimer) return;
      _scanTimer = setTimeout(() => {
        _scanTimer = null;
        scanAndMountGenuiBlocks();
      }, 40);
    }

    function scanAndMountGenuiBlocks() {
      if (typeof document === 'undefined') return;

      ensureGlobalStyles();

      // Check user preference in settings
      try {
        const stored = localStorage.getItem(STORAGE_CONFIG_KEY);
        if (stored) {
          const cfg = JSON.parse(stored);
          if (cfg.chatInPlaceEnabled === false) return;
        }
      } catch (_) {}

      const pres = document.querySelectorAll('pre');
      pres.forEach((pre) => {
        // Skip elements inside GenUI Workbench itself or already mounted cards
        if (pre.closest('.dgen-page') || pre.closest('.dgen-chat-direct-wrap') || pre.closest('.dgen-chat-block-mount')) return;

        const status = pre.getAttribute('data-dgen-intercepted');
        if (status === 'ready') return;

        const codeEl = pre.querySelector('code') || pre;
        const raw = (codeEl.textContent || '').trim();

        if (!raw.includes('agent-genui')) return;

        const cls = ((pre.className || '') + ' ' + (codeEl.className || '')).toLowerCase();
        const isCandidate = cls.includes('agent-genui') || cls.includes('genui') || cls.includes('json') || (raw.startsWith('{') && raw.includes('"protocol"'));
        if (!isCandidate) return;

        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch (_) {}

        if (parsed && parsed.protocol !== 'agent-genui') return;

        // Locate outer code block card wrapper in DSH markdown renderer
        // In DSH, markdown code blocks are wrapped in an element with [data-code-block-banner] and outer card styles
        let hostEl = pre;
        const banner = pre.parentElement?.querySelector('[data-code-block-banner]')
          || pre.closest(':has(>[data-code-block-banner])');
        if (banner && banner.parentElement) {
          hostEl = banner.parentElement;
        } else {
          const cardParent = pre.closest('[data-read]') || pre.closest('[class*="card"]');
          if (cardParent && cardParent.contains(pre) && !cardParent.closest('.dgen-chat-direct-wrap') && !cardParent.classList.contains('dgen-chat-block-mount')) {
            hostEl = cardParent;
          }
        }

        let mountContainer = hostEl.nextElementSibling;
        if (!mountContainer || !mountContainer.classList.contains('dgen-chat-block-mount')) {
          mountContainer = document.createElement('div');
          mountContainer.className = 'dgen-chat-block-mount';
          hostEl.parentNode.insertBefore(mountContainer, hostEl.nextSibling);
        }

        // Hide both the outer host container AND the pre element so no "代码块" header or outer border wraps the card
        hostEl.style.display = 'none';
        pre.style.display = 'none';

        if (parsed) {
          pre.setAttribute('data-dgen-intercepted', 'ready');
        } else {
          pre.setAttribute('data-dgen-intercepted', 'streaming');
        }

        const Component = h(ChatGenuiCard, {
          rawCode: raw,
          onOpenInPlayground: (targetDsl) => {
            window.__DSH_PENDING_GENUI_DSL__ = targetDsl;
            window.dispatchEvent(new CustomEvent('dsh-load-genui-dsl'));
            const sidebarBtn = document.querySelector('[data-tab-id="deepseek-genui"], button[title*="GenUI"]');
            if (sidebarBtn) {
              sidebarBtn.click();
            }
          }
        });

        if (createRoot) {
          let root = _mountRoots.get(mountContainer);
          if (!root) {
            root = createRoot(mountContainer);
            _mountRoots.set(mountContainer, root);
          }
          root.render(Component);
        } else if (ReactDOM && ReactDOM.render) {
          ReactDOM.render(Component, mountContainer);
        }
      });
    }

    /** Settings Tab View */
    function GenuiSettingsView({ config, onSaveConfig, t }) {
      const [localConfig, setLocalConfig] = useState(config);
      const [showToast, setShowToast] = useState(false);

      const updateField = (key, value) => {
        setLocalConfig((prev) => ({ ...prev, [key]: value }));
      };

      const handleSave = () => {
        onSaveConfig(localConfig);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
      };

      const handleReset = () => {
        setLocalConfig(DEFAULT_CONFIG);
        onSaveConfig(DEFAULT_CONFIG);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
      };

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '18px' } },
        h('div', { className: 'dgen-panel', style: { padding: '20px' } },
          h('h2', { style: { margin: '0 0 4px', fontSize: '16px', fontWeight: 650 } }, t('settings.title')),
          h('p', { style: { margin: '0 0 16px', fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, t('settings.subtitle')),

          // Chat In-Place Replacement
          h('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--dsw-alias-border-l4)' } },
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px' } },
              h('span', { style: { fontSize: '13px', fontWeight: 600 } }, '聊天对话流原地组件替换 (Chat In-Place)'),
              h('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, '自动识别聊天流中的 ```agent-genui 代码块并就地替换渲染为高保真交互卡片')
            ),
            h('label', { className: 'dgen-switch' },
              h('input', {
                type: 'checkbox',
                checked: localConfig.chatInPlaceEnabled !== false,
                onChange: (e) => updateField('chatInPlaceEnabled', e.target.checked),
              }),
              h('span', { className: 'dgen-slider' })
            )
          ),

          // Auto Repair
          h('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--dsw-alias-border-l4)' } },
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px' } },
              h('span', { style: { fontSize: '13px', fontWeight: 600 } }, '确定性自愈修复 (Auto-Repair)'),
              h('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, '自动补全缺失的 stable ID、默认布局与安全非关键属性')
            ),
            h('label', { className: 'dgen-switch' },
              h('input', {
                type: 'checkbox',
                checked: localConfig.autoRepairEnabled,
                onChange: (e) => updateField('autoRepairEnabled', e.target.checked),
              }),
              h('span', { className: 'dgen-slider' })
            )
          ),

          // Strict Mode
          h('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--dsw-alias-border-l4)' } },
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px' } },
              h('span', { style: { fontSize: '13px', fontWeight: 600 } }, '严格校验模式 (Strict Mode)'),
              h('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, '遇到未知组件或非标字段时直接拒绝，而非进行安全降级展示')
            ),
            h('label', { className: 'dgen-switch' },
              h('input', {
                type: 'checkbox',
                checked: localConfig.strictMode,
                onChange: (e) => updateField('strictMode', e.target.checked),
              }),
              h('span', { className: 'dgen-slider' })
            )
          ),

          // Max Attempts
          h('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--dsw-alias-border-l4)' } },
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px' } },
              h('span', { style: { fontSize: '13px', fontWeight: 600 } }, '模型有界重试上限 (Max Repair Attempts)'),
              h('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, '向模型请求修复失败片段的最大允许次数 (建议 1 ~ 2 次)')
            ),
            h('input', {
              type: 'number',
              className: 'dgen-input-num',
              min: 0,
              max: 5,
              value: localConfig.maxRepairAttempts,
              onChange: (e) => updateField('maxRepairAttempts', parseInt(e.target.value, 10) || 0),
            })
          ),

          // Max Nodes
          h('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--dsw-alias-border-l4)' } },
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px' } },
              h('span', { style: { fontSize: '13px', fontWeight: 600 } }, '最大节点数量配额 (Max Nodes Limit)'),
              h('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, '单次 DSL 允许渲染的最大组件总数，防范拒绝服务 (DoS)')
            ),
            h('input', {
              type: 'number',
              className: 'dgen-input-num',
              min: 5,
              max: 200,
              value: localConfig.maxNodesLimit,
              onChange: (e) => updateField('maxNodesLimit', parseInt(e.target.value, 10) || 50),
            })
          ),

          // Action Allowlist
          h('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '12px 0' } },
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px' } },
              h('span', { style: { fontSize: '13px', fontWeight: 600 } }, '受信任动作白名单校验 (Action Allowlist)'),
              h('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, '校验所有表单与按钮动作 ID 是否符合系统注册格式，防注入')
            ),
            h('label', { className: 'dgen-switch' },
              h('input', {
                type: 'checkbox',
                checked: localConfig.actionAllowlistCheck,
                onChange: (e) => updateField('actionAllowlistCheck', e.target.checked),
              }),
              h('span', { className: 'dgen-slider' })
            )
          )
        ),

        // Buttons
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
          h('button', { type: 'button', className: 'dgen-btn-primary', onClick: handleSave }, t('settings.save')),
          h('button', { type: 'button', className: 'dgen-btn-secondary', onClick: handleReset }, t('settings.reset')),
          showToast && h('span', { className: 'dgen-toast' }, '✓ ' + t('settings.saved.toast'))
        )
      );
    }

    /** Feature Preview Tab View with Subcategory Tabs */
    function GenuiPreviewView({ config, t }) {
      const [selectedCatId, setSelectedCatId] = useState('cat-charts');
      const currentCategory = useMemo(() => {
        return PRESET_CATEGORIES.find((c) => c.id === selectedCatId) || PRESET_CATEGORIES[0];
      }, [selectedCatId]);

      const [currentPresetId, setCurrentPresetId] = useState(currentCategory.items[0]?.id || 'chart-line');
      const currentPreset = useMemo(() => {
        return currentCategory.items.find((it) => it.id === currentPresetId) || currentCategory.items[0];
      }, [currentCategory, currentPresetId]);

      const [rawJson, setRawJson] = useState(() => JSON.stringify(currentPreset.dsl, null, 2));
      const [events, setEvents] = useState([]);

      // Listen for incoming DSL dispatched from Chat in-place cards
      useEffect(() => {
        const checkIncoming = () => {
          if (window.__DSH_PENDING_GENUI_DSL__) {
            try {
              const incoming = window.__DSH_PENDING_GENUI_DSL__;
              window.__DSH_PENDING_GENUI_DSL__ = null;
              const formatted = typeof incoming === 'string' ? incoming : JSON.stringify(incoming, null, 2);
              setRawJson(formatted);
            } catch (_) {}
          }
        };
        checkIncoming();
        window.addEventListener('dsh-load-genui-dsl', checkIncoming);
        return () => window.removeEventListener('dsh-load-genui-dsl', checkIncoming);
      }, []);

      // Switch category
      const handleSelectCategory = (catId) => {
        setSelectedCatId(catId);
        const cat = PRESET_CATEGORIES.find((c) => c.id === catId);
        if (cat && cat.items[0]) {
          setCurrentPresetId(cat.items[0].id);
          setRawJson(JSON.stringify(cat.items[0].dsl, null, 2));
        }
      };

      // Switch preset within category
      const handleSelectPreset = (presetItem) => {
        setCurrentPresetId(presetItem.id);
        setRawJson(JSON.stringify(presetItem.dsl, null, 2));
      };

      const handleFormat = () => {
        try {
          const obj = JSON.parse(rawJson);
          setRawJson(JSON.stringify(obj, null, 2));
        } catch (_) {}
      };

      const handleResetPreset = () => {
        if (currentPreset) {
          setRawJson(JSON.stringify(currentPreset.dsl, null, 2));
        }
      };

      // Realtime Parse, Normalize & Validate
      const { normalizedDsl, validationResult, parseError, repairs } = useMemo(() => {
        const norm = parseAndNormalizeDSL(rawJson, config);
        if (!norm.valid) {
          return { normalizedDsl: null, validationResult: { valid: false, issues: [] }, parseError: norm.error, repairs: [] };
        }
        const val = validateDSL(norm.dsl, config);
        return {
          normalizedDsl: norm.dsl,
          validationResult: val,
          parseError: null,
          repairs: norm.repairs,
        };
      }, [rawJson, config]);

      const handleEvent = useCallback((eventObj) => {
        if (!config.logEvents) return;
        setEvents((prev) => [eventObj, ...prev.slice(0, 49)]);
      }, [config.logEvents]);

      const layoutClass = useMemo(() => {
        const type = normalizedDsl?.layout?.type || 'stack';
        if (type === 'grid') return 'dgen-layout-grid';
        if (type === 'row') return 'dgen-layout-row';
        return 'dgen-layout-stack';
      }, [normalizedDsl?.layout?.type]);

      return h('div', { style: { display: 'flex', flexDirection: 'column' } },
        // 1. Subcategory Tab Bar (DSH Filter Pattern)
        h('nav', { className: 'dgen-subtabs', role: 'tablist', 'aria-label': 'Visual Categories' },
          PRESET_CATEGORIES.map((cat) =>
            h('button', {
              key: cat.id,
              type: 'button',
              className: `dgen-subtab ${selectedCatId === cat.id ? 'active' : ''}`,
              onClick: () => handleSelectCategory(cat.id),
            }, cat.label)
          )
        ),

        // 2. Presets Chips Bar under selected Category
        h('div', { className: 'dgen-preset-bar' },
          currentCategory.items.map((it) =>
            h('button', {
              key: it.id,
              type: 'button',
              className: `dgen-preset-chip ${currentPresetId === it.id ? 'active' : ''}`,
              onClick: () => handleSelectPreset(it),
            }, it.name)
          )
        ),

        // 3. Split Grid (Editor & Live Canvas Studio)
        h('div', { className: 'dgen-preview-grid' },
          // Left Column: DSL Editor & Validation
          h('div', { className: 'dgen-panel' },
            h('div', { className: 'dgen-panel-head' },
              h('span', { className: 'dgen-panel-title' },
                h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, fill: 'currentColor' },
                  h('path', { d: 'M5.5 2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1-.5-.5z' }),
                  h('path', { d: 'M3 3.5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9zM5 3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H5z' })
                ),
                t('preview.editor.title')
              ),
              h('div', { className: 'dgen-panel-actions' },
                h('button', { type: 'button', className: 'dgen-btn-xs', onClick: handleFormat }, t('preview.editor.format')),
                h('button', { type: 'button', className: 'dgen-btn-xs', onClick: handleResetPreset }, t('preview.editor.reset'))
              )
            ),
            h('textarea', {
              className: 'dgen-editor-textarea',
              value: rawJson,
              spellCheck: false,
              onChange: (e) => setRawJson(e.target.value),
            }),
            h('div', { className: 'dgen-validation-box' },
              parseError
                ? h('div', { className: 'dgen-badge-invalid' }, '❌ ' + parseError)
                : validationResult.valid
                ? h('div', { className: 'dgen-badge-valid' },
                    '✅ 验证通过 (Valid) - 节点数: ' + (normalizedDsl?.children?.length || 0)
                  )
                : h('div', { className: 'dgen-badge-invalid' },
                    '❌ 校验不通过 (' + validationResult.issues.length + ' 项异常)'
                  ),
              repairs.length > 0 && h('div', null,
                h('span', { className: 'dgen-badge-repaired' }, '⚡ 已执行确定性自愈修复 (' + repairs.length + ')'),
                h('ul', { className: 'dgen-issue-list' },
                  repairs.map((r, i) => h('li', { key: i }, r))
                )
              ),
              validationResult.issues.length > 0 && h('ul', { className: 'dgen-issue-list', style: { color: '#ef4444' } },
                validationResult.issues.map((iss, i) => h('li', { key: i }, `${iss.path}: ${iss.message}`))
              )
            )
          ),

          // Right Column: Live Rendered UI Canvas
          h('div', { className: 'dgen-panel' },
            h('div', { className: 'dgen-panel-head' },
              h('span', { className: 'dgen-panel-title' },
                h('span', { className: 'dgen-live-dot' }),
                t('preview.canvas.title')
              ),
              normalizedDsl && h('span', { className: 'dgen-version-badge' }, normalizedDsl.protocol + ' @ ' + normalizedDsl.version)
            ),
            h('div', { className: 'dgen-canvas-body' },
              normalizedDsl && normalizedDsl.children
                ? h(GenuiCardTree, { key: currentPresetId, dsl: normalizedDsl, onEvent: handleEvent })
                : h('div', { style: { textAlign: 'center', padding: '60px 0', color: 'var(--dsw-alias-label-tertiary)', fontSize: '13px' } },
                    'DSL 解析无效，无法生成预览'
                  )
            )
          )
        ),

        // 4. Bottom Console: Event Audit Bus
        h('div', { className: 'dgen-console-box' },
          h('div', { className: 'dgen-panel-head' },
            h('span', { className: 'dgen-panel-title' },
              h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, fill: 'currentColor' },
                h('path', { d: 'M2 3h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm0 1v8h12V4H2z' }),
                h('path', { d: 'M4 6h3v1H4V6zm0 2h5v1H4V8zm0 2h2v1H4v-1z' })
              ),
              t('preview.events.title')
            ),
            events.length > 0 && h('button', {
              type: 'button',
              className: 'dgen-btn-xs',
              onClick: () => setEvents([]),
            }, t('preview.events.clear'))
          ),
          h('div', { className: 'dgen-console-list' },
            events.length === 0
              ? h('div', { style: { padding: '8px', color: 'var(--dsw-alias-label-tertiary)' } }, t('preview.events.empty'))
              : events.map((ev) =>
                  h('div', { key: ev.eventId, className: 'dgen-event-row' },
                    h('span', { className: 'dgen-event-time' }, ev.timestamp),
                    h('span', { className: `dgen-event-cat dgen-event-cat-${ev.category || 'local'}` }, ev.category),
                    h('span', { className: 'dgen-event-id' }, `${ev.componentId} -> ${ev.event}`),
                    h('span', { className: 'dgen-event-payload' }, JSON.stringify(ev.payload))
                  )
                )
          )
        )
      );
    }

    /** Top Tab Icons */
    function SettingsTabIcon({ size = 15 }) {
      return h('svg', { viewBox: '0 0 16 16', width: size, height: size, fill: 'none', 'aria-hidden': true, style: { display: 'inline-block', verticalAlign: 'middle' } },
        h('circle', { cx: 8, cy: 8, r: 2.2, stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', {
          d: 'M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
        })
      );
    }

    function PreviewTabIcon({ size = 15 }) {
      return h('svg', { viewBox: '0 0 16 16', width: size, height: size, fill: 'none', 'aria-hidden': true, style: { display: 'inline-block', verticalAlign: 'middle' } },
        h('path', {
          d: 'M1.5 8s2.5-4.5 6.5-4.5 6.5 4.5 6.5 4.5-2.5 4.5-6.5 4.5-6.5-4.5-6.5-4.5z',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
        h('circle', { cx: 8, cy: 8, r: 2, stroke: 'currentColor', strokeWidth: 1.4 })
      );
    }

    function GenuiIcon({ size = 16 }) {
      return h('svg', { viewBox: '0 0 16 16', width: size, height: size, fill: 'none', 'aria-hidden': true, style: { display: 'block' } },
        h('rect', { x: 1.65, y: 2.4, width: 12.7, height: 11.2, rx: 2.8, stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', { d: 'M4.6 6.1h5M4.6 8.7h3.2', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
        h('path', { d: 'M11.15 8.4l.63 1.62 1.62.63-1.62.63-.63 1.62-.63-1.62-1.62-.63 1.62-.63z', fill: 'currentColor' })
      );
    }

    /** Top Main Panel */
    function GenuiPage({ t }) {
      const [activeTab, setActiveTab] = useState('preview');
      const [config, setConfig] = useState(() => {
        try {
          const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
          return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
        } catch (_) {
          return DEFAULT_CONFIG;
        }
      });

      const handleSaveConfig = (newCfg) => {
        setConfig(newCfg);
        try {
          localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(newCfg));
        } catch (_) {}
      };

      return h('div', { className: 'dgen-page' },
        h('style', null, PAGE_CSS),
        h('header', { className: 'dgen-head' },
          h('div', { className: 'dgen-title-row' },
            h('h1', { className: 'dgen-title' }, t('page.title')),
            h('span', { className: 'dgen-version-badge' }, 'v1.0')
          ),
          h('p', { className: 'dgen-intro' }, t('page.description'))
        ),
        h('nav', { className: 'dgen-tabs', role: 'tablist', 'aria-label': 'GenUI tabs' },
          h('button', {
            type: 'button',
            role: 'tab',
            className: `dgen-tab ${activeTab === 'preview' ? 'dgen-tab-active' : ''}`,
            'aria-selected': activeTab === 'preview',
            'aria-controls': 'dgen-tabpanel-preview',
            id: 'dgen-tab-preview',
            onClick: () => setActiveTab('preview'),
          },
            h(PreviewTabIcon, { size: 15 }),
            t('tabs.preview')
          ),
          h('button', {
            type: 'button',
            role: 'tab',
            className: `dgen-tab ${activeTab === 'settings' ? 'dgen-tab-active' : ''}`,
            'aria-selected': activeTab === 'settings',
            'aria-controls': 'dgen-tabpanel-settings',
            id: 'dgen-tab-settings',
            onClick: () => setActiveTab('settings'),
          },
            h(SettingsTabIcon, { size: 15 }),
            t('tabs.settings')
          )
        ),
        h('div', {
          className: 'dgen-content',
          role: 'tabpanel',
          id: `dgen-tabpanel-${activeTab}`,
          'aria-labelledby': `dgen-tab-${activeTab}`,
        },
          activeTab === 'settings'
            ? h(GenuiSettingsView, { config, onSaveConfig: handleSaveConfig, t })
            : h(GenuiPreviewView, { config, t })
        )
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, 'en', en), 'deepseek-genui: en dictionary');
        ctx.effect(() => ctx.locale.register(NS, 'zh', zh), 'deepseek-genui: zh dictionary');
        const t = ctx.locale.bind(NS);

        // 1. Sidebar Panellist & Main Studio Panel
        ctx.slots.inject('main', () =>
          ctx.slots.register(
            { name: 'main', key: PANEL_ID, locale: NS },
            GenuiPage,
          ),
        );

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: PANEL_ID,
              order: 20,
              locale: NS,
              label: () => t('panel'),
            },
            GenuiIcon,
          ),
        );

        // 2. Chat In-Place Codeblock Interceptor & Live Card Replacer
        if (typeof document !== 'undefined') {
          ensureGlobalStyles();
          _chatObserver = new MutationObserver(() => {
            scheduleChatScan();
          });
          _chatObserver.observe(document.body, {
            childList: true,
            subtree: true,
          });

          // Immediate scan on startup
          scheduleChatScan();

          // Cleanup when plugin effect unbinds
          ctx.effect(() => () => {
            if (_chatObserver) {
              _chatObserver.disconnect();
              _chatObserver = null;
            }
          });
        }
      },
    };
  },
});
