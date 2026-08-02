# 迭代路线图

## Phase 0：MVP（自用可跑通）

- [x] `products` / `feedback` / `votes` / `replies` 表 + RLS 策略（见 DATA_MODEL.md）
- [ ] 管理后台"新增产品"表单（slug/name/brand_color），没有这一步接入指南无从谈起
- [x] 无框架嵌入组件（vanilla TS，Shadow DOM，蜜罐字段）
- [x] 公开端点：提交反馈 / 投票 / 列表 / 详情（`apps/web/src/app/api/feedback/**`），API 层已接 Supabase 真实读写
- [ ] 公开面板 UI：按子域名解析租户后渲染列表/投票/详情/回复的页面（API 已就绪，页面还没写）
- [ ] 管理后台：跨产品统一收件箱、单产品筛选、改状态、写回复（见 ARCHITECTURE.md 跨产品收件箱设计），含登录态
- [x] 防刷三层：蜜罐 + Turnstile + Redis 频率限制（`apps/web/src/lib/{turnstile,rate-limit,request-ip}.ts`，已接进提交反馈/投票两个端点）
- [ ] 事件驱动邮件通知（DB Webhook → Edge Function → Resend），`notify-submitter` 目前只是 log 一行的 stub
- [ ] 至少 2 个自己的产品接入验证（需要真实 Supabase/Turnstile/Upstash/Resend 项目 + 部署）

**验收标准**：自己的产品能实际收到反馈、投票不重复、状态变更用户能收到邮件、跨产品收件箱能一眼看完所有产品的新反馈。

## Phase 1：开源发布准备

- [ ] README（含架构图、Demo 截图/GIF）
- [ ] 部署指引：Vercel + Supabase 一键部署 / `docker-compose` 备选
- [ ] GitHub Actions CI（lint + typecheck + test）
- [ ] 示例租户 seed 数据（脱敏，不含真实产品信息）
- [ ] MIT LICENSE 文件
- [ ] 公开 Demo 部署（只读或定期重置数据）

**验收标准**：陌生人 clone 仓库后，跟着 README 能在 15 分钟内跑起一个本地实例。

## Phase 2：功能增强

- [ ] 附件/截图上传（Supabase Storage），主要服务 bug 报告场景
- [ ] Changelog 页面：`status` 变为 `done` 的反馈自动汇总展示

## Phase 3：AI 辅助分诊（差异化亮点）

- [ ] 启用 `embedding` 字段，接入 embedding API（如 `text-embedding-3-small`），提交时做相似度粗筛，提示可能的重复项供人工确认合并（`duplicate_of`）
- [ ] 自动打标签：bug / 功能请求 / 疑问，辅助管理后台筛选
- [ ] 每周摘要邮件：按产品汇总本周新增反馈数、热门投票项、待处理数量，发给开发者本人

## Phase 4：可选的深度集成（低优先级）

- [ ] 面向想要更强身份体系的产品，提供可选的真实 SSO/OIDC 接入（替代默认的邮箱预填方案）
- [ ] Webhook/开放 API，对接 Slack、Linear 等第三方工具（Fider/Astuto/Quackback 已有的能力，非本项目差异化重点，视社区需求决定是否投入）

## 明确不做的事

- 不做付费/席位计费体系——这是商业 SaaS 的形态，与本项目"独立开发者自用+开源"的定位冲突
- 不追求对齐 Canny/Fider 的全部企业功能（如复杂权限分级、SLA），保持"轻量、够用、易自部署"的定位
