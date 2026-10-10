// Dev-only mock of the auth endpoints (/users/login, /users/me, /users/logout), enabled with `npm run dev:mock`.
// It is a real HTTP handler inside the Vite dev server, so it sends real Set-Cookie
// headers: you can inspect the HttpOnly session cookie in DevTools > Application > Cookies.
// It mirrors what the Spring Boot backend does (see docs/AUTH.md); delete it once the
// backend is available and run `npm run dev` instead.
import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const SESSION_COOKIE = "access_token";
const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "x-xsrf-token"; // Node lower-cases incoming header names
const SESSION_SECONDS = 30 * 60;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Test account for local development only.
const DEMO_USER = { userId: 1, username: "demo", email: "demo@travelplan.test", firstName: "Demo", lastName: "Traveller" };
const DEMO_PASSWORD = "password123";

// session id -> expiry timestamp (ms). The real backend uses a signed JWT instead;
// the browser and the frontend can't tell the difference.
const sessions = new Map<string, number>();

function parseCookies(req: IncomingMessage): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of req.headers.cookie?.split(";") ?? []) {
    const [name, ...rest] = part.trim().split("=");
    if (name) cookies[name] = decodeURIComponent(rest.join("="));
  }
  return cookies;
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString();
  return text ? JSON.parse(text) : undefined;
}

function send(res: ServerResponse, status: number, body?: unknown) {
  res.statusCode = status;
  if (body === undefined) {
    res.end();
    return;
  }
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

// Secure is omitted because the dev server is plain http (Safari rejects Secure cookies
// on http://localhost). Production cookies must be Secure.
function sessionCookie(value: string, maxAge: number) {
  return `${SESSION_COOKIE}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function isLoggedIn(cookies: Record<string, string>) {
  const expiresAt = sessions.get(cookies[SESSION_COOKIE]);
  return expiresAt !== undefined && expiresAt > Date.now();
}

async function handleAuth(req: IncomingMessage, res: ServerResponse) {
  const method = req.method ?? "GET";
  const cookies = parseCookies(req);
  const setCookies: string[] = [];

  // Issue the readable CSRF cookie on the first request (Spring's CookieCsrfTokenRepository
  // does the same). No HttpOnly: the frontend must read it to copy it into a header.
  if (!cookies[CSRF_COOKIE]) {
    setCookies.push(`${CSRF_COOKIE}=${randomUUID()}; SameSite=Lax; Path=/`);
  }

  const reply = (status: number, body?: unknown) => {
    if (setCookies.length) res.setHeader("Set-Cookie", setCookies);
    send(res, status, body);
  };

  // Double-submit check: another site can make the browser send our cookies,
  // but it can't read them, so it can't put the matching value in the header.
  if (!SAFE_METHODS.has(method)) {
    const header = req.headers[CSRF_HEADER];
    if (!cookies[CSRF_COOKIE] || header !== cookies[CSRF_COOKIE]) {
      return reply(403, { message: "Invalid CSRF token" });
    }
  }

  const route = `${method} ${req.url?.split("?")[0]}`;

  if (route === "POST /login") {
    const body = (await readJson(req)) as { email?: string; password?: string } | undefined;
    if (body?.email !== DEMO_USER.email || body?.password !== DEMO_PASSWORD) {
      return reply(401, { message: "Invalid email or password" });
    }
    const sessionId = randomUUID();
    sessions.set(sessionId, Date.now() + SESSION_SECONDS * 1000);
    setCookies.push(sessionCookie(sessionId, SESSION_SECONDS));
    return reply(200, DEMO_USER);
  }

  if (route === "GET /me") {
    return isLoggedIn(cookies) ? reply(200, DEMO_USER) : reply(401, { message: "Not authenticated" });
  }

  if (route === "POST /logout") {
    sessions.delete(cookies[SESSION_COOKIE]);
    // An HttpOnly cookie can only be removed by the server: same name/path, Max-Age=0.
    setCookies.push(sessionCookie("", 0));
    return reply(204);
  }

  return reply(404, { message: "Not found" });
}

export function authMock(): Plugin {
  return {
    name: "auth-mock",
    configureServer(server) {
      // Registered directly (not in a returned hook), so it runs before Vite's /api proxy.
      server.middlewares.use("/api/users", (req, res) => {
        handleAuth(req, res).catch(() => send(res, 500, { message: "Mock server error" }));
      });
    },
  };
}
