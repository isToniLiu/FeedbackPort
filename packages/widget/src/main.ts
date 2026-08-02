import { readConfig } from "./config.js";
import { submitFeedback } from "./api.js";
import { mountWidget } from "./ui.js";

// TODO(见 docs/ROADMAP.md Phase 0)：接入 Cloudflare Turnstile 官方脚本获取真实 token，
// 当前占位实现让骨架可以跑通端到端流程，上线前必须替换。
function getTurnstileToken(): Promise<string> {
  return Promise.resolve("__TODO_TURNSTILE_TOKEN__");
}

function bootstrap(): void {
  const config = readConfig(document.currentScript);

  mountWidget(config, async (formPayload) => {
    const turnstileToken = await getTurnstileToken();
    await submitFeedback(config.apiBase, {
      productSlug: config.productSlug,
      title: formPayload.title,
      body: formPayload.body || undefined,
      submitterEmail: formPayload.submitterEmail,
      turnstileToken,
    });
  });
}

bootstrap();
