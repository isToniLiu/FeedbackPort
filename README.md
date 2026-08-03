# FeedbackPort

A user feedback management system for **indie developers**: one person, many products, one unified inbox.

Unlike Canny / Fider / Astuto / Quackback — which are built around "one organization serving many customers" — FeedbackPort assumes a different scenario: "one developer with several unrelated products who needs a single place to see and manage everything." Key features:

- **Unified inbox across products**: the admin console aggregates feedback from every product by default, no logging in/switching per product
- **Zero standing servers**: fully serverless (Supabase + Vercel + Resend + Cloudflare Turnstile), free tiers cover early-stage volume
- **Independent public board per product**: subdomain-based, each with its own branding — users vote, track progress, and get emailed when a maintainer replies
- **Framework-agnostic embed widget**: a single `<script>` tag works on any product page regardless of tech stack
- MIT licensed — self-host it, fork it, send PRs

Tech choices and the decision process live in [docs/decisions](docs/decisions); why not just use Canny/Fider/Astuto/Quackback is covered in [0001](docs/decisions/0001-self-build-vs-saas-vs-oss.md).

## Docs index

| Doc | Contents |
|---|---|
| [docs/decisions/0001](docs/decisions/0001-self-build-vs-saas-vs-oss.md) | Self-build vs SaaS vs open-source comparison and decision |
| [docs/decisions/0002](docs/decisions/0002-tech-stack.md) | Tech stack and monorepo package layout |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Module boundaries, multi-tenant routing, event-driven notifications, security boundaries |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | ER diagram, table DDL, RLS policies |
| [docs/API.md](docs/API.md) | Public endpoints, admin endpoints, widget init params, notification event contract |
| [docs/INTEGRATION.md](docs/INTEGRATION.md) | Playbook for wiring FeedbackPort into a specific product (framework snippets + troubleshooting + an AI-assistant prompt template) |
| [docs/ROADMAP.md](docs/ROADMAP.md) | MVP scope, open-source release prep, later phases |

## Project structure

```
├── apps/web/            # Next.js: public board + admin console + API Routes
├── packages/core/        # shared types, zod validation schemas, business-rule constants
├── packages/widget/      # framework-agnostic embed widget
├── supabase/
│   ├── migrations/       # database migrations
│   └── functions/        # Edge Functions (notifications, etc.)
└── docs/
```

## Local development

```bash
pnpm install
pnpm -r typecheck
pnpm -r lint
pnpm -r test
pnpm dev   # start apps/web
```

## Current status

All of Phase 0's code-only work is done: the public API (submit/vote/list/detail), the admin console (magic-link login, cross-product unified inbox, status changes, replies, new-product form), the public board (`/board`, `/board/[id]`), the three-layer anti-abuse pipeline with real Cloudflare Turnstile (both the widget and the board), and event-driven email notifications via Resend. What's left is either one-time manual setup per deployment (the Supabase Database Webhook, a few secrets — see the deployment note in [docs/API.md](docs/API.md)) or needs real accounts/a live deployment to validate (at least 2 real products integrated). See the Phase 0 checklist in [docs/ROADMAP.md](docs/ROADMAP.md) for the full picture.

## License

MIT

---

# FeedbackPort（中文）

面向**独立开发者**的用户反馈管理系统：一个人、多个产品、一个统一收件箱。

不同于 Canny / Fider / Astuto / Quackback 这类"一个组织服务多个客户"的反馈平台，FeedbackPort 假设的场景是"一个开发者名下有好几个不相关的产品，需要一个地方统一看、统一管"。核心特点：

- **跨产品统一收件箱**：管理后台默认聚合所有产品的反馈，无需逐个登录/切换
- **零常驻服务器**：纯 serverless（Supabase + Vercel + Resend + Cloudflare Turnstile），免费额度下可支撑早期体量
- **每产品独立公开面板**：按子域名区分，各自品牌，用户投票、看进度、被回复后收邮件通知
- **无框架嵌入组件**：一个 `<script>` 标签即可接入任意技术栈的产品页面
- MIT 协议，欢迎自部署、fork、提 PR

技术选型和决策过程见 [docs/decisions](docs/decisions)，为什么不直接用现成的 Canny/Fider/Astuto/Quackback 见 [0001](docs/decisions/0001-self-build-vs-saas-vs-oss.md)。

## 文档索引

| 文档 | 内容 |
|---|---|
| [docs/decisions/0001](docs/decisions/0001-self-build-vs-saas-vs-oss.md) | 自建 vs SaaS vs 开源方案对比与决策 |
| [docs/decisions/0002](docs/decisions/0002-tech-stack.md) | 技术选型与 monorepo 包结构 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 模块边界、多租户路由、事件驱动通知设计、安全边界 |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | ER 图、表结构 DDL、RLS 策略 |
| [docs/API.md](docs/API.md) | 公开端点、管理端点、Widget 接入参数、通知事件契约 |
| [docs/INTEGRATION.md](docs/INTEGRATION.md) | 把 FeedbackPort 接进具体产品的操作手册（各框架代码片段 + 排查清单 + AI 辅助接入提示词） |
| [docs/ROADMAP.md](docs/ROADMAP.md) | MVP 范围、开源发布准备、后续阶段规划 |

## 项目结构

```
├── apps/web/           # Next.js：公开面板 + 管理后台 + API Routes
├── packages/core/       # 共享类型、zod 校验 schema、业务规则常量
├── packages/widget/     # 无框架嵌入组件
├── supabase/
│   ├── migrations/      # 数据库迁移
│   └── functions/       # 通知服务等 Edge Functions
└── docs/
```

## 本地开发

```bash
pnpm install
pnpm -r typecheck
pnpm -r lint
pnpm -r test
pnpm dev   # 启动 apps/web
```

## 当前状态

Phase 0 里纯代码能搞定的部分都做完了：公开 API（提交/投票/列表/详情）、管理后台（magic link 登录、跨产品统一收件箱、改状态、写回复、新增产品表单）、公开面板（`/board`、`/board/[id]`）、防刷三层含真实 Cloudflare Turnstile（widget 和 board 都接了）、事件驱动邮件通知（真的调 Resend 发信）。剩下的要么是每个部署实例都要手动配一次的一次性设置（Supabase Database Webhook、几个 secret，见 [docs/API.md](docs/API.md) 里的部署说明），要么需要真实账号/实际部署才能验证（至少接入 2 个真实产品）。完整进度见 [docs/ROADMAP.md](docs/ROADMAP.md) 的 Phase 0 checklist。

## License

MIT
