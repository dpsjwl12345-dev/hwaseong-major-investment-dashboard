export const config = {
  matcher: "/:path*",
};

const COOKIE_NAME = "hs_dash_auth";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SALT = "hwaseong-dashboard";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function loginPage(errorMessage?: string) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>화성시 주요투자사업 대시보드</title>
<style>
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh;
    background: radial-gradient(circle at 20% 20%, rgba(138,244,241,0.08), transparent 45%),
                radial-gradient(circle at 80% 80%, rgba(120,140,255,0.08), transparent 45%),
                #090f1a;
    font-family: "Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #dceaff;
  }
  form {
    width: min(90vw, 380px);
    background: rgba(9, 17, 31, 0.97);
    border: 1px solid rgba(138, 244, 241, 0.22);
    border-radius: 18px;
    padding: 32px 28px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(16px);
  }
  h1 {
    font-size: 17px; font-weight: 700; margin: 0 0 4px;
    color: #ffffff; letter-spacing: -0.02em;
  }
  p.sub {
    margin: 0 0 22px; font-size: 13px; color: #9fb2cc;
  }
  label {
    display: block; font-size: 12px; color: #9fb2cc; margin-bottom: 6px;
  }
  input[type="password"] {
    width: 100%; padding: 11px 12px; border-radius: 10px;
    border: 1px solid rgba(159, 188, 255, 0.22);
    background: rgba(255, 255, 255, 0.05);
    color: #f2f6ff; font-size: 14px; outline: none;
  }
  input[type="password"]:focus {
    border-color: rgba(138, 244, 241, 0.55);
  }
  button {
    margin-top: 18px; width: 100%; padding: 11px 12px;
    border-radius: 10px; border: none; cursor: pointer;
    background: linear-gradient(135deg, #8af4f1, #6ad0ff);
    color: #04222a; font-size: 14px; font-weight: 700;
    transition: opacity 0.15s ease;
  }
  button:hover { opacity: 0.88; }
  .error {
    margin-top: 14px; font-size: 12.5px; color: #ff9d9d;
    background: rgba(255, 90, 90, 0.1); border: 1px solid rgba(255, 90, 90, 0.3);
    border-radius: 8px; padding: 8px 10px;
  }
</style>
</head>
<body>
  <form method="POST" action="/__login">
    <h1>화성시 주요투자사업 대시보드</h1>
    <p class="sub">접속하려면 비밀번호를 입력하세요.</p>
    <label for="password">비밀번호</label>
    <input id="password" name="password" type="password" autofocus required />
    ${errorMessage ? `<div class="error">${errorMessage}</div>` : ""}
    <button type="submit">접속하기</button>
  </form>
</body>
</html>`;
}

function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function parseCookies(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    result[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return result;
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected) {
    const notConfigured = "관리자가 아직 비밀번호를 설정하지 않았습니다. (Vercel 환경변수 DASHBOARD_PASSWORD 필요)";
    return html(loginPage(notConfigured), 500);
  }

  if (url.pathname === "/__login" && request.method === "POST") {
    const form = await request.formData();
    const password = String(form.get("password") || "");
    if (password !== expected) {
      return html(loginPage("비밀번호가 올바르지 않습니다."), 401);
    }
    const token = await sha256Hex(`${expected}:${SALT}`);
    return new Response(null, {
      status: 303,
      headers: {
        "Set-Cookie": `${COOKIE_NAME}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Lax; Secure`,
        Location: "/",
      },
    });
  }

  const cookies = parseCookies(request.headers.get("cookie") || "");
  const validToken = await sha256Hex(`${expected}:${SALT}`);
  if (cookies[COOKIE_NAME] === validToken) {
    return;
  }

  return html(loginPage(), 401);
}
