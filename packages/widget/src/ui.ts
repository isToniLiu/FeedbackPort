import type { WidgetConfig } from "./config.js";

export interface FormSubmitPayload {
  title: string;
  body: string;
  submitterEmail: string;
}

/**
 * 挂载到 Shadow DOM，避免样式和宿主页面冲突（见 docs/decisions/0002-tech-stack.md）。
 * 目前只是最小可用骨架：一个悬浮按钮 + 一个内联表单，没有做过渡动画/多步骤 UI，
 * 后续迭代（见 docs/ROADMAP.md）在此基础上扩展。
 */
export function mountWidget(
  config: WidgetConfig,
  onSubmit: (payload: FormSubmitPayload) => Promise<void>,
): void {
  const host = document.createElement("div");
  host.id = "feedbackport-widget-root";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .fh-button {
        position: fixed; right: 20px; bottom: 20px; z-index: 2147483647;
        padding: 10px 16px; border-radius: 999px; border: none; cursor: pointer;
        background: #6366f1; color: white; font: 14px system-ui, sans-serif;
      }
      .fh-panel {
        position: fixed; right: 20px; bottom: 72px; z-index: 2147483647;
        width: 280px; padding: 16px; border-radius: 12px; background: white;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15); font: 14px system-ui, sans-serif;
        display: none;
      }
      .fh-panel.open { display: block; }
      .fh-panel input, .fh-panel textarea {
        width: 100%; box-sizing: border-box; margin-bottom: 8px; padding: 8px;
        border: 1px solid #ddd; border-radius: 6px; font: inherit;
      }
      .fh-panel button[type="submit"] {
        width: 100%; padding: 8px; border: none; border-radius: 6px;
        background: #6366f1; color: white; cursor: pointer;
      }
    </style>
    <button class="fh-button" type="button">反馈</button>
    <form class="fh-panel">
      <input name="title" placeholder="一句话描述你的想法" required maxlength="120" />
      <textarea name="body" placeholder="更多细节（选填）" maxlength="2000"></textarea>
      <input name="submitterEmail" type="email" placeholder="你的邮箱" required value="${config.userEmail ?? ""}" />
      <button type="submit">提交</button>
    </form>
  `;

  const button = shadow.querySelector<HTMLButtonElement>(".fh-button")!;
  const panel = shadow.querySelector<HTMLFormElement>(".fh-panel")!;

  button.addEventListener("click", () => panel.classList.toggle("open"));

  panel.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(panel);
    void onSubmit({
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      submitterEmail: String(formData.get("submitterEmail") ?? ""),
    }).then(() => panel.classList.remove("open"));
  });
}
