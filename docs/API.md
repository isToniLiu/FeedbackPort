# API 设计

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

处理顺序：蜜罐检查 → Turnstile 校验 → IP 频率限制（Redis）→ zod schema 校验（`packages/core`）→ 写入 `feedback` 表。

响应：`201 { id, status: 'open' }`

### `GET /api/feedback?status=&sort=` 反馈列表（board 调用，同源，按 `x-tenant` 解析的租户）

- `status`：可选过滤
- `sort`：`votes` | `newest`，默认 `votes`
- 返回分页列表，每项含投票数（聚合查询）、最新一条回复摘要

### `POST /api/feedback/:id/vote` 投票

- board 发起（同源）：请求体 `{ voterEmail: string; turnstileToken: string }`，租户已由 `x-tenant` 确定
- widget 发起（跨域，若在宿主页面内嵌投票入口）：请求体额外带 `productSlug`，理由同提交反馈
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
<script src="https://cdn.域名.com/widget.js" data-product="cardwhisper" data-user-email="user@example.com" async></script>
```

- `data-product`：必填，对应 `products.slug`
- `data-user-email`：选填，宿主产品已登录用户的邮箱，预填提交表单，免去用户重复输入（这是替代真正 SSO 集成的轻量方案，宿主页面自行决定是否传递，widget 不做身份校验）

## 事件驱动通知契约

不是 REST 端点，而是 Supabase DB Webhook 配置：

| 触发条件 | 目标 Edge Function | 行为 |
|---|---|---|
| `replies` 表 insert 且 `is_admin = true` | `notify-submitter` | 查出该 `feedback.submitter_email`，发送"你的反馈有新回复"邮件 |
| `feedback` 表 update 且 `status` 变更 | `notify-submitter` | 发送"反馈状态变更为 XXX"邮件给提交者和所有投票者（去重后的邮箱集合） |

Edge Function 输入是 Supabase Webhook 的标准 payload（`{ type, table, record, old_record }`），不需要额外设计请求 schema。
