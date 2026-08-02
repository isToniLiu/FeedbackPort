# ADR 0001: Self-Build vs SaaS vs Open Source

- Status: Accepted
- Date: 2026-08-02

## Context

A solo indie developer needs to manage user feedback across several products (web/apps) in one place. Core constraints:

- Every product is early-stage, so feedback volume is inherently small
- The decision-maker has engineering skills — where time cost is cheaper than money cost, self-building should win
- The system needs to support: a public voting board, per-product independent entry points (subdomains), two-way email communication, basic anti-abuse, and unified multi-product management

## Options compared

### Commercial SaaS (Canny / Featurebase)

| Option | Money cost | Ops cost | Fits when |
|---|---|---|---|
| Featurebase Free | $0/mo, 1 seat | Zero setup, but crippled (help-center rate limits, no custom domain) | Want to use it right now, don't want to write code |
| Canny | Billed by "tracked users," starts at $19/mo past 25 users, can hit $250+/mo at 1000+ users | Near-zero maintenance | Already have a stable paying user base, need a polished feel |
| Featurebase Paid | Seat-based, starts at $29 | Near-zero maintenance | Same as above |

**Reason for rejection**: SaaS pricing by "tracked users" or "seats" is poor value when feedback volume is inherently small at an early stage — you're effectively prepaying for growth that hasn't happened. It also requires separate payment/configuration per product, so cost scales linearly across multiple products.

### Open-source, self-hosted (Fider / Astuto / Quackback)

