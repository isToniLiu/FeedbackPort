import { readConfig } from "./config";
import { submitFeedback } from "./api";
import { getTurnstileToken } from "./turnstile";
import { mountWidget } from "./ui";

function bootstrap(): void {
  const config = readConfig(document.currentScript);

  const { turnstileContainer } = mountWidget(config, async (formPayload) => {
    const turnstileToken = await getTurnstileToken(turnstileContainer, config.turnstileSiteKey);
    await submitFeedback(config.apiBase, {
      productSlug: config.productSlug,
      title: formPayload.title,
      body: formPayload.body || undefined,
      submitterEmail: formPayload.submitterEmail,
      turnstileToken,
      honeypot: formPayload.honeypot || undefined,
    });
  });
}

bootstrap();
