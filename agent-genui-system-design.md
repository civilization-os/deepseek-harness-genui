# Agent GenUI Runtime：系统设计文档

-   **文档类型**：技术设计 / System Design
-   **版本**：1.0
-   **状态**：Draft for implementation
-   **适用范围**：面向 Agent 对话产品的声明式、可交互 GenUI Runtime
-   **核心原则**：模型提出 UI 结构与内容；Runtime
    验证协议、管理状态与权限；前端使用受信任的组件和渲染器完成展示。

------------------------------------------------------------------------

## 1. 摘要

本文定义一个可扩展的 Agent GenUI（Generative
UI）运行时。系统允许模型根据用户任务生成结构化 UI
描述，再由客户端将描述映射为经过注册、验证和授权的 UI
组件。系统支持信息展示、数据可视化、用户输入、决策比较、Agent
任务状态、导航探索、产物交付、多媒体和专业可视化等 UI 类型。

推荐主链路：

``` text
用户请求 / Agent 输出
        |
        v
生成 JSON UI DSL
        |
        v
解析 -> 版本识别 -> 规范化
        |
        v
多层验证
  - 结构 Schema
  - 组件属性契约
  - 语义与数据引用
  - 安全 / 权限策略
        |
        +---- 可确定性修复 ----> 再验证
        |
        +---- 可由模型修复 ----> 有界修复请求 ----> 再验证
        |
        +---- 不可修复 / 超限 ----> 安全降级
        |
        v
规范化 UI AST / 组件计划
        |
        v
Renderer Registry 分发
        |
        v
React / DOM / SVG / Canvas / 专用引擎
        |
        v
渲染错误边界 + 本地交互 + 事件回传
```

推荐采用 **JSON DSL + Schema + Renderer Registry**
作为第一版架构。不要把模型生成的任意 React、HTML、CSS 或 JavaScript
直接执行在宿主应用中。UI 协议是稳定的产品接口，不是临时的代码生成格式。

## 2. 目标与非目标

### 2.1 目标

1.  让模型可以根据任务选择和组合 UI，而不必生成任意前端代码。
2.  支持统一的协议、校验、渲染、交互、错误恢复和观测。
3.  通过 Renderer Registry 解耦 DSL 与底层 UI 框架、组件库和图形引擎。
4.  支持常见的声明式组件，以及图表、流程图、代码编辑器、地图等领域专用渲染器。
5.  将本地交互与 Agent 推理/工具执行区分开，避免每次点击都调用模型。
6.  对非法结构、未知组件、无效数据、运行时崩溃和权限违规进行分级处理。
7.  支持渐进式扩展、协议版本管理、兼容性测试和灰度发布。
8.  控制模型 Token 消耗、组件复杂度、渲染性能与安全风险。

### 2.2 非目标

第一版不尝试：

-   允许模型直接执行任意 JavaScript、动态导入或任意网络请求。
-   用一套自研 Canvas 引擎替代所有现有 UI 技术。
-   为所有领域实现完整的专业编辑器。
-   将 UI 渲染器作为权限系统的唯一安全边界。
-   让模型自由决定可执行操作、授权范围或任意组件属性。
-   将每次本地控件交互都发送回模型。
-   把复杂业务状态仅保存在模型生成的 DSL 中。

## 3. 设计原则

### 3.1 模型负责表达，Runtime 负责执行

模型可以选择 UI 类型、填写数据、组织布局并声明有限的交互意图。Runtime
负责验证类型、限制资源、解析事件、校验权限并调用已注册的操作。

### 3.2 先使用确定性逻辑，再请求模型修复

可安全、无歧义地修复的问题应在本地修复，例如填充可选默认值、移除未知的非关键装饰属性或将未知展示组件降级为文本。涉及业务语义、数据推断或权限的问题不能猜测。

### 3.3 局部失败优于整页失败

单个图表、卡片或图形渲染失败时，应尽量隔离错误节点，保留其余有效内容。根节点结构错误或安全策略违规则可以拒绝整份
UI。

### 3.4 UI 协议与底层实现解耦

DSL 描述语义组件，例如
`chart`、`table`、`form`、`diagram`，而不是绑定到某个 React
组件名。底层可以替换 ECharts、Recharts、React Flow
或其他引擎，而无需让模型学习新协议。

### 3.5 默认最小化

不需要 UI 时返回普通文本；只有当 UI
能提高信息可读性、比较效率或交互完成率时才生成。避免把简单回答包装成复杂仪表盘。

### 3.6 渐进增强

优先保证文本和基础 DOM
的可用性。高级图形引擎加载失败时，应有轻量替代视图或明确的不可用状态。

------------------------------------------------------------------------

## 4. 系统架构

### 4.1 逻辑组件

1.  **UI Planner**：决定是否需要 UI、选择模式、组件组合和信息密度。
2.  **DSL Generator**：按协议输出 JSON UI 描述。
3.  **Parser**：解析 JSON，拒绝非法或超限输入。
4.  **Normalizer**：填充默认值、规范化字段、处理兼容版本。
5.  **Schema Validator**：检查根结构、节点结构和字段类型。
6.  **Component Contract Validator**：验证具体组件的
    props、数据形状和能力声明。
7.  **Semantic Validator**：检查数据引用、图表系列、节点
    ID、交互目标和组件组合约束。
8.  **Policy
    Validator**：检查允许的组件、动作、URL、资源大小、敏感操作和授权上下文。
9.  **Repair Coordinator**：决定自动修复、模型修复、局部降级或拒绝。
10. **UI AST / Render Plan**：保存规范化且通过验证的组件树。若外部 DSL
    已与内部模型一致，可复用同一结构，不强制额外复制。
11. **Renderer Registry**：按语义类型和能力选择渲染器。
12. **Interaction Runtime**：维护本地状态、校验事件并路由到应用动作或
    Agent。
13. **Error Boundary**：隔离单个组件的渲染错误。
14. **Telemetry**：记录生成、校验、修复、渲染、事件处理的耗时与错误类型。

### 4.2 数据流

``` mermaid
flowchart TD
    A[Agent / Model Output] --> B[Parse JSON]
    B --> C[Normalize and Migrate]
    C --> D[Structural Schema Validation]
    D --> E[Component Contract Validation]
    E --> F[Semantic Validation]
    F --> G[Security and Policy Validation]
    G -->|Valid| H[Normalized UI AST]
    D -->|Repairable| R[Repair Coordinator]
    E -->|Repairable| R
    F -->|Repairable| R
    R -->|Deterministic Repair| C
    R -->|Bounded Model Repair| M[Model Repair Request]
    M --> B
    R -->|Cannot Repair| X[Fallback / Text Mode]
    G -->|Security Violation| Y[Reject Unsafe Action]
    H --> I[Renderer Registry]
    I --> J[Component Renderers]
    J --> K[Error Boundary]
    K --> L[Rendered UI]
    L --> N[Local UI State]
    L --> O[Interaction Event]
    O --> P[Event Validator / Router]
    P -->|Local State| N
    P -->|Authorized App Action| Q[Application Service]
    P -->|Needs Reasoning| A
```

