import { FEEDBACK_STATUSES } from "@feedbackport/core";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getProductBySlug } from "@/lib/tenant";

/**
 * GET /api/admin/feedback?product=&status= —— 跨产品统一收件箱，见
 * docs/ARCHITECTURE.md「跨产品统一收件箱」。product 留空 = 全部产品聚合，
 * 这是跟公开端点 GET /api/feedback 的关键差异（公开端点强制单租户过滤）。
 */
export async function GET(request: NextRequest) {
  const { user, response } = await requireAdmin();
  if (!user) return response;

  const { searchParams } = new URL(request.url);
  const productSlug = searchParams.get("product");
  const statusFilter = searchParams.get("status");

  if (statusFilter && !FEEDBACK_STATUSES.includes(statusFilter as (typeof FEEDBACK_STATUSES)[number])) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  let query = getSupabaseAdmin()
    .from("feedback")
    .select("id, product_id, title, body, status, submitter_email, created_at")
    .is("duplicate_of", null)
    .order("created_at", { ascending: false });

  if (productSlug) {
    const product = await getProductBySlug(productSlug);
    if (!product) {
      return NextResponse.json({ error: "unknown product" }, { status: 404 });
    }
    query = query.eq("product_id", product.id);
  }

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "failed to list feedback" }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}
