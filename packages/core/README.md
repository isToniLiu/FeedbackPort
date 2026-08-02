# @feedbackport/core

共享领域类型、zod 校验 schema、业务规则常量。被 `apps/web` 和 `supabase/functions` 同时引用，是两者之间保持校验逻辑一致的唯一来源（见 [docs/decisions/0002-tech-stack.md](../../docs/decisions/0002-tech-stack.md)）。

**约束**：本包代码不能使用 Node.js 专属 API（如 `fs`、`path`、`Buffer`），因为 Supabase Edge Function 跑在 Deno 上，会以相对路径直接引用本包源码，而不是先打包再消费。