### 4.3 推荐的进程边界

-   DSL
    解析和校验可以在服务端、客户端或两端执行；客户端必须重新执行关键校验，不能盲信服务端输出。
-   UI 组件运行在应用的受信任前端代码中。
-   专业引擎可按需懒加载，但必须有超时、加载失败和备用展示。
-   如果未来支持用户自定义代码预览或执行，应放入独立沙箱；不得复用普通
    DSL Renderer 的权限。
-   业务动作必须由应用服务端再次鉴权，不能以"按钮已显示"作为授权凭证。

------------------------------------------------------------------------

## 5. 支持的 UI 类型与底层渲染技术

本节是建议支持的产品能力目录。分类按任务目的组织，类别可以交叉；"支持"不意味着第一版全部实现。实施阶段见第
15 节。

### 5.1 信息展示型

  -----------------------------------------------------------------------------------------
  UI / Pattern      用途                   推荐底层技术      关键能力
  ----------------- ---------------------- ----------------- ------------------------------
  Text / Paragraph  普通文本、说明         HTML / React      段落、换行、可读性

  Markdown          技术回答、结构化说明   Markdown parser + 标题、列表、引用、代码
                                           安全 HTML         
                                           renderer          

  Heading / Divider 信息分层               DOM / CSS         层级与分隔

  Info Card         对象摘要、插件介绍     React / Vue + DOM 标题、描述、元数据、操作入口

  Metric Card       单个关键指标           DOM / SVG         数值、单位、变化、迷你趋势
                                           sparkline         

  Badge / Status    状态和分类             DOM / CSS         状态色、标签、文本替代

  Quote / Callout   引用、警告、提示       DOM / CSS         语义化强调

  Accordion /       长内容折叠             原生 `details` 或 展开、折叠、键盘操作
  Disclosure                               React 组件        

  Timeline          事件时间线             DOM / SVG         时间、状态、事件详情

  Step List         有序步骤               DOM               编号、完成状态、说明

  Tooltip / Popover 辅助信息               DOM + 浮层定位库  焦点管理、逃逸关闭
  -----------------------------------------------------------------------------------------

### 5.2 数据展示型

  -----------------------------------------------------------------------------------------------------
  UI / Pattern            推荐底层技术                           适用场景 / 注意点
  ----------------------- -------------------------------------- --------------------------------------
  Basic Table             HTML `<table>`                         中小规模、强调语义和可访问性

  Data Grid               TanStack Table +                       排序、筛选、分页、列配置、行展开
                          DOM；大数据量配虚拟列表                

  Bar / Line / Area Chart ECharts、Vega-Lite、Plotly、Recharts   类别比较、趋势、区间变化
                          之一                                   

  Pie / Donut Chart       同一图表引擎                           少量类别的构成；类别过多时改用条形图

  Scatter / Bubble Chart  ECharts、Vega-Lite、Plotly             分布、相关性、多维数据

  Histogram / Box Plot    ECharts、Vega-Lite、Plotly             统计分布；需验证输入数据

  Heatmap                 ECharts、D3 或专用矩阵视图             密集二维数据

  KPI Dashboard           DOM 布局 + 指标卡 + 图表               页面级组合，不是基础组件

  Log / Event Table       Data Grid / 虚拟列表                   大量日志、筛选、时间排序

  Progress / Gauge        DOM / SVG / 图表引擎                   进度、占比、阈值；需避免误导性刻度
  -----------------------------------------------------------------------------------------------------

**图表引擎选型建议：**

-   若优先需要完整交互和丰富图表，考虑 ECharts。
-   若优先需要声明式可视化语法和数据编码约束，考虑 Vega-Lite。
-   若需要科研绘图、复杂交互和较广图形能力，评估 Plotly。
-   若项目已采用 React 且偏好轻量组件式 API，可评估 Recharts。
-   第一版应尽量只选一个主图表引擎，避免同一图表类型出现多套重复实现。
-   无论使用哪种引擎，都要在 DSL
    与引擎配置之间设置白名单映射，不直接接受任意引擎配置对象。

### 5.3 用户输入型

  -----------------------------------------------------------------------------
  UI / Pattern            推荐底层技术             关键要求
  ----------------------- ------------------------ ----------------------------
  Text Input              HTML input / React       长度、类型、必填、错误提示

  Textarea                HTML textarea            字数限制、自动伸缩

  Number Input / Stepper  HTML input + 自定义控件  范围、精度、上下限

  Search Input            DOM + 防抖逻辑           搜索事件、清空、加载状态

  Radio Group             原生控件或成熟组件库     单选语义、键盘操作

  Checkbox / Multi-select 原生控件或组件库         多选、选择状态

  Select / Combobox       原生 select              大选项集、搜索、键盘操作
                          或可访问组件库           

  Segmented Control       DOM + Button             互斥选项

  Slider / Range Slider   HTML range 或成熟组件库  最小值、最大值、步长

  Date / Time Picker      原生控件或成熟日期库     时区、范围、格式校验

  Dynamic Form            React Hook Form          字段校验、默认值、提交状态
                          等表单状态库 + Schema    
                          validator                

  File Picker / Dropzone  浏览器 File API +        MIME、大小、上传权限、扫描
                          应用上传服务             

  JSON / Code Input       Monaco /                 只读/编辑模式、大小限制
                          CodeMirror（按需加载）   
  -----------------------------------------------------------------------------

表单协议应把字段定义与布局分开，避免把业务数据和 UI
配置混为一谈。敏感字段、文件内容和用户输入不应被自动发送给模型，必须由数据流策略明确决定。

### 5.4 决策与比较型

  --------------------------------------------------------------------------
  UI / Pattern            推荐底层技术            关键能力
  ----------------------- ----------------------- --------------------------
  Comparison Table        HTML Table / Data Grid  同一维度横向比较

  Option Card Group       DOM / React             选择方案、展示关键差异

  Pros / Cons             DOM / Markdown          分组说明、可读性

  Scoring Matrix          Table + 数值输入 / SVG  权重、评分依据、总分计算
                          图表                    

  Recommendation Panel    DOM / Card              推荐理由、限制、备选方案

  Decision Tree           SVG / React Flow        分支、路径、节点说明

  Budget Allocation       表单控件 + SVG /        调整预算、查看结果
                          图表引擎                

  Trade-off Chart         Scatter / Bar Chart     可解释的多维权衡
  --------------------------------------------------------------------------

