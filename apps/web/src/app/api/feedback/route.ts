import { submitFeedbackSchema } from "@feedbackport/core";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/feedback —— widget 提交反馈的入口，见 docs/API.md。
 *
 * 处理顺序（见 docs/ARCHITECTURE.md「提交反馈」数据流）：
 *   蜜罐检查 → Turnstile 校验 → IP 频率限制（Redis）→ zod schema 校验 → 写入 feedback 表
 *
 * 当前只搭好了 schema 校验这一步的骨架，蜜罐/Turnstile/限流/数据库写入都是 TODO，
 * 对应 docs/ROADMAP.md Phase 0 的剩余 checklist 项。
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = submitFeedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // TODO: 蜜罐检查（parsed.data.honeypot 非空则静默丢弃）
  // TODO: Turnstile 校验 parsed.data.turnstileToken
  // TODO: Redis 频率限制（按 IP hash，阈值见 @feedbackport/core 的 RATE_LIMITS.submitFeedback）
  // TODO: 按 parsed.data.productSlug 解析 product_id，写入 Supabase feedback 表

  return NextResponse.json(
    { error: "not implemented yet, see docs/ROADMAP.md Phase 0" },
    { status: 501 },
  );
}
