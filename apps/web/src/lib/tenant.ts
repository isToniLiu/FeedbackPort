import type { Product } from "@feedbackport/core";
import { getSupabaseAdmin } from "./supabase-admin";

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand_color: string | null;
  created_at: string;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brandColor: row.brand_color,
    createdAt: row.created_at,
  };
}

/**
 * 按 slug 查 product_id。当前每次请求都查库，没有做 docs/ARCHITECTURE.md 里提到的缓存——
 * 先保证正确性，缓存留到有真实流量数据支撑要不要做的时候再加（TODO，见 docs/ROADMAP.md）。
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select("id, slug, name, brand_color, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return toProduct(data as ProductRow);
}
