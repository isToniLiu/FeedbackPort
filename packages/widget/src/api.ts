import type { SubmitFeedbackInput } from "@feedbackport/core";

export interface SubmitFeedbackResult {
  id: string;
  status: string;
}

/**
 * 调用 POST /api/feedback（跨域请求，见 docs/API.md）。
 * Turnstile token 的获取由 ui.ts 在渲染表单时通过 Turnstile 官方脚本完成，
 * 这里只负责把已经拿到的 token 一起发出去。
 */
export async function submitFeedback(
  apiBase: string,
  payload: SubmitFeedbackInput,
): Promise<SubmitFeedbackResult> {
  const response = await fetch(`${apiBase}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`提交反馈失败：HTTP ${response.status}`);
  }

  return (await response.json()) as SubmitFeedbackResult;
}
