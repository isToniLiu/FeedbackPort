# FeedbackPort

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
