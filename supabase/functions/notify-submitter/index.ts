// Deno Edge Function，由 Supabase DB Webhook 触发，不被业务代码直接调用。
// 契约见 docs/API.md「事件驱动通知契约」；解耦设计动机见 docs/ARCHITECTURE.md「关键解耦点」。
//
// 触发条件：
//   - replies 表 insert 且 is_admin = true -> 通知该反馈的提交者「有新回复」
//   - feedback 表 update 且 status 变更   -> 通知提交者 + 所有投票者「状态变更」

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: "replies" | "feedback";
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
}

Deno.serve(async (req: Request) => {
  const payload = (await req.json()) as WebhookPayload;

  // TODO（见 docs/ROADMAP.md Phase 0）：
  //   1. table === "replies" && record.is_admin === true
  //        -> 用 record.feedback_id 查 feedback.submitter_email，发「新回复」邮件
  //   2. table === "feedback" && record.status !== old_record?.status
  //        -> 查 submitter_email + votes 里的 voter_email（去重后的邮箱集合），发「状态变更」邮件
  //   3. 两种情况都调用 Resend API（RESEND_API_KEY 走 Edge Function 的环境变量）
  console.log("notify-submitter received", payload.table, payload.type);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
