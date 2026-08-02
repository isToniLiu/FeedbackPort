import { adminUpdateFeedbackSchema } from "@feedbackport/core";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * PATCH /api/admin/feedback/:id —— 改状态或指派判重目标。
 * 写入成功后不主动发通知，由 DB Webhook 异步触发 notify-submitter，见 docs/ARCHITECTURE.md。
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAdmin();
  if (!user) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = adminUpdateFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const update: { status?: string; duplicate_of?: string } = {};
  if (parsed.data.status) update.status = parsed.data.status;
  if (parsed.data.duplicateOf) update.duplicate_of = parsed.data.duplicateOf;

  const { data, error } = await getSupabaseAdmin()
    .from("feedback")
    .update(update)
    .eq("id", id)
    .select("id, status, duplicate_of")
    .single();

  if (error) {
    return NextResponse.json({ error: "failed to update feedback" }, { status: 500 });
  }

  return NextResponse.json(data);
}
