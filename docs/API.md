# API Design

## Two kinds of callers, two ways to identify the tenant

Public endpoints have two kinds of callers, and they resolve the tenant (`product_id`) differently — you can't use the same logic for both:

- **board (public page)**: runs on FeedbackPort's own subdomain (`<slug>.board.domain.com`), a same-origin request; middleware resolves the tenant from the subdomain and injects `x-tenant`, which the client cannot forge or override
- **widget (embed component)**: runs on **the host product's own domain** (e.g. `cardwhisper.com`), a cross-origin request — the browser sends the host page's origin, and the server has no FeedbackPort subdomain to work with. So widget requests must explicitly include `productSlug` in the body, and the server resolves the tenant from that. The corresponding endpoints need CORS enabled (`Access-Control-Allow-Origin: *`, since submitting feedback/voting are public, low-risk operations that carry no credentials worth protecting)

Admin endpoints aren't affected by this — they go through a login (Supabase Auth, this developer's account only) and don't need tenant resolution (they default to cross-product).

All public endpoints uniformly also require a Turnstile token.

## Public endpoints

### `POST /api/feedback` — submit feedback (called by the widget, cross-origin)

Request body:

```ts
{
  productSlug: string;    // required, identifies the tenant since host can't be relied on
  title: string;          // required, <= 120 chars
  body?: string;          // optional, <= 2000 chars
  submitterEmail: string; // required, must be a valid email
  turnstileToken: string; // required
  honeypot?: string;      // honeypot field — non-empty means silently drop the request
}
```

