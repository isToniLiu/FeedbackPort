"use client";

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
 * 在指定容器渲染一次性 Turnstile 挑战，拿到 token 就 resolve 并销毁 widget。
 * 本地开发不需要真实 Cloudflare 账号：用官方测试 site key
 * 1x00000000000000000000AA（永远通过验证），见 docs/ROADMAP.md。
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
