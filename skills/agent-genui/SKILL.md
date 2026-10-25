---
name: agent-genui
description: 生成基于 ```agent-genui 协议的高保真、交互式卡片、图表与架构可视化界面组件（GenUI），聊天对话流将自动将其就地渲染为活体卡片。
whenToUse: 当用户要求生成 GenUI 卡片、交互组件、数据大屏、指标看板、流程图、架构拓扑、时序图、生命周期状态机、交互表单、方案对比或需要以可视化界面呈现分析结果时使用。
source: bundled
---

# Agent GenUI 交互卡片生成规范指南

`@civilization/deepseek-genui` 为 DeepSeek Harness (DSH) 提供了原生的 Generative UI 运行时与聊天流内就地渲染能力。

当你输出被 ````agent-genui` 代码块包裹的标准 JSON DSL 时，DSH 聊天流会自动拦截该代码块并原地渲染为高保真、可交互的活体卡片（支持图表 Tooltip 悬停、React Flow 拓扑拖拽与缩放、表单填写、方案采纳提交等）。

---

## 📌 输出规范（格式与约束）

在回复用户时，请先输出简明扼要的结论或文字说明，然后**直接输出包裹在 ````agent-genui` 代码块中的完整 JSON 描述**：

```agent-genui
{
  "protocol": "agent-genui",
  "version": "1.0",
  "id": "ui_cluster_report",
  "title": "生产集群全景分析与健康度看板",
  "layout": { "type": "stack", "gap": "md" },
  "children": [
    ...
  ]
}
```

### 顶级根结构字段
- `protocol`: 固定为 `"agent-genui"`（必须字段）
- `version`: 固定为 `"1.0"`（必须字段）
- `id`: 全局唯一标识，例如 `"ui_order_stats"`（必须字段）
- `title`: 卡片顶部显示的标题名称（可选）
- `layout`: 布局容器，`{ "type": "stack" | "grid" | "row", "gap": "sm" | "md" | "lg" }`（必须字段）
- `children`: 组件节点数组（必须字段）

每个子组件节点必须包含：
- `id`: 节点内唯一标识（例如 `"metric_1"`、`"chart_cpu"`）
- `type`: 组件类型名称（见下方组件速查表）
- `props`: 传递给该组件的属性配置对象

---

## 🎨 核心组件清单与典型模板

### 1. 指标看板（`type: "metric"`）
用于关键 KPI、统计指标、趋势变化展示：
```json
{
  "id": "m1",
  "type": "metric",
  "props": {
    "title": "当前 QPS 吞吐",
    "value": "12,480",
    "unit": "req/s",
    "change": "+18.2%",
    "changeType": "up"
  }
}
```
*`changeType` 可选：`"up"`（绿色增长）、`"down"`（橙/红下降）、`"neutral"`（持平）。*

---

### 2. 统计图表（`type: "chart"`）
支持完整的笛卡尔坐标系、数值网格、刻度标签、单位显示与鼠标悬停数值 Tooltip：
```json
{
  "id": "c1",
  "type": "chart",
  "props": {
    "chartType": "line",
    "title": "24小时吞吐趋势走势图",
    "yAxisUnit": "req/s",
    "series": [
      { "label": "00:00", "value": 3200 },
      { "label": "04:00", "value": 1800 },
      { "label": "08:00", "value": 7500 },
      { "label": "12:00", "value": 12480 },
      { "label": "16:00", "value": 11200 },
      { "label": "20:00", "value": 9800 }
    ],
    "target": 15000
  }
}
```
*`chartType` 支持：`"line"` (折线图)、`"bar"` (柱状图)、`"area"` (面积图)、`"scatter"` (散点图)、`"radar"` (雷达图)、`"pie"` (饼图)、`"donut"` (环形图)。*

---

### 3. 分布式系统架构拓扑（`type: "diagram"`, `diagramType: "architecture"`）
**同时支持 React Flow 画布与 Mermaid 分层视图**，支持端口光晕、节点悬停微动与动态光流虚线：
```json
{
  "id": "arch1",
  "type": "diagram",
  "props": {
    "diagramType": "architecture",
    "title": "现代端到端服务分层拓扑架构",
    "tiers": [
      { "name": "接入层 (Client & CDN)", nodes: ["Web 宿主", "移动端 App", "桌面端 DSH"] },
      { "name": "网关安全层 (API Gateway)", nodes: ["WAF 防护", "Kong 网关", "OAuth2 鉴权中心"] },
      { "name": "核心服务层 (Core Services)", nodes: ["Agent Runtime", "GenUI 渲染服务", "任务编排器"] },
      { "name": "存储与缓存 (Storage & DB)", nodes: ["Redis 缓存", "PostgreSQL", "向量数据库"] }
    ]
  }
}
```

---

### 4. 业务链路流程图（`type: "diagram"`, `diagramType: "flowchart"`）
基于 Mermaid 10.x 离线引擎编译，节点 ID 严禁使用 `end`、`subgraph` 等保留字（推荐使用 `success`、`node_1` 等）：
```json
{
  "id": "flow1",
  "type": "diagram",
  "props": {
    "diagramType": "flowchart",
    "direction": "LR",
    "nodes": [
      { "id": "start", "label": "用户发起请求" },
      { "id": "auth", "label": "鉴权与限流" },
      { "id": "exec", "label": "扣减库存" },
      { "id": "success", "label": "回包成功" }
    ],
    "edges": [
      { "from": "start", "to": "auth" },
      { "from": "auth", "to": "exec" },
      { "from": "exec", "to": "success" }
    ]
  }
}
```

---

### 5. 交互时序图（`type: "diagram"`, `diagramType: "sequence"`）
带有角色生命线、同步与异步返回箭头的时序图：
```json
{
  "id": "seq1",
  "type": "diagram",
  "props": {
    "diagramType": "sequence",
    "actors": ["User", "Gateway", "DeepSeekAgent", "Database"],
    "steps": [
      { "from": "User", "to": "Gateway", "msg": "发起查询分析" },
      { "from": "Gateway", "to": "DeepSeekAgent", "msg": "调度推理任务" },
      { "from": "DeepSeekAgent", "to": "Database", "msg": "读取知识库" },
      { "from": "Database", "to": "DeepSeekAgent", "msg": "返回上下文数据" },
      { "from": "DeepSeekAgent", "to": "User", "msg": "渲染 GenUI 卡片" }
    ]
  }
}
```

---

### 6. 决策方案对比（`type: "comparison"`）
包含横向方案多维评分、优缺点分析、推荐原因以及单选与「确认并采纳此方案」交互提交按钮：
```json
{
  "id": "comp1",
  "type": "comparison",
  "props": {
    "options": [
      {
        "id": "opt_a",
        "name": "方案 A (Redis 缓存加速)",
        "score": 95,
        "pros": ["极低读写延迟 (<2ms)", "高并发承载能力强", "支持丰富数据结构"],
        "cons": ["内存成本较高", "需处理持久化落盘策略"]
      },
      {
        "id": "opt_b",
        "name": "方案 B (PostgreSQL 直读)",
        "score": 82,
        "pros": ["强一致性事务 ACID", "成本相对可控", "开箱即用无额外组件"],
        "cons": ["高并发热点读易造成连接池打满", "P99 延迟较高"]
      }
    ],
    "criteria": ["读写延迟", "高并发表现", "运维成本", "数据一致性"],
    "recommendedOptionId": "opt_a",
    "recommendationReason": "面对 P99 毫秒级高吞吐要求，方案 A 在读性能与吞吐瓶颈突破上具备显著优势。"
  }
}
```

---

### 7. 数据表格（`type: "table"`）
支持列定义、字段映射与自动斑马纹排版：
```json
{
  "id": "tbl1",
  "type": "table",
  "props": {
    "title": "活跃微服务节点清单",
    "columns": [
      { "key": "service", "title": "服务名称" },
      { "key": "instances", "title": "实例数" },
      { "key": "qps", "title": "实时 QPS" },
      { "key": "status", "title": "运行状态" }
    ],
    "data": [
      { "service": "order-service", "instances": "8", "qps": "4,200", "status": "🟢 正常" },
      { "service": "auth-center", "instances": "4", "qps": "1,850", "status": "🟢 正常" },
      { "service": "payment-gateway", "instances": "6", "qps": "2,100", "status": "🟡 轻度告警" }
    ]
  }
}
```

---

### 8. 任务进展流水线（`type: "taskPlan"`）
支持完成度百分比动态计算、完成/进行中/待处理状态圆点：
```json
{
  "id": "plan1",
  "type": "taskPlan",
  "props": {
    "items": [
      { "id": "t1", "label": "环境准备与凭证鉴权", "status": "completed" },
      { "id": "t2", "label": "分析业务数据与异常日志", "status": "completed" },
      { "id": "t3", "label": "编译并验证 GenUI 模板", "status": "running", "details": "正在流式挂载视图组件..." },
      { "id": "t4", "label": "输出最终决策建议", "status": "pending" }
    ]
  }
}
```

---

### 9. 开发者 UI：代码 Diff 对比（`type: "diff"`）
支持 Git 级文件修改对比（绿底增加、红底删除）：
```json
{
  "id": "diff1",
  "type": "diff",
  "props": {
    "title": "配置变更审查 (Diff Viewer)",
    "filename": "application-prod.yml",
    "oldCode": "server:\n  port: 8080\n  timeout: 30s\n  max-connections: 1000",
    "newCode": "server:\n  port: 8080\n  timeout: 60s\n  max-connections: 5000\n  enable-keepalive: true"
  }
}
```

---

### 10. 结构化概览卡片（`type: "card"`）
支持条目清单、图标、分类标签与详细说明（如建议清单、方案总览）：
```json
{
  "id": "card_summary",
  "type": "card",
  "props": {
    "title": "建议新增清单",
    "items": [
      {
        "icon": "📦",
        "title": "P0: 基础 UI 与交互原语",
        "tags": ["Markdown", "Text", "List", "Button", "Badge", "Tabs", "Accordion", "Alert"],
        "description": "这是当前最大的基础能力缺口。没有这些组件，模型很难把复杂 UI 组织成清晰、完整的界面。"
      },
      {
        "icon": "🔀",
        "title": "P0: 代码变更与人工审批",
        "tags": ["Diff Viewer", "Patch Preview", "Approval Panel", "Confirmation Dialog"],
        "description": "对于代码 Agent，展示修改前后差异、让用户审查变更、确认高风险操作，比增加更多装饰性图表更有价值。"
      }
    ]
  }
}
```

---

### 11. 交互表单控件（`type: "form"` / `button` / `slider` / `select`）
用于向用户收集参数，支持滑块、下拉框、单选与提交按钮：
```json
{
  "id": "f1",
  "type": "form",
  "props": {
    "title": "参数调优控制器",
    "submitText": "立即应用配置",
    "fields": [
      { "name": "concurrency", "label": "最大并发线程数", "type": "number", "placeholder": "16" },
      { "name": "logLevel", "label": "日志级别", "type": "select", "options": [
        { "label": "INFO", "value": "info" },
        { "label": "DEBUG", "value": "debug" },
        { "label": "WARN", "value": "warn" }
      ]}
    ]
  }
}
```

---

## 💡 最佳实践

1. **直接输出代码块**：在回答用户时，不需要让用户去哪里搜索或配置，直接给出 ````agent-genui` 代码块即可。DSH 聊天前端已装配自动渲染拦截器，能将此代码块就地变为交互式卡片。
2. **组合使用**：可以使用 `layout: { "type": "stack", "gap": "md" }` 或 `layout: { "type": "grid", "gap": "md" }` 组合多个不同组件（例如：顶部 1 个 `metric` 指标，中间 1 个 `chart` 图表，底部 1 个 `table` 数据表或 `comparison` 方案对比）。
3. **保持 JSON 语法严谨**：属性名必须用双引号包裹，字符串内部的引号要转义，避免末尾逗号（trailing comma）。