Processing order: zod schema validation (`packages/core` — fields have to be parsed out before there's a honeypot value to check) → honeypot check → Turnstile verification → IP rate limiting (Redis) → resolve the tenant by `productSlug` → insert into `feedback`.

Response: `201 { id, status: 'open' }`

### `GET /api/feedback?status=&sort=` — feedback list (called by the board, same-origin, tenant resolved from `x-tenant`)

- `status`: optional filter
- `sort`: `votes` | `newest`, defaults to `votes`
- Returns a paginated list; each item includes a vote count (aggregate query) and the latest reply's summary

### `POST /api/feedback/:id/vote` — vote

Request body: `{ productSlug: string; voterEmail: string; turnstileToken: string }`

- Doesn't distinguish between board/widget callers — both are uniformly required to send `productSlug`, which is used to double-check before the write that this `feedback_id` really does belong to that tenant, preventing cross-tenant votes via a guessed id. That's more conservative than "trust `x-tenant` because it's a same-origin request," at the cost of the board also having to include this one extra field — worth it for the simplicity of a single schema/single code path
- A unique-constraint conflict (already voted) returns `200 { alreadyVoted: true }` rather than being treated as an error
- The rate-limit bar is looser than for submitting feedback, but it still goes through Turnstile

### `GET /api/feedback/:id` — feedback detail

Returns the feedback content plus its associated `replies` list (with an official-reply flag)

## Admin endpoints (require login)

### `PATCH /api/admin/feedback/:id`

Request body: `{ status?: string; duplicateOf?: string }`

- Changes `status`, or assigns a dedup target via `duplicateOf`
- After a successful write, no notification logic is called directly (it's triggered asynchronously by a DB webhook, see ARCHITECTURE.md)

### `POST /api/admin/feedback/:id/reply`

Request body: `{ body: string }`

- Inserts into `replies` with `is_admin = true`
- Also doesn't call notification logic directly

### `GET /api/admin/feedback?product=&status=`

- The cross-product unified-inbox query — leaving `product` empty returns the aggregate across all products. This is the key difference from the public endpoints (which enforce single-tenant filtering, while the admin endpoint defaults to no filtering)

## Widget init parameters

How a host page embeds it:

```html
<script
  src="https://cdn.domain.com/widget.js"
  data-product="cardwhisper"
  data-turnstile-site-key="1x00000000000000000000AA"
  data-user-email="user@example.com"
  async
></script>
```

- `data-product`: required, corresponds to `products.slug`
- `data-turnstile-site-key`: required, your Cloudflare Turnstile site key. For local development, Cloudflare publishes a well-known test key that always passes — `1x00000000000000000000AA` — so you don't need a real Cloudflare account to try the widget end to end
- `data-user-email`: optional — the host product's logged-in user's email, pre-fills the submission form so the user doesn't have to type it again (this is a lightweight substitute for a real SSO integration; the host page decides whether to pass it, and the widget performs no identity verification on it)

## Event-driven notification contract

Not a REST endpoint — a Supabase DB webhook configuration:

| Trigger | Target Edge Function | Behavior |
|---|---|---|
| Insert into `replies` with `is_admin = true` | `notify-submitter` | Looks up that item's `feedback.submitter_email` and sends a "your feedback got a new reply" email |
| Update to `feedback` where `status` changes | `notify-submitter` | Sends a "feedback status changed to XXX" email to the submitter and every voter (deduplicated email set) |

The Edge Function's input is the standard Supabase webhook payload (`{ type, table, record, old_record }`) — no extra request schema needs to be designed.

**One-time setup this repo can't automate**: the webhook itself has to be created by hand in Supabase Studio (Database → Webhooks → New webhook → table `replies` → event `Insert` → target `notify-submitter`, then repeat for table `feedback` → event `Update`). It can't ship as a migration because the Edge Function's URL is project-specific — every self-hosted instance has a different one. The function also needs two secrets set (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by Supabase; only `RESEND_API_KEY` and, optionally, `NOTIFY_FROM_EMAIL` need to be set by hand):

```bash
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set NOTIFY_FROM_EMAIL=notifications@your-domain.com
```

Without `RESEND_API_KEY`, the function no-ops (logs a warning and skips sending) instead of erroring, so the rest of the system keeps working if you haven't wired up email yet.

---

# API 设计（中文）

## 两种调用方与租户识别方式

公开端点有两类调用方，租户（`product_id`）的识别方式不同，不能混用同一套逻辑：

- **board（公开面板）**：跑在 FeedbackPort 自己的子域名下（`<slug>.board.域名.com`），同源请求，租户由中间件从子域名解析后注入 `x-tenant`，客户端不可伪造覆盖
- **widget（嵌入组件）**：跑在**宿主产品自己的域名**上（比如 `cardwhisper.com`），是跨域请求，浏览器带的是宿主页面的 origin，服务端拿不到 FeedbackPort 子域名可用。因此 widget 请求必须显式在请求体带 `productSlug`，服务端据此解析租户；对应端点需要开放 CORS（`Access-Control-Allow-Origin: *`，因为提交反馈/投票是公开、低风险操作，不携带任何需要保密的凭证）

管理端点不受此影响，走登录态（Supabase Auth，仅开发者本人账号），不需要租户识别（默认跨产品）。

所有公开端点统一还需要 Turnstile token。

## 公开端点

### `POST /api/feedback` 提交反馈（widget 调用，跨域）

请求体：

```ts
{
  productSlug: string;    // 必填，标识租户，因为无法依赖 host
  title: string;          // 必填，<= 120 字符
  body?: string;          // 选填，<= 2000 字符
  submitterEmail: string; // 必填，邮箱格式
  turnstileToken: string; // 必填
  honeypot?: string;      // 蜜罐字段，非空则静默丢弃请求
}
```

处理顺序：zod schema 校验（`packages/core`，要先解出各字段才有蜜罐值可查）→ 蜜罐检查 → Turnstile 校验 → IP 频率限制（Redis）→ 按 `productSlug` 解析租户 → 写入 `feedback` 表。

响应：`201 { id, status: 'open' }`

### `GET /api/feedback?status=&sort=` 反馈列表（board 调用，同源，按 `x-tenant` 解析的租户）

- `status`：可选过滤
- `sort`：`votes` | `newest`，默认 `votes`
- 返回分页列表，每项含投票数（聚合查询）、最新一条回复摘要

### `POST /api/feedback/:id/vote` 投票

请求体：`{ productSlug: string; voterEmail: string; turnstileToken: string }`

- 不区分 board/widget 调用方，统一要求 `productSlug`——写入前用它二次核对该 `feedback_id` 确实属于这个租户，防止跨租户猜测 id 投票，比"同源请求就信任 x-tenant"更保守，代价是board 发起时也要多带这一个字段，用一套 schema/一条代码路径换来的简单性划算
- 唯一约束冲突（已投过票）时返回 `200 { alreadyVoted: true }`，不当作错误处理
- 频率限制门槛比提交反馈更宽松，但同样过 Turnstile

### `GET /api/feedback/:id` 反馈详情

返回反馈内容 + 关联 `replies` 列表（含官方回复标记）

## 管理端点（需登录）

### `PATCH /api/admin/feedback/:id`

请求体：`{ status?: string; duplicateOf?: string }`

- 改 `status` 或指派判重目标 `duplicateOf`
- 写入成功后不主动调用通知逻辑（由 DB Webhook 异步触发，见 ARCHITECTURE.md）

### `POST /api/admin/feedback/:id/reply`

请求体：`{ body: string }`

- 插入 `replies`，`is_admin = true`
- 同样不主动调用通知逻辑

### `GET /api/admin/feedback?product=&status=`

- 跨产品统一收件箱查询，`product` 留空即返回全部产品聚合结果，这是与公开端点的关键差异（公开端点强制单租户过滤，管理端点默认不过滤）

## Widget 初始化参数

宿主页面嵌入方式：

```html
<script
  src="https://cdn.域名.com/widget.js"
  data-product="cardwhisper"
  data-turnstile-site-key="1x00000000000000000000AA"
  data-user-email="user@example.com"
  async
></script>
```

- `data-product`：必填，对应 `products.slug`
- `data-turnstile-site-key`：必填，你的 Cloudflare Turnstile site key。本地开发不需要真实 Cloudflare 账号——Cloudflare 官方发布了一个永远通过验证的测试 key：`1x00000000000000000000AA`，用这个就能把 widget 端到端跑通
- `data-user-email`：选填，宿主产品已登录用户的邮箱，预填提交表单，免去用户重复输入（这是替代真正 SSO 集成的轻量方案，宿主页面自行决定是否传递，widget 不做身份校验）

## 事件驱动通知契约

不是 REST 端点，而是 Supabase DB Webhook 配置：

| 触发条件 | 目标 Edge Function | 行为 |
|---|---|---|
| `replies` 表 insert 且 `is_admin = true` | `notify-submitter` | 查出该 `feedback.submitter_email`，发送"你的反馈有新回复"邮件 |
| `feedback` 表 update 且 `status` 变更 | `notify-submitter` | 发送"反馈状态变更为 XXX"邮件给提交者和所有投票者（去重后的邮箱集合） |

Edge Function 输入是 Supabase Webhook 的标准 payload（`{ type, table, record, old_record }`），不需要额外设计请求 schema。

**这个仓库自动化不了的一次性配置**：Webhook 本身要在 Supabase Studio 里手动建（Database → Webhooks → New webhook → 表选 `replies` → 事件选 `Insert` → 目标选 `notify-submitter`，再对表 `feedback` → 事件 `Update` 建一次）。写不进迁移脚本，因为 Edge Function 的 URL 是项目专属的，每个自部署实例都不一样。这个 Function 还需要设两个 secret（`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY` 是 Supabase 自动注入的，只有 `RESEND_API_KEY` 和可选的 `NOTIFY_FROM_EMAIL` 需要手动设置）：

```bash
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set NOTIFY_FROM_EMAIL=notifications@你的域名.com
```

没配 `RESEND_API_KEY` 时函数不会报错，只是记一条 warning 并跳过发信——邮件通知没接好之前，系统其余部分照样能用。
