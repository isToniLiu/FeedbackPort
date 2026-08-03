interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
}

interface TurnstileGlobal {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileGlobal;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("failed to load Turnstile script"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * 在 Shadow DOM 内的容器渲染 Turnstile。传的是元素引用而不是选择器字符串——
 * document.querySelector 看不进 shadow root，必须直接给元素对象，见 ui.ts。
 * 本地开发用 Cloudflare 官方测试 site key 1x00000000000000000000AA（永远通过）。
 */
export async function getTurnstileToken(container: HTMLElement, siteKey: string): Promise<string> {
  await loadTurnstileScript();

  return new Promise((resolve, reject) => {
    if (!window.turnstile) {
      reject(new Error("Turnstile script loaded but window.turnstile is missing"));
      return;
    }

    const widgetId = window.turnstile.render(container, {
      sitekey: siteKey,
      callback: (token) => {
        resolve(token);
        window.turnstile?.remove(widgetId);
      },
      "error-callback": () => reject(new Error("Turnstile verification failed")),
      "expired-callback": () => reject(new Error("Turnstile token expired")),
    });
  });
}