推荐结果必须区分事实、用户提供的偏好、模型推断和主观评分。不能将模型估算的数字呈现为经验证的客观指标。

### 5.5 流程与 Agent 任务型

  --------------------------------------------------------------------------------
  UI / Pattern            推荐底层技术            关键能力
  ----------------------- ----------------------- --------------------------------
  Task Checklist / Plan   DOM / React             待执行、进行中、完成、失败

  Progress Bar            DOM / CSS               确定进度与不确定进度分开

  Stepper / Wizard        DOM / React             多阶段输入与状态恢复

  Tool Call Timeline      DOM / Virtual List      工具名称、状态、耗时、结果摘要

  Execution Log           虚拟列表 + 可展开详情   大量输出按需查看

  Approval Panel          DOM + 服务端授权接口    动作、影响范围、批准/拒绝

  Diff Viewer             Monaco Diff / 专用 Diff 变更审查、接受/拒绝
                          renderer                

  Checkpoint / Undo Panel DOM + 后端任务状态 API  检查点、撤销、恢复

  Retry / Recovery        DOM / Button            重试、跳过、重新配置
  Controls                                        

  Agent Handoff /         DOM + 运行时状态机      暂停、人工接管、继续执行
  Takeover                                        

  State Machine View      SVG / React Flow        状态和转换关系
  --------------------------------------------------------------------------------

注意：计划、日志、审批和 Diff
是不同语义。计划描述目标，日志记录已发生事实，审批负责授权，Diff
负责展示变更，回滚依赖真实的恢复能力，不能只做成视觉按钮。

### 5.6 导航与探索型

  ----------------------------------------------------------------------------
  UI / Pattern            推荐底层技术            关键能力
  ----------------------- ----------------------- ----------------------------
  Card Grid / Gallery     DOM / CSS Grid          对象浏览

  Carousel                DOM + 滚动 /            有限数量内容浏览
                          成熟轮播组件            

  Tabs                    DOM / Accessible tabs   同一内容区切换
                          component               

  Filters / Facets        DOM / Form controls     过滤结果

  Pagination              DOM                     大数据分页

  Virtual List            TanStack Virtual 等     大列表性能

  Tree View               DOM / Virtual Tree      层级展开与选择

  Search Results          DOM / Data Grid / Card  摘要、排序、筛选
                          List                    

  Breadcrumbs             DOM                     层级导航

  Command Palette         DOM + 键盘事件          快速操作与搜索

  Graph Explorer          Cytoscape.js / D3 /     关系探索、节点聚焦
                          React Flow              

  Map / Route             MapLibre GL JS          地理坐标、图层、路线、标记
                          或合适的地图 SDK        
  ----------------------------------------------------------------------------

### 5.7 产物与操作型

  ---------------------------------------------------------------------------
  UI / Pattern            推荐底层技术            关键能力
  ----------------------- ----------------------- ---------------------------
  Code Block              安全 Markdown renderer  复制、行号、语言标识
                          / Shiki 等高亮器        

  Code Viewer             Monaco / CodeMirror     大文件、跳转、搜索
                          或轻量高亮器            

  Code Editor             Monaco / CodeMirror     编辑、校验、只读/可写权限

  Diff View               Monaco Diff / diff      行级差异
                          renderer                

  Document Preview        Markdown / HTML / PDF   预览、目录、分页
                          viewer                  

  Artifact Card           DOM / React             文件名、类型、大小、状态

  Download / Export       应用服务 API            访问控制、短期链接、审计
  Action                                          

  Editable Artifact       受控编辑器 + 保存 API   草稿、版本、冲突处理

  SQL / Query Result      Code Editor + Data Grid 只读/执行权限、结果表

  Generated Diagram       Mermaid 或专用图形引擎  预览、错误定位、导出
  ---------------------------------------------------------------------------

文件卡片只展示资源信息，不应直接拼接不可信
URL。下载和打开必须经过应用路由及授权检查。

### 5.8 多媒体与空间型

  UI / Pattern       推荐底层技术                   关键能力
  ------------------ ------------------------------ ----------------------------------
  Image              HTML `<img>`                   尺寸约束、替代文本、加载失败状态
  Image Gallery      DOM / CSS Grid / Carousel      缩略图、放大、切换
  Image Annotation   SVG overlay / Canvas           区域框选、标注、坐标映射
  Audio Player       HTML `<audio>` + 自定义控件    播放、暂停、时间轴
  Video Player       HTML `<video>` 或专用播放器    字幕、章节、播放状态
  Transcript         DOM / Virtual List             时间戳、片段跳转
  Map / Route        地图引擎                       标记、路线、图层
  2D Canvas          Canvas / SVG                   自由绘制或大量图元
  3D Scene           Three.js / React Three Fiber   相机、材质、空间交互
  Spatial Layout     SVG / Canvas / WebGL           位置、连接、缩放与选择

### 5.9 专业可视化型

  ---------------------------------------------------------------------------
  UI / Pattern            推荐底层技术               关键能力
  ----------------------- -------------------------- ------------------------
  Flowchart               Mermaid（静态/声明式）或   节点、边、布局
                          React Flow（交互式）       

  Architecture Diagram    SVG / React Flow / Mermaid 服务、依赖、数据流

  Sequence Diagram        Mermaid 或专用时序图引擎   参与者、消息、时序

  ER Diagram              SVG / React Flow / 专用 ER 表、字段、关系
                          renderer                   

  Dependency Graph        Cytoscape.js / D3 / React  关系、路径、局部展开
                          Flow                       

  Knowledge Graph         Cytoscape.js / D3 / WebGL  节点关系、筛选、聚焦
                          方案                       

  Math Formula            KaTeX / MathJax            公式排版

  Function Plot           SVG / Canvas / Plotly      函数曲线、参数变化

  Geometry Visualization  SVG / Canvas / Three.js    点、线、面、交互

  UML / State Diagram     Mermaid / 专用图形引擎     类图、状态图、时序图

  SQL Explain Plan        Tree / Graph / Data Grid   计划节点、耗时、代价

  Design Canvas           SVG / Canvas / WebGL       拖动、缩放、选择、编辑
  ---------------------------------------------------------------------------

### 5.10 基础交互控件

以下不是独立业务 UI 类别，但属于组件库的基础能力：

-   Button、Icon Button、Link。
-   Checkbox、Radio、Switch。
-   Input、Textarea、Select、Combobox。
-   Slider、Date Picker、Time Picker。
-   Tabs、Accordion、Popover、Tooltip。
-   Dialog、Drawer、Toast、Inline Alert。
-   Loading Indicator、Skeleton、Empty State。
-   Error State、Retry Control、Permission Denied State。
-   Copy、Open、Download、Export 等受控动作。

### 5.11 推荐的首发技术栈

建议不要一次性引入所有表格、图表、图形和编辑器库。第一版可选：

