const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

/** 见 docs/ARCHITECTURE.md「防刷三层」——蜜罐和限流之后，最后一道拦截自动化工具的关卡 */
export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing TURNSTILE_SECRET_KEY");
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch(VERIFY_URL, { method: "POST", body });
  if (!response.ok) return false;

  const data = (await response.json()) as TurnstileVerifyResponse;
  return data.success === true;
}
