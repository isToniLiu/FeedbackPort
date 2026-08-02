import { z } from "zod";
import { FEEDBACK_STATUSES } from "./types.js";

/** 小写字母、数字、连字符，对应 products.slug 的约束 */
export const slugSchema = z
  .string()
  .min(1)
  .max(63)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)+$|^[a-z0-9]+$/, "slug 只能包含小写字母、数字和连字符");

const emailSchema = z.string().email().max(320);

/** widget 提交反馈：POST /api/feedback，跨域调用，必须显式带 productSlug（见 docs/API.md） */
export const submitFeedbackSchema = z.object({
  productSlug: slugSchema,
  title: z.string().min(1).max(120),
  body: z.string().max(2000).optional(),
  submitterEmail: emailSchema,
  turnstileToken: z.string().min(1),
  honeypot: z.string().optional(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;

/** board 投票：同源，租户已由 x-tenant 确定 */
export const voteFromBoardSchema = z.object({
  voterEmail: emailSchema,
  turnstileToken: z.string().min(1),
});

/** widget 投票：跨域，需显式带 productSlug */
export const voteFromWidgetSchema = voteFromBoardSchema.extend({
  productSlug: slugSchema,
});

export type VoteInput = z.infer<typeof voteFromWidgetSchema>;

/** 管理端改状态 / 指派判重目标，至少要提供一个字段 */
export const adminUpdateFeedbackSchema = z
  .object({
    status: z.enum(FEEDBACK_STATUSES).optional(),
    duplicateOf: z.string().uuid().optional(),
  })
  .refine((v) => v.status !== undefined || v.duplicateOf !== undefined, {
    message: "status 和 duplicateOf 至少需要提供一个",
  });

export type AdminUpdateFeedbackInput = z.infer<typeof adminUpdateFeedbackSchema>;

/** 管理端写回复 */
export const adminReplySchema = z.object({
  body: z.string().min(1).max(4000),
});

export type AdminReplyInput = z.infer<typeof adminReplySchema>;

/** 新增产品（管理后台"新增产品"表单，见 docs/ROADMAP.md Phase 0） */
export const createProductSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(80),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "brandColor 需为 #rrggbb 格式")
    .optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