-   **宿主 UI**：React + TypeScript（若现有产品已使用 Vue，则不必为了
    GenUI 迁移）。
-   **协议与校验**：JSON Schema + Ajv 或同类验证器；TypeScript
    类型用于开发期，不代替运行时校验。
-   **基础组件**：项目已有组件库或一套一致的 accessible primitives。
-   **图表**：选择 ECharts 或 Vega-Lite 作为主引擎。
-   **流程图**：Mermaid 用于简单声明式图；React Flow
    用于需要交互编辑的节点图。
-   **代码**：轻量只读高亮器优先；确有编辑需求时再加载 Monaco /
    CodeMirror。
-   **Markdown**：使用安全解析器，禁用不需要的原始 HTML 和危险 URL。
-   **虚拟列表**：只有数据规模需要时才引入。
-   **地图 / 3D**：按产品需求懒加载，不进入基础 bundle。

------------------------------------------------------------------------

## 6. UI DSL 协议

### 6.1 协议设计要求

DSL 应当：

1.  是纯数据格式，不包含可执行代码。
2.  有显式版本字段。
3.  使用稳定的语义组件类型，而非框架组件名。
4.  将组件属性、布局、数据、交互动作分离。
5.  允许未知的非关键字段被安全忽略，但未知组件类型必须有明确策略。
6.  限制深度、节点数量、字符串长度、数据集大小和资源引用。
7.  支持向后兼容和迁移。
8.  能够通过 Schema、语义校验和安全策略分别验证。

### 6.2 顶层结构

建议第一版使用如下结构：

``` json
{
  "protocol": "agent-genui",
  "version": "1.0",
  "id": "ui_01",
  "title": "Kafka 请求统计",
  "layout": {
    "type": "stack",
    "gap": "md"
  },
  "data": {
    "requestStats": {
      "columns": ["time", "requests"],
      "rows": [
        ["10:00", 120],
        ["10:05", 156],
        ["10:10", 143]
      ]
    }
  },
  "children": [
    {
      "id": "requests-chart",
      "type": "chart",
      "version": "1",
      "props": {
        "chartType": "line",
        "title": "请求趋势",
        "dataset": "requestStats",
        "xField": "time",
        "series": [
          {
            "field": "requests",
            "label": "请求数"
          }
        ]
      }
    }
  ]
}
```

说明：

-   `protocol`：协议名称。
-   `version`：DSL 主版本。
-   `id`：一次 UI 实例的稳定标识。
-   `layout`：根布局。
-   `data`：受控数据集，或在后续版本中改用有权限的数据引用。
-   `children`：语义组件树。
-   `type`：组件语义类型。
-   `version`：组件契约版本。
-   `props`：经过该组件 Schema 验证的属性。

示例中的 `data`
只适用于小型数据集。大数据集、敏感数据和远程资源应使用服务端授权的数据引用，而不是把全部数据嵌入
DSL。

### 6.3 布局协议

初始布局类型建议保持有限：

-   `stack`：纵向堆叠。
-   `row`：横向排列。
-   `grid`：网格布局。
-   `split`：两区域分栏。
-   `tabs`：标签页内容。
-   `panel`：带标题的分区。

不建议第一版让模型任意指定
CSS、绝对定位或任意嵌套布局。布局系统应根据容器宽度自动适配；不支持的布局应规范化或降级。

### 6.4 组件示例

#### 信息卡

``` json
{
  "id": "plugin-card",
  "type": "card",
  "version": "1",
  "props": {
    "title": "日志分析",
    "description": "按时间和级别检索日志",
    "tone": "neutral"
  }
}
```

#### 表格

``` json
{
  "id": "error-table",
  "type": "table",
  "version": "1",
  "props": {
    "columns": [
      {"key": "time", "label": "时间"},
      {"key": "level", "label": "级别"},
      {"key": "message", "label": "消息"}
    ],
    "rows": [
      {"time": "10:01", "level": "ERROR", "message": "Connection timeout"}
    ],
    "pageSize": 20
  }
}
```

#### 表单

``` json
{
  "id": "search-form",
  "type": "form",
  "version": "1",
  "props": {
    "title": "查询日志",
    "fields": [
      {
        "name": "keyword",
        "type": "text",
        "label": "关键词",
        "required": true,
        "maxLength": 100
      },
      {
        "name": "level",
        "type": "select",
        "label": "级别",
        "options": [
          {"label": "错误", "value": "error"},
          {"label": "警告", "value": "warn"}
        ]
      }
    ],
    "submitAction": "logs.search"
  }
}
```

`submitAction` 必须指向运行时注册的动作 ID，不能直接传函数或任意 URL。

#### 方案比较

``` json
{
  "id": "framework-comparison",
  "type": "comparison",
  "version": "1",
  "props": {
    "options": [
      {"id": "a", "label": "方案 A"},
      {"id": "b", "label": "方案 B"}
    ],
    "criteria": [
      {
        "key": "cost",
        "label": "成本",
        "values": {"a": "低", "b": "中"}
      },
      {
        "key": "complexity",
        "label": "复杂度",
        "values": {"a": "中", "b": "低"}
      }
    ],
    "recommendedOptionId": "a",
    "recommendationReason": "适合当前的低维护成本要求"
  }
}
```

#### Agent 任务计划

``` json
{
  "id": "task-plan",
  "type": "taskPlan",
  "version": "1",
  "props": {
    "items": [
      {"id": "inspect", "label": "检查配置", "status": "completed"},
      {"id": "validate", "label": "验证参数", "status": "running"},
      {"id": "execute", "label": "执行任务", "status": "pending"}
    ]
  }
}
```

执行状态应来自 Agent Runtime 的可信任务状态；模型生成的静态 UI
不应伪造"已经完成"的系统操作。

#### 流程图

``` json
{
  "id": "pipeline",
  "type": "diagram",
  "version": "1",
  "props": {
    "diagramType": "flowchart",
    "nodes": [
      {"id": "input", "label": "输入"},
      {"id": "validate", "label": "校验"},
      {"id": "render", "label": "渲染"}
    ],
    "edges": [
      {"source": "input", "target": "validate"},
      {"source": "validate", "target": "render"}
    ]
  }
}
```

推荐由 Renderer
将受控节点数据转换成图形引擎所需配置，而不是默认允许模型输出任意 Mermaid
脚本或任意图形引擎配置。

### 6.5 JSON Schema 示例

下面是简化示例，用于说明协议边界。生产环境应为每个组件建立独立
Schema，并补充节点深度、总节点数和资源大小限制。

