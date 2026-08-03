"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { VoteButton } from "../vote-button";

interface Reply {
  id: string;
  body: string;
  is_admin: boolean;
  created_at: string;
}

interface FeedbackDetail {
  id: string;
  title: string;
  body: string | null;
  status: string;
  submitter_email: string;
  created_at: string;
  replies: Reply[];
}

export function BoardDetail({ feedbackId, productSlug }: { feedbackId: string; productSlug: string }) {
  const [item, setItem] = useState<FeedbackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/feedback/${feedbackId}`);
    if (res.status === 404) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setItem(data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackId]);

  if (loading) return <p>Loading…</p>;
  if (notFound || !item) return <p>没找到这条反馈。</p>;

  return (
    <main>
      <p>
        <Link href="/board">← 返回列表</Link>
      </p>
      <h1>{item.title}</h1>
      <p>
        状态：{item.status} · 提交者：{item.submitter_email}
      </p>
      {item.body && <p>{item.body}</p>}
      <VoteButton productSlug={productSlug} feedbackId={item.id} />

      <h2>回复</h2>
      {item.replies.length === 0 ? (
        <p>还没有回复。</p>
      ) : (
        <ul>
          {item.replies.map((reply) => (
            <li key={reply.id}>
              {reply.is_admin && <strong>[官方回复] </strong>}
              {reply.body}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
