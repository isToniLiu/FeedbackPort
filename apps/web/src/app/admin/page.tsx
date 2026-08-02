"use client";

import { FEEDBACK_STATUSES } from "@feedbackport/core";
import Link from "next/link";
import { useEffect, useState } from "react";

interface FeedbackItem {
  id: string;
  title: string;
  body: string | null;
  status: string;
  submitter_email: string;
  created_at: string;
}

/**
 * 跨产品统一收件箱，见 docs/ARCHITECTURE.md「跨产品统一收件箱」。
 * productFilter 留空 = 默认视图，聚合所有产品的反馈。
 */
export default function AdminInboxPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (productFilter) params.set("product", productFilter);
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/admin/feedback?${params.toString()}`);
    const data = await res.json();
    setItems(res.ok ? (data.items ?? []) : []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productFilter, statusFilter]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    void load();
  }

  async function submitReply(id: string, body: string) {
    if (!body.trim()) return;
    await fetch(`/api/admin/feedback/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    void load();
  }

  return (
    <main>
      <h1>跨产品收件箱</h1>
      <p>
        <Link href="/admin/products/new">+ 新增产品</Link>
      </p>

      <div>
        <input
          placeholder="按 product slug 筛选（留空 = 全部产品）"
          value={productFilter}
          onChange={(event) => setProductFilter(event.target.value)}
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">全部状态</option>
          {FEEDBACK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p>没有匹配的反馈。</p>
      ) : (
        <ul>
          {items.map((item) => (
            <FeedbackRow key={item.id} item={item} onStatusChange={updateStatus} onReply={submitReply} />
          ))}
        </ul>
      )}
    </main>
  );
}

function FeedbackRow({
  item,
  onStatusChange,
  onReply,
}: {
  item: FeedbackItem;
  onStatusChange: (id: string, status: string) => void;
  onReply: (id: string, body: string) => void;
}) {
  const [replyBody, setReplyBody] = useState("");

  return (
    <li>
      <strong>{item.title}</strong> — {item.submitter_email}
      {item.body && <p>{item.body}</p>}
      <select value={item.status} onChange={(event) => onStatusChange(item.id, event.target.value)}>
        {FEEDBACK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <div>
        <textarea
          value={replyBody}
          onChange={(event) => setReplyBody(event.target.value)}
          placeholder="写回复…"
        />
        <button
          type="button"
          onClick={() => {
            onReply(item.id, replyBody);
            setReplyBody("");
          }}
        >
          回复
        </button>
      </div>
    </li>
  );
}