``` json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["protocol", "version", "id", "children"],
  "properties": {
    "protocol": {"const": "agent-genui"},
    "version": {"type": "string", "const": "1.0"},
    "id": {"type": "string", "minLength": 1, "maxLength": 128},
    "title": {"type": "string", "maxLength": 200},
    "layout": {
      "type": "object",
      "properties": {
        "type": {
          "enum": ["stack", "row", "grid", "split", "tabs", "panel"]
        },
        "gap": {"enum": ["none", "sm", "md", "lg"]}
      },
      "required": ["type"],
      "additionalProperties": false
    },
    "children": {
      "type": "array",
      "maxItems": 50,
      "items": {"$ref": "#/$defs/node"}
    }
  },
  "additionalProperties": false,
  "$defs": {
    "node": {
      "type": "object",
      "required": ["id", "type", "version", "props"],
      "properties": {
        "id": {"type": "string", "minLength": 1, "maxLength": 128},
        "type": {
          "enum": [
            "text", "card", "table", "chart", "form",
            "comparison", "taskPlan", "diagram", "code", "image"
          ]
        },
        "version": {"type": "string", "maxLength": 32},
        "props": {"type": "object"}
      },
      "additionalProperties": false
    }
  }
}
```

注意：通用 Schema 只负责外层结构。`props` 必须按 `type + version`
分发到对应的组件 Schema，不能因为它是对象就默认合法。

### 6.6 数据引用设计

数据规模较小时可以内嵌数据；复杂场景建议使用：

``` json
{
  "datasetRef": {
    "id": "dataset_123",
    "schemaVersion": "1",
    "scope": "current-task"
  }
}
```

规则：

-   引用由服务端或应用数据层签发。
-   引用必须绑定当前用户、会话或任务权限。
-   客户端不能通过修改 ID 访问未授权数据。
-   数据集大小、行数、列数、字符串长度和敏感字段需要限制。
-   数据源不存在时，显示可恢复的数据不可用状态，而不是崩溃。

------------------------------------------------------------------------

## 7. 解析、规范化与多层验证

### 7.1 验证层次

**第 1 层：输入限制与 JSON 解析**

-   限制输入字节数。
-   拒绝无效 JSON、截断 JSON 和不支持的协议。
-   限制字符串长度、嵌套深度和数组大小。
-   防止超大输入导致 CPU 或内存耗尽。

**第 2 层：根结构 Schema**

-   必填字段。
-   字段类型。
-   协议版本。
-   允许的根布局。
-   节点数量上限。

**第 3 层：组件契约**

-   组件类型是否注册。
-   组件版本是否支持。
-   `props` 是否符合组件专用 Schema。
-   枚举值、数值范围和默认值是否有效。

**第 4 层：语义验证**

-   `datasetRef` 是否存在且授权。
-   图表字段是否存在且类型兼容。
-   图形节点 ID 是否唯一。
-   边是否引用存在的节点。
-   表单字段名称是否唯一。
-   提交动作是否注册。
-   组件组合是否满足布局约束。

**第 5 层：安全与权限策略**

-   禁止任意代码执行。
-   拒绝危险协议和不可信 URL。
-   限制资源加载来源。
-   对动作 ID 做 allowlist 校验。
-   验证动作参数和用户权限。
-   限制组件数量、计算量和媒体资源。
-   避免通过错误信息泄漏秘密或内部堆栈。

**第 6 层：运行时检查**

-   渲染器是否加载成功。
-   数据是否在渲染前后仍然有效。
-   交互事件是否符合组件契约。
-   异步加载是否超时。
-   组件是否出现异常或资源泄漏。

### 7.2 规范化规则

可以自动处理的规则：

-   补齐文档规定的可选默认值。
-   统一枚举大小写或旧版本别名（仅在协议明确允许时）。
-   将旧协议版本迁移到当前内部表示。
-   为缺失但可安全生成的稳定节点 ID 分配 ID。
-   删除明确标记为非关键的未知装饰字段。
-   对超出显示精度的数值按组件规范格式化。

不能自动猜测的情况：

-   缺失的业务数据。
-   不明确的单位或时区。
-   未知的操作权限。
-   无法判断的图表字段映射。
-   可能改变业务语义的字段。
-   用户未授权的动作。

### 7.3 组件注册契约

建议为每个组件注册：

``` ts
type ValidationIssue = {
  path: string;
  code: string;
  message: string;
  repairable: boolean;
};

type ValidationResult =
  | { valid: true }
  | { valid: false; issues: ValidationIssue[] };

type ComponentDefinition = {
  type: string;
  version: string;
  schema: unknown;
  validateSemantics?: (
    props: unknown,
    context: ValidationContext
  ) => ValidationResult;
  fallbackType?: string;
  capabilities: string[];
  maxPayloadBytes?: number;
};
```

示例仅表达接口意图，实际 TypeScript 类型应根据具体校验库、React
版本和运行时上下文细化。

------------------------------------------------------------------------

## 8. 修复、重试与异常兜底

### 8.1 错误分类

  错误                  默认动作                            是否调用模型
  --------------------- ----------------------------------- ------------------
  JSON 语法错误         发送有限修复请求；超限后降级        可以
  Schema 不通过         返回精确路径和约束                  可以
  未知组件类型          映射到通用文本/卡片或跳过可选节点   通常不需要
  可选属性缺失          填默认值                            不需要
  属性语义不合法        确定性修复或模型修复                视情况
  数据引用不存在        重新绑定、请求数据或显示空状态      视情况
  图表数据类型不兼容    转换仅限无歧义场景，否则降级        视情况
  Renderer 加载失败     备用 Renderer / 简化视图            不需要
  单个节点渲染异常      隔离节点，其他节点继续渲染          不需要
  根节点结构不可恢复    返回纯文本或通用错误视图            可选
  权限违规              拒绝操作并记录安全事件              不可通过重试绕过
  模型超时 / 输出截断   有界重试，最终返回文本              可以
  资源超限              截断、分页或拒绝超限内容            通常不需要

### 8.2 推荐恢复顺序

``` text
1. 解析失败
   -> 只允许有限的格式修复
   -> 仍失败则安全降级

2. Schema / 组件契约失败
   -> 尝试确定性修复
   -> 仍失败且可修复时请求模型修改失败片段
   -> 再次验证

3. 语义失败
   -> 先检查数据引用、字段映射和动作注册
   -> 无法无歧义修复时请求模型修改
   -> 超限则降级相关节点

4. 安全 / 权限失败
   -> 拒绝危险节点或动作
   -> 记录审计事件
   -> 不允许模型重试绕过安全规则

5. 渲染失败
   -> Error Boundary 隔离节点
   -> 使用 fallback renderer
   -> 无 fallback 时显示简短错误状态
```

### 8.3 有界重试

建议初始配置：

-   确定性修复：最多 2 次局部修复循环。
-   模型修复：最多 1 次，复杂场景最多 2 次。
-   整份 DSL
    重新生成：默认不重试；只有根结构无法修复且任务价值较高时才考虑。
