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

The four public feedback API endpoints (submit / vote / list / detail) are wired to real Supabase reads/writes with the full three-layer anti-abuse pipeline (honeypot + Turnstile + Redis rate limiting). Not built yet: the public board / admin console page UI, email notifications (`notify-submitter` is still a stub), and admin login. See the Phase 0 checklist in [docs/ROADMAP.md](docs/ROADMAP.md) for current progress.

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

提交反馈 / 投票 / 列表 / 详情四个公开 API 端点已经接通真实的 Supabase 读写和防刷三层（蜜罐 + Turnstile + Redis 限流）。还没做的：公开面板 / 管理后台的页面 UI、邮件通知（`notify-submitter` 还是 stub）、管理后台登录态。当前进度见 [docs/ROADMAP.md](docs/ROADMAP.md) 的 Phase 0 checklist。

## License

MIT
