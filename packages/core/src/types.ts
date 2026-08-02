/**
 * 领域类型定义。
 *
 * 本文件不依赖任何 Node.js 专属 API，因为它同时被 apps/web（Next.js）
 * 和 supabase/functions（Deno Edge Function）引用，见 docs/decisions/0002-tech-stack.md。
 */

export const FEEDBACK_STATUSES = [
  "open",
  "planned",
  "in_progress",
  "done",
  "declined",
] as const;

export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export interface Product {
  id: string;
  slug: string;
  name: string;
  brandColor: string | null;
  createdAt: string;
}

export interface Feedback {
  id: string;
  productId: string;
  title: string;
  body: string | null;
  status: FeedbackStatus;
  submitterEmail: string;
  duplicateOf: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vote {
  id: string;
  feedbackId: string;
  voterEmail: string;
  createdAt: string;
}

export interface Reply {
  id: string;
  feedbackId: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
}