-   总恢复时间：设置硬超时，不能无限等待。
-   每次模型修复只发送失败节点、错误路径、允许修改的字段和必要上下文。
-   修复后必须重新执行全部相关验证，不能直接信任修复输出。

这些数值是初始建议，应通过实际模型质量、延迟和失败率指标调整。

### 8.4 错误响应格式

``` json
{
  "code": "UI_SCHEMA_INVALID",
  "message": "组件属性不符合协议",
  "issues": [
    {
      "path": "children[0].props.series[0].field",
      "code": "UNKNOWN_DATA_FIELD",
      "message": "字段不存在于当前数据集中",
      "repairable": true
    }
  ],
  "recovery": {
    "strategy": "model_repair",
    "attempt": 1,
    "maxAttempts": 2
  }
}
```

错误消息应提供可定位信息，但不得包含密钥、敏感数据、内部系统提示词或完整服务端堆栈。

### 8.5 兜底策略

优先级：

1.  保留有效节点，仅替换失败节点。
2.  使用同类别的轻量备用渲染器。
3.  将结构化数据转换为表格或列表。
4.  将无法渲染的内容转成安全的纯文本摘要。
5.  若整个输出不可信或违反安全策略，拒绝渲染并给出简洁原因。

兜底本身也要经过安全处理。不能因为进入 fallback 就绕过
URL、HTML、数据大小或权限检查。

------------------------------------------------------------------------

## 9. Renderer Registry 与渲染流程

### 9.1 注册表职责

Renderer Registry 根据 `type + version` 找到组件定义和渲染器，负责：

-   查询组件是否支持。
-   查询组件版本和能力。
-   获取 Schema 与默认值。
-   选择渲染器实现。
-   选择 fallback 类型。
-   提供懒加载策略。
-   维护兼容性和弃用状态。

示意接口：

``` ts
type RenderContext = {
  uiId: string;
  componentId: string;
  locale: string;
  theme: "light" | "dark" | "system";
  dataResolver: DataResolver;
  eventDispatcher: EventDispatcher;
};

type Renderer<TProps = unknown> = {
  validateProps(props: unknown): ValidationResult;
  render(props: TProps, context: RenderContext): UIElement;
};

interface RendererRegistry {
  get(type: string, version: string): Renderer | undefined;
}
```

这里的 `UIElement` 是概念占位符，不意味着 DSL 必须绑定
React。具体实现可使用 React Element、Vue VNode 或内部渲染节点。

### 9.2 渲染规则

-   每个组件都必须有稳定 ID，便于状态管理和局部更新。
-   同一 UI 中 ID 不得重复。
-   Renderer 不得执行 DSL 中提供的任意代码。
-   Renderer 只能调用注册过的动作。
-   组件不能直接越过 Event Dispatcher 修改 Agent 内部状态。
-   大型图表、代码编辑器、地图和 3D 引擎按需加载。
-   为每个复杂组件设置合理的资源上限。
-   支持无障碍标签、键盘操作和明确的加载/错误状态。
-   不允许通过任意 CSS 破坏宿主布局或覆盖安全界面。

### 9.3 组件级错误边界

每个复杂节点应能独立捕获运行时异常。推荐处理：

1.  捕获渲染异常。
2.  记录组件类型、版本、错误代码和关联 ID。
3.  不记录不必要的完整敏感 props。
4.  尝试备用渲染器。
5.  备用渲染器失败时显示简化错误节点。
6.  不影响兄弟节点和对话其余内容。

React 的 Error Boundary
可以捕获其子树中的部分渲染错误，但不能替代异步操作、事件处理器、数据请求和安全校验的显式错误处理。

------------------------------------------------------------------------

## 10. 交互事件协议

### 10.1 事件分类

**本地事件**：展开、折叠、Tab
切换、表格排序、分页、图例切换、输入框变化、局部筛选。默认在客户端处理，不调用模型。

**应用动作**：查询、保存、导出、提交表单、打开已授权资源。通过注册动作路由器调用应用服务，执行服务端授权和参数校验。

**Agent
事件**：需要模型理解或继续规划的用户行为，例如"按这些条件重新分析"。只发送必要的状态和用户意图，不把整个
UI 树无条件重新注入上下文。

### 10.2 事件信封

``` json
{
  "protocol": "agent-genui-event",
  "version": "1.0",
  "eventId": "evt_123",
  "uiId": "ui_01",
  "componentId": "search-form",
  "event": "submit",
  "payload": {
    "keyword": "timeout",
    "level": "error"
  },
  "source": "user"
}
```

服务端或 Runtime 需要验证：

-   `uiId` 和 `componentId` 是否属于当前会话。
-   事件名称是否由该组件声明。
-   Payload 是否符合事件 Schema。
-   事件是否重复提交。
-   当前用户是否有权执行目标动作。
-   数据是否过期或任务是否已结束。

### 10.3 动作注册

``` ts
type ActionDefinition = {
  id: string;
  inputSchema: unknown;
  authorization: "public" | "authenticated" | "privileged";
  execute: (
    input: unknown,
    context: ActionContext
  ) => Promise<ActionResult>;
};
```

DSL 只能引用已注册的 `id`，不能提供 `execute`
函数。权限检查必须在真正执行动作时进行，而不是只在 UI 生成时做一次。

### 10.4 避免无意义的模型调用

以下事件通常不应触发 Agent：

-   展开一个折叠面板。
-   在本地表格排序。
-   切换图表图例。
-   改变轮播页。
-   在已经载入的选项中切换 Tab。
-   调整仅影响本地预览的控件。

以下事件可能触发 Agent：

-   用户要求对筛选结果进行解释。
-   用户选择方案并要求继续执行。
-   用户输入新的自然语言目标。
-   用户请求对当前任务重新规划。

------------------------------------------------------------------------

## 11. 安全与信任边界

### 11.1 禁止执行任意生成代码

默认禁止：

-   `eval`、`Function`、动态导入生成代码。
-   模型提供的任意脚本、事件处理函数和回调。
-   不受限的 HTML 注入。
-   未验证的 `javascript:`、`data:` 等危险 URL。
-   模型指定的任意网络请求或任意 API 地址。
-   通过 DSL 直接访问浏览器 Cookie、Local Storage 或宿主内部对象。

如果未来产品需要生成可运行代码，应建立独立沙箱，限制网络、文件、CPU、内存和执行时间，并通过单独的安全评审。

### 11.2 XSS 与内容安全

-   Markdown 渲染时禁用或严格净化原始 HTML。
-   链接和图片 URL 使用协议白名单。
-   外部图片、视频、地图资源遵守 CSP 和允许来源策略。
-   用户内容与模型内容均按不可信输入处理。
-   组件属性不能被直接拼接成 HTML。
-   对下载文件和导出产物进行访问控制。

