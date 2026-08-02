# ADR 0002：技术选型

- 状态：已采纳
- 日期：2026-08-02
- 依赖：[0001-self-build-vs-saas-vs-oss](0001-self-build-vs-saas-vs-oss.md)

## 决策

| 领域 | 选型 | 理由 |
|---|---|---|
| 语言 | TypeScript 全栈 | 跨包共享类型（domain 类型、zod 校验 schema），是实现"高内聚低耦合"的关键手段之一 |
| Web 框架 | Next.js（App Router） | 公开面板 + 管理后台 + API Routes 一套代码；中间件可做子域名→租户解析；部署到 Vercel 免费额度 |
| 数据库 | Supabase（PostgreSQL） | 免费额度覆盖早期体量；原生支持 Row Level Security，用于在数据层强制"公开可读、仅管理员可改状态"，而不是仅靠应用层代码约束；未来可开 `pgvector` 扩展支撑 AI 判重、开 Storage 支撑附件 |
| 事件/异步处理 | Supabase Edge Functions（Deno） | 用 DB Webhook 监听 `feedback`/`replies` 表变更，触发通知邮件，而不是在业务代码里直接调用发信逻辑——这是"业务动作"与"副作用"解耦的关键设计点，见 ARCHITECTURE.md |
| 邮件 | Resend | 免费额度足够早期体量，API 简单，Next.js/Edge Function 生态支持好 |
| 防刷 | Cloudflare Turnstile + 蜜罐字段 + IP 频率限制（Upstash Redis 免费额度） | Turnstile 免费、无需用户解谜验证码；频率限制用 Redis 而不是 Postgres 表，避免为了限流引入额外的清理任务 |
| 嵌入组件 | 原生 TypeScript（不绑定框架），Vite library mode 打包为单文件 IIFE，挂载到 Shadow DOM | 满足"无框架嵌入"要求：一个 `<script>` 标签即可用于静态站、React、WordPress 等任意宿主；Shadow DOM 隔离样式，避免与宿主页面 CSS 冲突 |
| 包管理/Monorepo | pnpm workspaces | 原生 workspace 协议管理包间依赖，比 npm/yarn 更省磁盘、安装更快 |
| 测试 | Vitest（单元）+ Playwright（关键路径 e2e） | 核心校验规则（投票去重、频率限制、租户解析）用单元测试覆盖；提交反馈、投票、管理员回复走一遍 e2e |
| CI | GitHub Actions | PR 时跑 lint + typecheck + test，作为开源项目的基本可信度背书 |
| 许可证 | MIT | 见 0001，服务于"吸引使用者/贡献者、丰富开源履历"的目标 |

## Monorepo 包结构

```
├── apps/
│   └── web/                 # Next.js：公开面板 + 管理后台 + API Routes
├── packages/
│   ├── core/                # 领域类型、zod 校验 schema、业务规则常量（限流阈值等）
│   │                         # 不依赖 Node 专属 API，Next.js 和 Edge Function 都能引用
│   └── widget/               # 无框架嵌入组件，独立构建产物，不依赖 apps/web
├── supabase/
│   ├── migrations/          # 数据库迁移脚本
│   └── functions/           # Edge Functions（通知服务、防刷校验）
└── docs/
    ├── decisions/           # ADR
    ├── ARCHITECTURE.md
    ├── DATA_MODEL.md
    ├── API.md
    └── ROADMAP.md
```

**边界原则**：`packages/widget` 只通过公开 API 与后端通信，不直接依赖 `apps/web` 或数据库客户端；`packages/core` 是唯一允许被 `apps/web` 和 `supabase/functions` 同时依赖的包，作为两者之间类型和校验规则一致性的唯一来源（避免前后端校验逻辑各写一份、后期漂移不一致）。

## 开源仓库与私有部署的分离

- 公开仓库只包含引擎代码（上述 monorepo 结构）+ 示例租户配置（seed 数据用假数据）
- 本人自己产品的真实 `product_id`、品牌配置、真实用户邮箱等数据，通过独立的私有 `.env` / 私有 Supabase 项目承载，不进入公开仓库的任何 commit
- 公开仓库提供 `docker-compose.yml` 或"一键部署到 Vercel + Supabase"指引，方便其他开发者自部署自己的实例

## 后果

- 相比单体应用，monorepo 多包结构初期搭建成本略高（需要配置 workspace、共享 tsconfig），但换来 widget 可独立发版、core 校验逻辑不漂移的长期收益
- 全 serverless 架构下，本地开发需要 Supabase CLI 起本地环境模拟 Postgres + Edge Functions，需要在 README 写清楚本地开发指引
