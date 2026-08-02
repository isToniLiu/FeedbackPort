/**
 * 防刷频率限制常量，见 docs/ARCHITECTURE.md 的"防刷三层"设计。
 * 由 apps/web 的 API Routes 读取，写入/读取 Redis 时使用同一份阈值，
 * 避免前后端或不同端点各写一套导致漂移。
 */
export const RATE_LIMITS = {
  /** 提交反馈：门槛更严格 */
  submitFeedback: {
    windowSeconds: 60 * 10,
    maxRequests: 3,
  },
  /** 投票：门槛更宽松，但仍需限制脚本刷票 */
  vote: {
    windowSeconds: 60,
    maxRequests: 10,
  },
} as const;