### 11.3 权限

-   UI 显示某个按钮不代表用户获得了权限。
-   服务端必须再次鉴权。
-   高风险动作必须显示影响范围并取得明确确认。
-   事件 ID、动作 ID 和资源引用都要校验。
-   需要审计的操作应记录操作者、时间、资源和结果。
-   不允许通过模型修复流程绕过安全校验。

### 11.4 资源与拒绝服务保护

建议设置可配置限制：

-   最大 DSL 字节数。
-   最大组件节点数。
-   最大树深度。
-   单组件最大属性体积。
-   最大数据集行数、列数和单元格长度。
-   最大图片/音视频资源大小。
-   图表点数上限。
-   图形节点和边数量上限。
-   渲染器加载超时。
-   单次模型修复总时限。

具体阈值应通过实际负载测试确定，避免写死为所有业务共用的常数。

------------------------------------------------------------------------

## 12. 状态管理与上下文成本

### 12.1 状态分类

1.  **展示状态**：展开、当前 Tab、排序、分页、缩放。
2.  **表单状态**：输入值、校验错误、是否已提交。
3.  **任务状态**：Agent 计划、工具调用、执行结果。
4.  **数据状态**：数据集引用、版本、加载状态。
5.  **权限状态**：可执行动作、审批状态、资源授权。

展示状态通常保存在客户端；任务和权限状态由可信 Runtime
或服务端维护。不要把模型生成的 UI 文档当作任务状态的唯一事实来源。

### 12.2 面向模型的上下文策略

-   不把每次本地交互的完整 UI 状态发回模型。
-   Agent 只接收对下一步推理有意义的事件。
-   大表格、日志和图表数据通过数据引用或摘要传递。
-   修复请求只携带失败节点和相关错误，不重复整个历史。
-   为 UI DSL 设定生成 Token 预算。
-   对重复、静态和低价值字段进行规范化压缩。
-   保留必要的 UI ID、版本和状态关联，避免无条件重放完整 UI。

### 12.3 流式生成

第一版建议先支持完整 JSON
输出，确保解析和恢复路径稳定。后续如要流式渲染：

-   使用明确的增量协议或结构化输出机制。
-   只渲染已完成且通过局部验证的节点。
-   未闭合的 JSON 片段不能直接当作完整 UI。
-   为增量节点建立临时状态和取消机制。
-   最终完整文档仍需执行全量验证。
-   发生修复时应避免闪烁和丢失用户输入。

------------------------------------------------------------------------

## 13. 版本、兼容性与扩展

### 13.1 版本规则

-   协议版本和组件版本分开管理。
-   非破坏性新增可选字段可以在兼容版本内发布。
-   删除字段、改变语义或改变必填约束时，应升级主版本或提供迁移。
-   对旧 DSL 建立迁移函数，先迁移再校验内部规范。
-   未知主版本默认拒绝或降级，不应猜测解释。

### 13.2 组件生命周期

组件应有以下状态：

-   `experimental`：实验性，可能变化。
-   `stable`：稳定支持。
-   `deprecated`：不建议新内容使用，但仍兼容旧内容。
-   `disabled`：安全或运行时原因暂时不可用。

### 13.3 新增组件的标准流程

1.  明确组件语义与适用任务。
2.  定义 DSL 属性和事件契约。
3.  编写 JSON Schema。
4.  编写语义验证规则。
5.  实现主 Renderer 和 fallback。
6.  增加安全、可访问性和性能测试。
7.  加入 Registry 并标注版本。
8.  增加模型选择规则和示例。
9.  通过灰度和指标验证后转为 stable。

------------------------------------------------------------------------

## 14. 可观测性与评估

### 14.1 关键指标

  指标                            含义
  ------------------------------- --------------------------------
  UI Generation Success Rate      生成结果通过验证的比例
  Schema Failure Rate             结构或组件契约失败比例
  Repair Success Rate             修复后通过验证的比例
  Fallback Rate                   降级到通用 UI 或文本的比例
  Renderer Error Rate             渲染器异常比例
  First Render Latency            从收到输出到首个可用 UI 的耗时
  Full Render Latency             完整 UI 可交互的耗时
  Interaction Success Rate        事件验证并成功执行的比例
  Invalid Action Rejection Rate   非法动作被拒绝的比例
  DSL Token Cost                  生成和修复消耗的 Token
  Bundle / Lazy-load Cost         UI 引擎加载成本
  Accessibility Test Pass Rate    可访问性自动化测试通过率

### 14.2 日志要求

建议记录：

-   trace ID、conversation/task ID、UI ID。
-   协议版本和组件版本。
-   生成耗时、解析耗时、验证耗时、渲染耗时。
-   错误类别、错误路径、修复次数。
-   选择的 Renderer 和 fallback。
-   事件类型、授权结果和执行状态。

默认不要记录完整用户数据、完整 DSL 或敏感
props。若调试需要保留样本，应使用脱敏、访问控制、保留期限和用户数据策略。

### 14.3 质量评估集

建立固定测试集，覆盖：

-   简单解释不生成多余 UI。
-   比较任务生成可读对比表。
-   大数据任务采用表格、筛选或摘要。
-   多参数任务生成可校验表单。
-   Agent 长任务显示可信任务状态。
-   图表字段错误能够被发现并恢复。
-   未知组件不会导致整页崩溃。
-   恶意 HTML、危险 URL 和任意代码被拒绝。
-   未授权动作无法执行。
-   渲染器加载失败能进入 fallback。
-   局部节点崩溃不会破坏兄弟节点。
-   低屏幕宽度下布局仍然可用。

------------------------------------------------------------------------

## 15. 实施路线图

### Phase 0：协议与运行时骨架

交付：

-   JSON DSL v1。
-   根 Schema、节点 Schema、组件 Registry。
-   Parser、Normalizer、Validator。
-   统一错误模型。
-   文本 fallback。
-   基础日志和测试框架。

退出条件：非法 JSON、未知版本、超限节点和非法属性均可被确定性处理。

### Phase 1：P0 通用组件

首批支持：

-   Text / Markdown。
-   Heading / Divider。
-   Card / Metric / Badge。
-   List / Accordion / Timeline。
-   Table。
-   Button / Link。
-   Input / Textarea / Select / Checkbox / Radio。
-   Form。
-   Code Block。
-   Image / Artifact Card。
-   Inline Error / Loading / Empty State。

退出条件：常见回答、数据列表、表单收集和文件交付可用；关键交互均通过契约校验。

### Phase 2：数据可视化与 Agent 状态

增加：

-   Line / Bar / Pie / Scatter Chart。
-   KPI Dashboard。
-   Task Plan / Progress。
-   Tool Timeline / Execution Log。
-   Approval Panel。
-   Diff View。
-   Retry / Recovery Controls。

