import { createProductSchema } from "@feedbackport/core";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/** POST /api/admin/products —— 新增产品，见 docs/INTEGRATION.md「前提：先注册产品」 */
export async function POST(request: NextRequest) {
  const { user, response } = await requireAdmin();
  if (!user) return response;

  const body = await request.json().catch(() => null);
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .insert({
      slug: parsed.data.slug,
      name: parsed.data.name,
      brand_color: parsed.data.brandColor ?? null,
    })
    .select("id, slug, name, brand_color, created_at")
    .single();

  if (error) {
    // 23505 = unique_violation，slug 已存在
    if (error.code === "23505") {
      return NextResponse.json({ error: "slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "failed to create product" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
