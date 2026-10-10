// Dev-only mock of the API, enabled with `npm run dev:mock`: the auth endpoints
// (/users/login, /users/me, /users/logout) and trips (/trip/*), kept in memory.
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

type MockTrip = {
  tripId: number;
  title: string;
  source: string | null;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number | null;
  travellers: number | null;
  tripTypes: string[];
  invitedEmails: string[];
  createdBy: string | null;
  createdOn: string | null;
};

// yyyy-MM-dd for today + n days, so the sample trips stay upcoming/ongoing/completed.
function daysFromToday(n: number) {
  const date = new Date();
  date.setDate(date.getDate() + n);
  return date.toISOString().slice(0, 10);
}

// Sample data from the design. Resets when the dev server restarts.
let nextTripId = 4;
const trips: MockTrip[] = [
  { tripId: 1, title: "Bali Escape", source: "Singapore", destination: "Bali, Indonesia", startDate: daysFromToday(63), endDate: daysFromToday(73), budget: 3000, travellers: 2, tripTypes: ["RELAXING", "BEACH"], invitedEmails: ["arjun@example.test"], createdBy: null, createdOn: null },
  { tripId: 2, title: "Paris Getaway", source: "London", destination: "Paris, France", startDate: daysFromToday(-2), endDate: daysFromToday(5), budget: 2200, travellers: 2, tripTypes: ["CULTURE", "FOOD_AND_DRINK"], invitedEmails: [], createdBy: null, createdOn: null },
  { tripId: 3, title: "Tokyo Adventure", source: null, destination: "Tokyo, Japan", startDate: daysFromToday(-220), endDate: daysFromToday(-211), budget: 4500, travellers: 3, tripTypes: ["ADVENTURE", "CITY_BREAK"], invitedEmails: [], createdBy: null, createdOn: null },
];

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

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
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

  // req.originalUrl keeps the full path; connect strips the mount prefix from req.url.
  const path = ((req as IncomingMessage & { originalUrl?: string }).originalUrl ?? req.url ?? "").split("?")[0].replace(/^\/api/, "");
  const route = `${method} ${path}`;

  if (route === "POST /users/login") {
    const body = (await readJson(req)) as { email?: string; password?: string } | undefined;
    if (body?.email !== DEMO_USER.email || body?.password !== DEMO_PASSWORD) {
      return reply(401, { message: "Invalid email or password" });
    }
    const sessionId = randomUUID();
    sessions.set(sessionId, Date.now() + SESSION_SECONDS * 1000);
    setCookies.push(sessionCookie(sessionId, SESSION_SECONDS));
    return reply(200, DEMO_USER);
  }

  if (route === "GET /users/me") {
    return isLoggedIn(cookies) ? reply(200, DEMO_USER) : reply(401, { message: "Not authenticated" });
  }

  if (route === "POST /users/logout") {
    sessions.delete(cookies[SESSION_COOKIE]);
    // An HttpOnly cookie can only be removed by the server: same name/path, Max-Age=0.
    setCookies.push(sessionCookie("", 0));
    return reply(204);
  }

  if (path.startsWith("/trip")) {
    if (!isLoggedIn(cookies)) return reply(401, { message: "Not authenticated" });
    return handleTrips(req, method, path, reply);
  }

  return reply(404, { message: "Not found" });
}

// Same rules as TripService.validate in the backend.
function validateTrip(body: Partial<MockTrip> | undefined): string | null {
  if (!body?.title?.trim() || !body.destination?.trim()) return "Trip name and destination are required";
  if (!body.startDate || !body.endDate) return "Start and end dates are required";
  if (body.endDate < body.startDate) return "End date must be on or after the start date";
  if (body.budget != null && body.budget < 0) return "Budget can't be negative";
  if (body.travellers != null && (body.travellers < 1 || body.travellers > 50)) return "Travellers must be between 1 and 50";
  if ((body.invitedEmails?.length ?? 0) > 20) return "You can invite up to 20 people";
  return null;
}

async function handleTrips(
  req: IncomingMessage,
  method: string,
  path: string,
  reply: (status: number, body?: unknown) => void,
) {
  if (method === "GET" && path === "/trip/list") return reply(200, trips);

  if (method === "POST" && path === "/trip/create") {
    const body = (await readJson(req)) as Partial<MockTrip> | undefined;
    const error = validateTrip(body);
    if (error) return reply(400, { message: error });
    const trip: MockTrip = {
      ...(body as MockTrip),
      tripTypes: body?.tripTypes ?? [],
      invitedEmails: body?.invitedEmails ?? [],
      tripId: nextTripId++,
      createdBy: null,
      createdOn: null,
    };
    trips.push(trip);
    return reply(200, trip);
  }

  const match = /^\/trip\/(\d+)$/.exec(path);
  const index = match ? trips.findIndex((trip) => trip.tripId === Number(match[1])) : -1;
  if (index === -1) return reply(404, { message: "Trip not found" });

  if (method === "GET") return reply(200, trips[index]);

  if (method === "PUT") {
    const body = (await readJson(req)) as Partial<MockTrip> | undefined;
    const error = validateTrip(body);
    if (error) return reply(400, { message: error });
    trips[index] = { ...trips[index], ...(body as MockTrip), tripId: trips[index].tripId };
    return reply(200, trips[index]);
  }

  if (method === "DELETE") {
    trips.splice(index, 1);
    return reply(204);
  }

  return reply(404, { message: "Not found" });
}

export function mockApi(): Plugin {
  return {
    name: "mock-api",
    configureServer(server) {
      // Registered directly (not in a returned hook), so it runs before Vite's /api proxy.
      for (const prefix of ["/api/users", "/api/trip"]) {
        server.middlewares.use(prefix, (req, res) => {
          handleRequest(req, res).catch(() => send(res, 500, { message: "Mock server error" }));
        });
      }
    },
  };
}