| Project | Stars | Stack | License | Multi-tenant/subdomain | Notes |
|---|---|---|---|---|---|
| [Fider](https://github.com/getfider/fider) | 4.4k | Go + React/TS, PostgreSQL | AGPL-3.0 (verified against the source LICENSE file — not MIT, as some articles mistakenly claim) | Native support, per-tenant subdomain + branding | Most production deployments, most mature, single Go binary |
| [Astuto](https://github.com/astuto/astuto) | Moderate | Ruby on Rails + React | GPL-3.0 | Undocumented | Explicitly positioned as a Canny clone; Rails stack adds a learning-curve cost |
| [Quackback](https://github.com/QuackbackIO/quackback) | 207 | TanStack Start + Drizzle + Postgres + Redis + Bun | AGPL-3.0 | Undocumented | Newest, most modern stack, has AI dedup and an MCP server, but maturity is unproven |

**Reason for rejection**:

1. **Ops burden**: all three require a standing server running Docker + Postgres (Quackback also needs Redis) — not fully serverless, which creates ongoing ops responsibility and roughly $5-6/mo in VPS cost, conflicting with the "zero maintenance" goal.
2. **License constraints**: Fider/Astuto/Quackback are all AGPL-3.0/GPL-3.0. If forked and customized (rebranded per product, extra fields) and served to end users over a network, AGPL §13 requires publishing the modified source. That conflicts with this project's own goal of being open source itself while retaining freedom to customize deployment configuration.
3. **Scenario mismatch**: their multi-tenancy is designed for "one organization serving many customers" (a SaaS vendor's perspective), not "one indie developer managing several unrelated products of their own" (a unified-inbox perspective). The latter needs a cross-product aggregate view, which none of the existing projects cover.

### Self-build (final choice)

**Conclusion: self-build a lightweight, fully serverless feedback-management engine.**

Reasoning chain: early-stage product → inherently low feedback volume → SaaS pricing by user count/seats is poor value → the developer can code → the one-time cost of self-building is far lower than either prepaying for growth long-term or operating a server.

**Borrow ideas from the open-source projects rather than adopting them wholesale**:

- Borrow Fider's multi-tenant subdomain routing idea (one codebase, subdomain mapped to `product_id`)
- Borrow Quackback's AI-dedup idea (reserve an `embedding` column, not implemented at MVP, backfilled later with pgvector)
- Don't adopt their tech stacks (to avoid a standing server) or their licenses (to avoid AGPL obligations)

## Additional decision: open-sourcing this project itself

During the discussion it was decided that, beyond serving personal needs, this project would also be published as an indie developer's portfolio/open-source work. That adds requirements:

- Strict separation between the engine (the multi-tenant core) and this developer's own private product data/configuration — the former goes into the public repo, the latter lives as private deployment configuration (see [0002-tech-stack](0002-tech-stack.md) and the tenant-configuration section of ARCHITECTURE.md)
- License: MIT (rather than following Fider/Quackback into AGPL). Rationale: this project's goal is to attract users/contributors and build a portfolio piece — AGPL's network-service disclosure obligation actively discourages developers from adopting it directly, which is a net negative for that goal
- Differentiated positioning: built for an indie developer "managing many products alone," not the "one organization serving many customers" enterprise scenario — concretely expressed as a cross-product unified inbox, a framework-agnostic embed widget, and a zero-standing-server architecture (see ROADMAP.md for details)

## Consequences

- Vote deduplication, anti-abuse, email notifications, and other capabilities Fider/Astuto/Quackback already have must be built from scratch, so upfront development effort is higher than "just deploy an existing project"
- Long-term, if feedback volume or team size outgrows what the self-built system can handle, Fider is the safest migration path (most production deployments, most complete docs)
- In exchange, this project gets full freedom over its tech stack and license, and can be polished to open-source-portfolio standards (README, CI, ADRs, a demo)

---

# ADR 0001：自建 vs SaaS vs 开源方案（中文）

- 状态：已采纳
- 日期：2026-08-02

## 背景

个人独立开发者需要为手头多个产品（网页/App）统一管理用户反馈。核心约束：

- 每个产品早期用户量都小，反馈量必然小
- 决策者本人具备工程能力，时间成本低于金钱成本的场景下应优先自建
- 系统需要支持：公开投票板、按产品独立入口（子域名）、邮件双向沟通、基础防刷、多产品统一管理

## 选项对比

### 商业 SaaS（Canny / Featurebase）

| 方案 | 金钱成本 | 管理成本 | 适合阶段 |
|---|---|---|---|
| Featurebase 免费版 | $0/月，1 席位 | 零搭建，但功能阉割（帮助中心限流、无自定义域名） | 想立刻能用、不想写代码 |
| Canny | 按追踪用户数计费，超 25 人起 $19/月，1000+ 用户可能 $250+/月 | 几乎零维护 | 已有稳定付费用户、需要专业感 |
| Featurebase 付费版 | 按席位 $29 起 | 几乎零维护 | 同上 |

**否决理由**：SaaS 按"追踪用户数"或"席位"计费，产品早期反馈量小，等于为潜在增长预付费，性价比低；且需要为每个产品单独付费/配置，多产品场景下成本线性放大。

### 开源自托管（Fider / Astuto / Quackback）

| 项目 | Star | 技术栈 | 许可证 | 多租户/子域名 | 备注 |
|---|---|---|---|---|---|
| [Fider](https://github.com/getfider/fider) | 4.4k | Go + React/TS, PostgreSQL | AGPL-3.0（已核实源码 LICENSE 文件，非部分文章误传的 MIT） | 原生支持，每租户独立子域名+品牌 | 生产部署最多，最成熟，单 Go 二进制 |
| [Astuto](https://github.com/astuto/astuto) | 中等 | Ruby on Rails + React | GPL-3.0 | 文档未明确 | 明确对标 Canny，Rails 栈学习成本高 |
| [Quackback](https://github.com/QuackbackIO/quackback) | 207 | TanStack Start + Drizzle + Postgres + Redis + Bun | AGPL-3.0 | 文档未明确 | 最新、栈现代，带 AI 判重、MCP server，但成熟度存疑 |

**否决理由**：

1. **运维负担**：三者都需要常驻服务器跑 Docker + Postgres（+ Quackback 还需要 Redis），不是纯 serverless，产生持续的运维责任和约 $5-6/月的 VPS 成本，违背"零维护"目标。
2. **许可证约束**：Fider/Astuto/Quackback 均为 AGPL-3.0/GPL-3.0。若 fork 定制（按产品换品牌、加字段）并通过网络提供给终端用户使用，AGPL 第 13 条要求公开修改后的源码。这与"本项目自身也计划开源、但需要保留部署配置定制自由度"的目标冲突。
3. **场景不匹配**：三者的多租户设计针对"一个组织服务多个客户"（SaaS 视角），而不是"一个独立开发者管理自己名下多个不相关产品"（统一收件箱视角），后者需要跨产品聚合视图，现有项目均未覆盖。

### 自建（最终选择）

**结论：自建一套轻量、纯 serverless 的反馈管理引擎。**

判断依据：产品早期 → 反馈量小 → SaaS 按用户量/席位计费模式不划算 → 开发者本人有编码能力 → 自建的一次性时间成本远小于长期为增长预付费或运维一台服务器的成本。

**从开源项目中借鉴而非照搬**：

- 借鉴 Fider 的多租户子域名路由思路（一套代码，按子域名映射到 `product_id`）
- 借鉴 Quackback 的 AI 判重思路（预留 `embedding` 字段，MVP 不实现，后续用 pgvector 补上）
- 不采用它们的技术栈（避免常驻服务器）和许可证（避免 AGPL 约束）

## 附加决策：开源本项目自身

在讨论过程中确定，本项目除了满足自用需求外，也将作为独立开发者履历/开源作品对外发布，因此额外要求：

- 引擎（多租户核心）与本人自己产品的私有数据/配置严格分离，前者进公开仓库，后者作为私有部署实例配置（见 [0002-tech-stack](0002-tech-stack.md) 和 ARCHITECTURE.md 的租户配置章节）
- 许可证采用 MIT（而非跟随 Fider/Quackback 使用 AGPL），理由：本项目定位是吸引使用者/贡献者、丰富作品集，AGPL 的网络服务开源义务会实际劝退直接落地使用的开发者，对该目标是负资产
- 差异化定位：面向"一个人管理多个产品"的独立开发者，而非"一个组织服务多个客户"的企业场景，具体体现为跨产品统一收件箱、无框架嵌入组件、零常驻服务器架构（详见 ROADMAP.md）

## 后果

- 需要自行实现投票去重、防刷、邮件通知等 Fider/Astuto/Quackback 已有的能力，初期开发工作量比"直接部署现成项目"更高
- 长期看，若反馈量或团队规模增长到自建方案难以维护，Fider 是最稳的迁移退路（生产部署最多、文档最全）
- 获得完全的技术栈自由度和许可证自由度，可按开源作品集的标准打磨（README、CI、ADR、Demo）
