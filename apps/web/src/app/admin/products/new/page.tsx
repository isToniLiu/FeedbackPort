"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function NewProductPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [brandColor, setBrandColor] = useState("#6366f1");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name, brandColor }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(res.status === 409 ? "这个 slug 已经被用过了" : (data?.error ?? "创建失败"));
      return;
    }

    router.push("/admin");
  }

  return (
    <main>
      <h1>新增产品</h1>
      <form onSubmit={handleSubmit}>
        <input
          required
          placeholder="slug（如 cardwhisper，只能小写字母数字连字符）"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
        />
        <input required placeholder="产品名称" value={name} onChange={(event) => setName(event.target.value)} />
        <input type="color" value={brandColor} onChange={(event) => setBrandColor(event.target.value)} />
        <button type="submit" disabled={submitting}>
          创建
        </button>
      </form>
      {error && <p>{error}</p>}
    </main>
  );
}
