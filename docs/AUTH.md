# Cookie-based authentication

How login works in TravelPlan: the JWT lives in an **HttpOnly cookie** instead of
`localStorage`, so JavaScript (including an XSS payload) can never read it.

This document covers:

1. [The idea in one minute](#1-the-idea-in-one-minute)
2. [The request flow, header by header](#2-the-request-flow-header-by-header)
3. [Backend changes in travel-planner-api](#3-backend-changes-in-travel-planner-api) (commit by commit)
4. [Frontend changes in travel-planner-web](#4-frontend-changes-in-travel-planner-web)
5. [Gotchas found while testing](#5-gotchas-found-while-testing)
6. [How to verify it in the browser](#6-how-to-verify-it-in-the-browser)
7. [Production notes](#7-production-notes)
8. [Interview answer](#8-interview-answer)

---

## 1. The idea in one minute

|                          | Bearer token in `localStorage` (before)          | HttpOnly cookie (now)                                  |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------ |
| Who stores the token     | Our JS code                                      | The browser                                            |
| Who attaches it          | Our JS: `Authorization: Bearer …`                | The browser, automatically, on every request           |
| Can JS read it?          | Yes, so XSS can steal it and use it anywhere     | **No**: `document.cookie` doesn't show it              |
| New risk                 | None                                             | **CSRF**: other sites can make the browser send it     |
| CSRF defence             | Not needed                                       | `SameSite=Lax` + a CSRF token (double-submit)          |
| How the SPA knows who is logged in | Decode the token                       | Ask the server: `GET /users/me`                        |
| Logout                   | Delete it from storage                           | Server sends the cookie back with `Max-Age=0`          |

**What HttpOnly does *not* do:** it doesn't make XSS harmless. While a malicious
script runs on our page it can still send requests (the browser adds the cookie).
What it prevents is the token being **stolen** and reused from the attacker's machine.
XSS itself is prevented separately (React escapes output; avoid `dangerouslySetInnerHTML`;
add a Content-Security-Policy).

---

## 2. The request flow, header by header

These are real responses captured while testing (tokens shortened).

**① App starts → "who am I?"**
```
GET /users/me
← 401 Unauthorized
← Set-Cookie: XSRF-TOKEN=c818c478-…; Path=/          ← readable CSRF token (no HttpOnly)
```
React shows the sign-in page. The browser now holds the CSRF cookie.

**② Sign in**
```
POST /users/login
   Cookie: XSRF-TOKEN=c818c478-…                     ← browser adds it
   X-XSRF-TOKEN: c818c478-…                          ← our JS copies it into a header
   {"email":"…","password":"…"}
← 200 OK
← Set-Cookie: access_token=eyJhbGciOi…; Path=/; Max-Age=1800; HttpOnly; SameSite=Lax
← {"userId":1,"username":"…","email":"…","firstName":"…","lastName":"…"}
```
The JWT is **only** in `Set-Cookie`, never in the body. React stores the user object.

**③ Any API call**
```
GET /trip/list
   Cookie: access_token=eyJ…; XSRF-TOKEN=c818c478-… ← browser adds both
← 200 OK
```
POST/PUT/DELETE also carry the `X-XSRF-TOKEN` header. If the cookie has expired, the server
answers `401` and the app switches to "signed out" and redirects to `/signin`.

**④ Page refresh**: React state is gone, but the cookie isn't, so ① returns `200` + user.

**⑤ Sign out**
```
POST /users/logout   (+ X-XSRF-TOKEN)
← 204 No Content
← Set-Cookie: access_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax
```
JS can't delete an HttpOnly cookie, so the server overwrites it with an expired one.

**Why the double-submit CSRF check works:** an attacker's site can make the browser *send*
our cookies, but the same-origin policy stops it from *reading* them, so it can't put the
matching value in the `X-XSRF-TOKEN` header. The token isn't secret from our own page; the
server just checks that header == cookie.

---

## 3. Backend changes in travel-planner-api

The backend changes are in `travel-planner-api` in two forms:

- **Uncommitted on `main`**, for review in IntelliJ → Commit tool window → *Changes*
  (double-click a file to open the diff).
- **As 5 small commits on the `cookie-auth-commits` branch**, one idea each (table below).
  View one with `git show <hash>`, or open the branch in IntelliJ → *Git → Log*.

| Commit | What and why | Files |
| ------ | ------------ | ----- |
| `e637be2` | **JWT key from config.** The key was regenerated on every start, so a restart logged everyone out | `jwt/JwtService.java`, `application.properties` |
| `814bd78` | **Log in with email.** Lookup by email; JWT subject = email | `repo/UserRepo.java`, `config/UserAuthService.java`, `dto/user/UserLoginRequest.java`, `service/UserService.java`, `jwt/JwtService.java` |
| `45b8c56` | **Real 401s.** Wrong password was `200 ""`; logged-out requests were `403` | `service/UserService.java`, `controller/ApiExceptionHandler.java` (new), `config/SecurityConfig.java` |
| `76c0ffd` | **The cookie.** Login sets an HttpOnly cookie; the filter reads it; new `/me` and `/logout` | `jwt/AuthCookies.java` (new), `jwt/JwtFilter.java`, `controller/UserController.java`, `service/UserService.java`, `config/SecurityConfig.java`, `application.properties` |
| `3767be0` | **CSRF on.** Readable `XSRF-TOKEN` cookie + SPA handler; no token rotation | `config/SpaCsrfTokenRequestHandler.java` (new), `config/SecurityConfig.java` |


> **Why services don't change:** users are *looked up* by email, but
> `UserPrincipal.getUsername()` still returns the username, so every
> `getAuthentication().getName()` in TripService, ExpenseService, ItineraryService and
> DashboardService still gets the username.

**Config the backend now reads** (`application.properties`):

| Property | Dev default | Production |
| -------- | ----------- | ---------- |
| `app.jwt.secret` | dev-only key | `APP_JWT_SECRET` (generate with `openssl rand -base64 32`) |
| `app.jwt.expiration` | `30m` | same |
| `app.auth.cookie-secure` | `false` (dev is plain http) | `APP_COOKIE_SECURE=true` |

The database password lives in the gitignored `src/main/resources/local.properties`
(see `local.properties.example`).

---

## 4. Frontend changes in travel-planner-web

The frontend never sees the token. Its whole job is: send cookies, echo the CSRF token,
and ask the server who is logged in.

| File | What it does |
| ---- | ------------ |
| [`src/services/serviceWrapper.ts`](../src/services/serviceWrapper.ts) | `apiFetch`: `credentials: "include"` on every request; copies the `XSRF-TOKEN` cookie into the `X-XSRF-TOKEN` header on POST/PUT/PATCH/DELETE; any `401` triggers the "unauthorized" handler |
| [`src/services/authenticationService.ts`](../src/services/authenticationService.ts) | `signIn` → `POST /users/login`, `getCurrentUser` → `GET /users/me`, `signOut` → `POST /users/logout` |
| [`src/context/AuthContext.tsx`](../src/context/AuthContext.tsx) | `AuthProvider`: calls `/users/me` on startup (the cookie can't be read from JS) and holds `loading / unauthenticated / authenticated` |
| [`src/context/useAuth.ts`](../src/context/useAuth.ts) | The auth state type, the context and the `useAuth()` hook |
| [`src/components/routing/ProtectedRoute.tsx`](../src/components/routing/ProtectedRoute.tsx) | Spinner while loading, otherwise render the page or redirect to `/signin` |
| [`src/components/signin/SignInForm.tsx`](../src/components/signin/SignInForm.tsx) | Awaits `signIn`; shows 401/403/5xx/network errors |
| [`vite.config.ts`](../vite.config.ts) | Dev proxy `/api/*` → `http://localhost:8080`, so the browser only talks to its own origin |
| [`mock-api/authMock.ts`](../mock-api/authMock.ts) | `npm run dev:mock`: dev-only stand-in for the three endpoints, with real HttpOnly cookies |

The two lines that matter most, in `apiFetch`:

```ts
if (!SAFE_METHODS.has(method)) {
  const csrfToken = readCookie("XSRF-TOKEN");
  if (csrfToken) headers.set("X-XSRF-TOKEN", csrfToken);
}
const response = await fetch(`${API_BASE_URL}${path}`, { ...init, method, headers, credentials: "include" });
```

**Why the proxy matters:** with it, the browser sees `localhost:5173` for both the app and the
API. Cookies are first-party, `SameSite` never blocks them, the SPA can read the
`XSRF-TOKEN` cookie, and no CORS setup is needed.

---

## 5. Gotchas found while testing

Each of these was hit for real while testing this setup. All three are good interview stories.

### 5.1 The CSRF token kept changing → random 403s
Spring rotates the CSRF token when it thinks a user *just logged in*
(`CsrfAuthenticationStrategy`, run by `SessionManagementFilter`). In a stateless app the user
is re-authenticated from the cookie on **every** request, so Spring "sees a login" each time
and rotates the token. Any request sent with the previous token, such as two parallel
POSTs, fails with 403.
**Fix:** `.sessionAuthenticationStrategy(new NullAuthenticatedSessionStrategy())` on the CSRF config (commit `3767be0`).

### 5.2 A CSRF failure came back as 401, not 403
`CsrfFilter` correctly sends 403, but Spring Boot forwards errors to `/error`. `/error` fell
under `anyRequest().authenticated()`, so the 401 entry point overwrote the 403.
**Fix:** `.requestMatchers("/error").permitAll()` (commit `45b8c56`).

### 5.3 curl worked, the browser got 403 (CORS behind a proxy)
Browsers send an `Origin` header on POST requests, and curl doesn't. The Vite proxy rewrites
`Host` (`changeOrigin: true`) but not `Origin`, so Spring saw `Origin: localhost:5173` vs
`Host: localhost:8080`, decided the request was cross-origin, and rejected it because
CORS was enabled without that origin.
**Fix:** behind a proxy, don't enable CORS on the backend at all. The browser never makes
a cross-origin call.

---

## 6. How to verify it in the browser

1. Run the backend, then `npm run dev` (or `npm run dev:mock` without a backend; the test
   account is in `mock-api/authMock.ts`).
2. DevTools → **Application → Cookies → http://localhost:5173**. After signing in you'll see
   `access_token` with the **HttpOnly** box ticked, and `XSRF-TOKEN` without it.
3. Console: `document.cookie` shows `XSRF-TOKEN=…` but **not** `access_token`.
4. **Network** tab → any POST → Request Headers contain `Cookie:` and `X-XSRF-TOKEN:`.
5. Refresh `/dashboard`: you stay signed in (`/users/me` → 200).
6. Sign out → the `access_token` cookie disappears; `/dashboard` redirects to `/signin`.

---

## 7. Production notes

- **Recommended: same domain.** Serve the SPA and route `/api/*` to Spring through the
  hosting/reverse proxy (nginx, Vercel/Netlify rewrites…). This is identical to dev:
  first-party cookies, no CORS.
- `app.auth.cookie-secure=true` (HTTPS) and a real `app.jwt.secret` from the environment.
- **If the API must be on a different site:** the cookie needs `SameSite=None; Secure`, the
  backend needs CORS with `allowCredentials(true)` and an exact allowed origin (`*` is not
  allowed with credentials), and the SPA **can't read** the API's `XSRF-TOKEN` cookie, so
  double-submit breaks. That's the main reason to prefer the same domain.
- **Possible extension:** a short-lived access cookie plus a long-lived refresh cookie
  (`Path=/users/refresh`), so sessions can last longer without long-lived JWTs.
- A JWT can't be revoked before it expires. Logout clears the browser's copy; if you need
  server-side revocation, add a token denylist or switch to server sessions.

---

## 8. Interview answer

> "I store the JWT in an HttpOnly, Secure, SameSite=Lax cookie that Spring sets with
> `ResponseCookie` on login. JavaScript can't read it, so an XSS payload can't steal the token.
> Because the browser attaches cookies automatically, I keep Spring's CSRF protection on, using
> the double-submit pattern: a readable XSRF-TOKEN cookie that the frontend echoes in an
> X-XSRF-TOKEN header, which another site can't do because it can't read our cookies. The
> React app never touches the token. On startup it calls `/users/me` to find out who's logged
> in, a 401 anywhere sends the user to sign-in, and logout is a server call that expires the
> cookie. In dev, a Vite proxy keeps everything same-origin, so cookies are first-party and
> there's no CORS."