退出条件：图表数据校验、任务状态同步、审批授权和局部错误隔离通过测试。

### Phase 3：导航和专业图形

按真实需求引入：

-   Tabs / Filters / Pagination / Virtual List。
-   Tree / Graph Explorer。
-   Mermaid Flowchart。
-   React Flow 交互图。
-   数学公式与函数图。
-   Map / Route。
-   Monaco / CodeMirror。
-   视频和图像标注。

退出条件：专用引擎可懒加载，加载失败有 fallback，复杂图形性能符合目标。

### Phase 4：优化与高级能力

-   流式增量 UI。
-   组件级懒加载与 bundle 优化。
-   DSL 迁移工具。
-   组件弃用与兼容策略。
-   自动化视觉回归。
-   生成策略评估与反馈闭环。
-   受控的自定义扩展机制。

退出条件：性能、兼容性、错误率和安全评估达到项目目标。

------------------------------------------------------------------------

## 16. 测试策略

### 16.1 单元测试

-   每个组件 Schema 的有效与无效样例。
-   默认值与规范化。
-   DSL 版本迁移。
-   事件 payload 校验。
-   Action Registry 的权限规则。
-   错误分类和恢复决策。

### 16.2 集成测试

-   JSON → Parser → Validator → Renderer。
-   未知组件 → fallback。
-   数据引用失效 → 空状态或重绑定。
-   Renderer 动态加载失败 → 备用渲染器。
-   表单提交 → 事件路由 → 应用动作。
-   高风险动作 → 授权检查 → 审计。
-   局部组件崩溃 → 兄弟节点仍可用。

### 16.3 安全测试

-   XSS 字符串与恶意 Markdown。
-   危险 URL 协议。
-   超大嵌套对象和数组。
-   重复组件 ID。
-   未注册动作 ID。
-   伪造或重放事件。
-   未授权数据集引用。
-   恶意属性和未知协议版本。
-   模型试图输出脚本或动态导入。

### 16.4 视觉与可访问性测试

-   桌面与窄屏布局。
-   长文本、空数据、超长标签。
-   深色和浅色主题。
-   键盘导航、焦点可见性、ARIA 语义。
-   加载、失败、禁用和空状态。
-   图表替代说明和非颜色状态表达。

------------------------------------------------------------------------

## 17. 验收标准

第一版发布前至少满足以下条件：

### 协议与校验

-   [ ] 所有 DSL 均带协议版本。
-   [ ] 未知协议版本不会被静默误解析。
-   [ ] 每个已支持组件都有 Schema 和版本。
-   [ ] 节点数量、深度、字符串和数据体积有限制。
-   [ ] 语义验证能够识别不存在的数据字段和图形节点。
-   [ ] 修复输出必须重新经过验证。

### 渲染与恢复

-   [ ] 未知组件可降级或明确报错，不导致整页崩溃。
-   [ ] 单个 Renderer 异常可以被隔离。
-   [ ] 复杂 Renderer 有加载失败状态和 fallback。
-   [ ] 模型重试有次数和总时间上限。
-   [ ] 安全错误不会进入可绕过权限的模型重试流程。
-   [ ] 空数据、超大数据和无效数据均有定义好的表现。

### 交互与安全

-   [ ] 本地 UI 交互默认不触发模型调用。
-   [ ] 所有应用动作都通过注册表和服务端鉴权。
-   [ ] 事件 payload 经过 Schema 校验。
-   [ ] 未注册动作、伪造事件和未授权数据引用被拒绝。
-   [ ] 不执行模型生成的任意 JavaScript。
-   [ ] Markdown、链接、图片和外部资源遵守安全策略。

### 工程质量

-   [ ] 关键链路有单元、集成和安全测试。
-   [ ] 有生成成功率、修复成功率、fallback 率和渲染错误率指标。
-   [ ] 支持稳定组件的版本兼容和弃用流程。
-   [ ] 基础 UI 不依赖所有专业引擎同时加载。
-   [ ] UI 在窄屏、键盘导航和错误状态下仍可使用。

### 建议的初始 SLO

以下是可讨论的起始目标，不是对所有项目都适用的硬性标准：

-   基础 DSL 解析与校验：P95 小于 50 ms（不含模型生成与外部数据请求）。
-   基础 UI 首次可交互：P95 小于 1 s（不含模型生成与网络环境差异）。
-   单个组件渲染异常导致整页不可用：目标为 0。
-   未授权动作执行成功：目标为 0。
-   所有已发布稳定组件：必须具备 Schema、基本交互测试和 fallback
    行为定义。

------------------------------------------------------------------------

## 18. 关键设计决策总结

1.  **协议采用 JSON DSL**，不让模型直接生成并执行前端代码。
2.  **组件按语义类型定义**，与 React、Vue 和具体组件库解耦。
3.  **验证分层**：结构、组件契约、语义、安全、运行时。
4.  **先确定性修复，再进行有界模型修复**；所有修复结果重新校验。
5.  **异常按类别恢复**：局部降级、备用 Renderer、文本
    fallback、安全拒绝。
6.  **通过 Renderer Registry 分发**，专用图形和编辑器按需加载。
7.  **本地交互与 Agent 推理解耦**，只将有推理价值的事件回传模型。
8.  **权限由应用服务端执行**，不以 UI 展示状态作为授权。
9.  **先建设 P0 通用组件和运行时骨架**，再按实际需求扩展专业 UI。
10. **用评估集、指标和验收标准持续优化**，而不是单纯追求组件数量。

## 19. 参考资料

以下资料可用于实施时核对具体 API
和能力；选型时应以项目当前版本的官方文档为准。

-   JSON Schema：<https://json-schema.org/>
-   Ajv JSON Schema Validator：<https://ajv.js.org/>
-   React：<https://react.dev/>
-   TanStack Table：<https://tanstack.com/table>
-   TanStack Virtual：<https://tanstack.com/virtual>
-   Apache ECharts：<https://echarts.apache.org/>
-   Vega-Lite：<https://vega.github.io/vega-lite/>
-   Plotly.js：<https://plotly.com/javascript/>
-   Recharts：<https://recharts.org/>
-   React Flow：<https://reactflow.dev/>
-   Mermaid：<https://mermaid.js.org/>
-   Monaco Editor：<https://microsoft.github.io/monaco-editor/>
-   CodeMirror：<https://codemirror.net/>
-   Cytoscape.js：<https://js.cytoscape.org/>
-   D3.js：<https://d3js.org/>
-   MapLibre GL JS：<https://maplibre.org/maplibre-gl-js/docs/>
-   Three.js：<https://threejs.org/docs/>
-   KaTeX：<https://katex.org/>
-   JSON Forms：<https://jsonforms.io/>

------------------------------------------------------------------------

**文档结束。**
