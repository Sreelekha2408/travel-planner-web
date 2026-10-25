// Dev-only mock of the API, enabled with `npm run dev:mock`: the auth endpoints
// (/users/login, /users/me, /users/logout), trips (/trip/*), itineraries
// (/itineraries/*) and expenses (/expenses/*), kept in memory.
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
const REMEMBER_ME_SECONDS = 7 * 24 * 60 * 60; // "Keep me signed in"
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

type MockUser = { userId: number; username: string; email: string; firstName: string; lastName: string };

// Test account for local development only.
const DEMO_USER: MockUser = { userId: 1, username: "demo", email: "demo@travelplan.test", firstName: "Demo", lastName: "Traveller" };
const DEMO_PASSWORD = "password123";

// email -> account. Accounts created with /users/signup last until the dev server restarts.
let nextUserId = 2;
const users = new Map<string, { user: MockUser; password: string }>([[DEMO_USER.email, { user: DEMO_USER, password: DEMO_PASSWORD }]]);

// session id -> who and until when. The real backend uses a signed JWT instead;
// the browser and the frontend can't tell the difference.
const sessions = new Map<string, { email: string; expiresAt: number }>();

type MockTrip = {
  tripId: number;
  title: string;
  source: string | null;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number | null;
  currency: string | null;
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
  { tripId: 1, title: "Bali Escape", source: "Singapore", destination: "Bali, Indonesia", startDate: daysFromToday(63), endDate: daysFromToday(73), budget: 3000, currency: "USD", travellers: 2, tripTypes: ["RELAXING", "BEACH"], invitedEmails: ["arjun@example.test"], createdBy: null, createdOn: null },
  { tripId: 2, title: "Paris Getaway", source: "London", destination: "Paris, France", startDate: daysFromToday(-2), endDate: daysFromToday(5), budget: 2200, currency: "EUR", travellers: 2, tripTypes: ["CULTURE", "FOOD_AND_DRINK"], invitedEmails: [], createdBy: null, createdOn: null },
  { tripId: 3, title: "Tokyo Adventure", source: null, destination: "Tokyo, Japan", startDate: daysFromToday(-220), endDate: daysFromToday(-211), budget: 4500, currency: "JPY", travellers: 3, tripTypes: ["ADVENTURE", "CITY_BREAK"], invitedEmails: [], createdBy: null, createdOn: null },
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

function currentUser(cookies: Record<string, string>): MockUser | null {
  const session = sessions.get(cookies[SESSION_COOKIE]);
  if (!session || session.expiresAt <= Date.now()) return null;
  return users.get(session.email)?.user ?? null;
}

function isLoggedIn(cookies: Record<string, string>) {
  return currentUser(cookies) !== null;
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
    const body = (await readJson(req)) as { email?: string; password?: string; rememberMe?: boolean } | undefined;
    const account = body?.email ? users.get(body.email) : undefined;
    if (!account || account.password !== body?.password) {
      return reply(401, { message: "Invalid email or password" });
    }
    const sessionId = randomUUID();
    const seconds = body?.rememberMe ? REMEMBER_ME_SECONDS : SESSION_SECONDS;
    sessions.set(sessionId, { email: account.user.email, expiresAt: Date.now() + seconds * 1000 });
    setCookies.push(sessionCookie(sessionId, seconds));
    return reply(200, account.user);
  }

  if (route === "POST /users/signup") {
    // Same rules as UserService.createUser in the backend.
    const body = (await readJson(req)) as { firstName?: string; lastName?: string; email?: string; password?: string } | undefined;
    if (!body?.firstName?.trim()) return reply(400, { message: "First name is required" });
    if (!body.email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(body.email)) {
      return reply(400, { message: "Enter a valid email address" });
    }
    if (!body.password || body.password.length < 8 || !/[A-Za-z]/.test(body.password) || !/\d/.test(body.password)) {
      return reply(400, { message: "Use 8 or more characters with a mix of letters and numbers" });
    }
    if (users.has(body.email)) return reply(409, { message: "An account with this email already exists" });
    const user: MockUser = { userId: nextUserId++, username: body.email, email: body.email, firstName: body.firstName, lastName: body.lastName ?? "" };
    users.set(user.email, { user, password: body.password });
    return reply(200, user);
  }

  if (route === "GET /users/me") {
    const user = currentUser(cookies);
    return user ? reply(200, user) : reply(401, { message: "Not authenticated" });
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

  if (path.startsWith("/itineraries")) {
    if (!isLoggedIn(cookies)) return reply(401, { message: "Not authenticated" });
    return handleItineraries(req, method, path, reply);
  }

  if (path.startsWith("/expenses")) {
    if (!isLoggedIn(cookies)) return reply(401, { message: "Not authenticated" });
    return handleExpenses(req, method, path, reply);
  }

  return reply(404, { message: "Not found" });
}

type MockItineraryItem = {
  itineraryItemId: number;
  title: string;
  description: string | null;
  location: string | null;
  activityType: string;
  activityDate: string;
  activityTime: string | null;
  price: number;
  tripId: number;
};

// Sample plans for Paris (ongoing) and Bali (upcoming), from the design's itinerary screen.
let nextItineraryItemId = 7;
const itineraryItems: MockItineraryItem[] = [
  { itineraryItemId: 1, title: "Eurostar to Paris Gare du Nord", description: "Coach 7, seats 41–42", location: "London St Pancras", activityType: "TRANSPORT", activityDate: daysFromToday(-2), activityTime: "08:01:00", price: 180, tripId: 2 },
  { itineraryItemId: 2, title: "Check-in · Hôtel des Grands Boulevards", description: null, location: "Rue Poissonnière", activityType: "HOTEL", activityDate: daysFromToday(-2), activityTime: "15:00:00", price: 240, tripId: 2 },
  { itineraryItemId: 3, title: "Louvre (timed entry)", description: "Tickets in email", location: "Musée du Louvre", activityType: "ACTIVITY", activityDate: daysFromToday(0), activityTime: "10:00:00", price: 44, tripId: 2 },
  { itineraryItemId: 4, title: "Dinner at Le Comptoir", description: "Reservation confirmed", location: "Saint-Germain", activityType: "FOOD", activityDate: daysFromToday(0), activityTime: "19:30:00", price: 90, tripId: 2 },
  { itineraryItemId: 5, title: "Flight SQ 423 — Changi to Ngurah Rai", description: "Singapore Airlines · Economy", location: "Changi Airport", activityType: "FLIGHT", activityDate: daysFromToday(63), activityTime: "08:45:00", price: 380, tripId: 1 },
  { itineraryItemId: 6, title: "Tegallalang Rice Terrace", description: "Guided tour · 3h", location: "Tegallalang", activityType: "ACTIVITY", activityDate: daysFromToday(64), activityTime: "09:00:00", price: 45, tripId: 1 },
];

const ACTIVITY_TYPES = ["FLIGHT", "HOTEL", "FOOD", "ACTIVITY", "TRANSPORT"];

// Same rules as ItineraryRequest's annotations in the backend (first problem only).
function validateItineraryItem(body: Partial<MockItineraryItem> | undefined): string | null {
  if (!body?.title?.trim()) return "Title is required";
  if (!body.activityType || !ACTIVITY_TYPES.includes(body.activityType)) return "Activity type is required";
  if (!body.activityDate) return "Date is required";
  if ((body.price ?? 0) < 0) return "Price can't be negative";
  return null;
}

// Mirrors ItineraryController/ItineraryService. All demo trips belong to the one demo user,
// so "someone else's trip" is just a missing one here: 404 either way, like the backend.
async function handleItineraries(
  req: IncomingMessage,
  method: string,
  path: string,
  reply: (status: number, body?: unknown) => void,
) {
  const all = /^\/itineraries\/all\/(\d+)$/.exec(path);
  if (all && method === "DELETE") {
    const tripId = Number(all[1]);
    if (!trips.some((trip) => trip.tripId === tripId)) return reply(404, { message: "Trip not found" });
    for (let i = itineraryItems.length - 1; i >= 0; i--) if (itineraryItems[i].tripId === tripId) itineraryItems.splice(i, 1);
    return reply(200, "Itineraries deleted");
  }

  const match = /^\/itineraries\/(\d+)$/.exec(path);
  if (!match) return reply(404, { message: "Not found" });
  const id = Number(match[1]);

  // GET and POST take a trip id; PUT and DELETE take an item id (same URL shape).
  if (method === "GET" || method === "POST") {
    if (!trips.some((trip) => trip.tripId === id)) return reply(404, { message: "Trip not found" });
    if (method === "GET") return reply(200, itineraryItems.filter((item) => item.tripId === id));
    const body = (await readJson(req)) as Partial<MockItineraryItem>[] | undefined;
    const list = Array.isArray(body) ? body : [];
    const error = list.map(validateItineraryItem).find(Boolean);
    if (error) return reply(400, { message: error });
    const created = list.map((input) => ({ ...(input as MockItineraryItem), itineraryItemId: nextItineraryItemId++, tripId: id }));
    itineraryItems.push(...created);
    return reply(200, created);
  }

  const index = itineraryItems.findIndex((item) => item.itineraryItemId === id);
  if (index === -1) return reply(404, { message: "Itinerary item not found" });
  if (method === "PUT") {
    const body = (await readJson(req)) as Partial<MockItineraryItem> | undefined;
    const error = validateItineraryItem(body);
    if (error) return reply(400, { message: error });
    itineraryItems[index] = { ...itineraryItems[index], ...(body as MockItineraryItem), itineraryItemId: id, tripId: itineraryItems[index].tripId };
    return reply(200, itineraryItems[index]);
  }
  if (method === "DELETE") {
    itineraryItems.splice(index, 1);
    return reply(200, "Itinerary deleted");
  }
  return reply(404, { message: "Not found" });
}

type MockExpense = {
  expenseId: number;
  title: string;
  amount: number;
  category: string;
  currency: string;
  paymentMethod: string | null;
  expenseDate: string;
  tripId: number;
};

// Sample spending for Paris (ongoing) and Bali (upcoming, booked in advance).
let nextExpenseId = 8;
const expenses: MockExpense[] = [
  { expenseId: 1, title: "Eurostar tickets", amount: 180, category: "TRANSPORT", currency: "EUR", paymentMethod: "Card", expenseDate: daysFromToday(-2), tripId: 2 },
  { expenseId: 2, title: "Hôtel des Grands Boulevards (7 nights)", amount: 840, category: "HOTEL", currency: "EUR", paymentMethod: "Card", expenseDate: daysFromToday(-2), tripId: 2 },
  { expenseId: 3, title: "Louvre tickets", amount: 44, category: "ACTIVITIES", currency: "EUR", paymentMethod: "Card", expenseDate: daysFromToday(-1), tripId: 2 },
  { expenseId: 4, title: "Croissants and coffee", amount: 18, category: "FOOD", currency: "EUR", paymentMethod: "Cash", expenseDate: daysFromToday(-1), tripId: 2 },
  { expenseId: 5, title: "Dinner at Le Comptoir", amount: 90, category: "FOOD", currency: "EUR", paymentMethod: "Card", expenseDate: daysFromToday(0), tripId: 2 },
  { expenseId: 6, title: "Flight SQ 423", amount: 380, category: "FLIGHT", currency: "USD", paymentMethod: "Card", expenseDate: daysFromToday(-10), tripId: 1 },
  { expenseId: 7, title: "Alaya Resort deposit", amount: 220, category: "HOTEL", currency: "USD", paymentMethod: "Card", expenseDate: daysFromToday(-8), tripId: 1 },
];

const EXPENSE_CATEGORIES = ["FLIGHT", "TRANSPORT", "HOTEL", "FOOD", "ACTIVITIES", "SHOPPING", "OTHER"];

// Same rules as ExpenseRequest's annotations in the backend (first problem only).
function validateExpense(body: Partial<MockExpense> | undefined): string | null {
  if (!body?.title?.trim()) return "Title is required";
  if (!body.amount || body.amount <= 0) return "Amount must be more than 0";
  if (!body.category || !EXPENSE_CATEGORIES.includes(body.category)) return "Category is required";
  if (!body.expenseDate) return "Date is required";
  return null;
}

// Newest first, like ExpenseService.getAllExpenses.
const byNewest = (a: MockExpense, b: MockExpense) => b.expenseDate.localeCompare(a.expenseDate) || b.expenseId - a.expenseId;

// Mirrors ExpenseController/ExpenseService. Like itineraries, a missing trip and someone
// else's trip are the same 404.
async function handleExpenses(
  req: IncomingMessage,
  method: string,
  path: string,
  reply: (status: number, body?: unknown) => void,
) {
  const match = /^\/expenses\/(\d+)$/.exec(path);
  if (!match) return reply(404, { message: "Not found" });
  const id = Number(match[1]);

  // GET and POST take a trip id; PUT and DELETE take an expense id (same URL shape).
  if (method === "GET" || method === "POST") {
    const trip = trips.find((t) => t.tripId === id);
    if (!trip) return reply(404, { message: "Trip not found" });
    if (method === "GET") return reply(200, expenses.filter((e) => e.tripId === id).sort(byNewest));
    const body = (await readJson(req)) as Partial<MockExpense> | undefined;
    const error = validateExpense(body);
    if (error) return reply(400, { message: error });
    const created: MockExpense = { ...(body as MockExpense), paymentMethod: body?.paymentMethod ?? null, currency: body?.currency ?? trip.currency ?? "INR", expenseId: nextExpenseId++, tripId: id };
    expenses.push(created);
    return reply(200, created);
  }

  const index = expenses.findIndex((e) => e.expenseId === id);
  if (index === -1) return reply(404, { message: "Expense not found" });
  if (method === "PUT") {
    const body = (await readJson(req)) as Partial<MockExpense> | undefined;
    const error = validateExpense(body);
    if (error) return reply(400, { message: error });
    expenses[index] = { ...expenses[index], ...(body as MockExpense), currency: body?.currency ?? expenses[index].currency, expenseId: id, tripId: expenses[index].tripId };
    return reply(200, expenses[index]);
  }
  if (method === "DELETE") {
    expenses.splice(index, 1);
    return reply(200, `Expense deleted with id: ${id}`);
  }
  return reply(404, { message: "Not found" });
}

// Same list as TripService in the backend and the frontend's currency picker.
const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD", "AED"];

// Same rules as TripService.validate in the backend.
function validateTrip(body: Partial<MockTrip> | undefined): string | null {
  if (!body?.title?.trim() || !body.destination?.trim()) return "Trip name and destination are required";
  if (!body.startDate || !body.endDate) return "Start and end dates are required";
  if (body.endDate < body.startDate) return "End date must be on or after the start date";
  if (body.budget != null && body.budget < 0) return "Budget can't be negative";
  if (body.currency != null && !SUPPORTED_CURRENCIES.includes(body.currency)) {
    return `Currency must be one of ${[...SUPPORTED_CURRENCIES].sort().join(", ")}`;
  }
  if (body.travellers != null && (body.travellers < 1 || body.travellers > 50)) return "Travellers must be between 1 and 50";
  if ((body.invitedEmails?.length ?? 0) > 20) return "You can invite up to 20 people";
  if (body.travellers != null && body.travellers < 1 + (body.invitedEmails?.length ?? 0)) {
    return "Travellers must include you and everyone invited";
  }
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
      currency: body?.currency ?? "INR",
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
    // Like TripService.deleteTrip: the trip's itinerary and expenses go with it.
    const tripId = trips[index].tripId;
    for (let i = itineraryItems.length - 1; i >= 0; i--) if (itineraryItems[i].tripId === tripId) itineraryItems.splice(i, 1);
    for (let i = expenses.length - 1; i >= 0; i--) if (expenses[i].tripId === tripId) expenses.splice(i, 1);
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
      for (const prefix of ["/api/users", "/api/trip", "/api/itineraries", "/api/expenses"]) {
        server.middlewares.use(prefix, (req, res) => {
          handleRequest(req, res).catch(() => send(res, 500, { message: "Mock server error" }));
        });
      }
    },
  };
}
