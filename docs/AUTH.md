# Cookie-based authentication

How login works in TravelPlan: the JWT lives in an **HttpOnly cookie** instead of
`localStorage`, so JavaScript (including an XSS payload) can never read it.

This document covers:

1. [The idea in one minute](#1-the-idea-in-one-minute)
2. [The request flow, header by header](#2-the-request-flow-header-by-header)
3. [Backend changes in travel-planner-api](#3-backend-changes-in-travel-planner-api) (file by file)
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

Only the auth pieces change. Trips, expenses and itineraries stay the same.

| File | Change |
| ---- | ------ |
| `application.properties` | JWT secret + expiry from config, cookie `Secure` flag |
| `jwt/JwtService.java` | Fixed key from config; email as the JWT subject |
| `jwt/AuthCookies.java` | **New**: builds the HttpOnly cookie |
| `jwt/JwtFilter.java` | Read the JWT from the cookie instead of the `Authorization` header |
| `config/SpaCsrfTokenRequestHandler.java` | **New**: CSRF token handling for an SPA |
| `config/SecurityConfig.java` | CSRF on, 401 for "not logged in", new public endpoints |
| `config/UserAuthService.java` + `repo/UserRepo.java` | Look users up by email |
| `dto/user/UserLoginRequest.java` | `username` → `email` |
| `service/UserService.java` | `verifyUser` throws on bad credentials instead of returning `""` |
| `controller/UserController.java` | Login sets the cookie; new `/me` and `/logout` |
| `controller/ApiExceptionHandler.java` | **New**: bad credentials → `401 {message}` |

> **Why services don't change:** the JWT subject becomes the email, and users are *looked up*
> by email, but `UserPrincipal.getUsername()` still returns the username. So every
> `SecurityContextHolder…getAuthentication().getName()` in TripService, ExpenseService,
> ItineraryService and DashboardService still gets the username, as it does today.

### 3.1 `application.properties`

```properties
# 256-bit HMAC key, base64. Dev-only value: in production inject it from an
# environment variable (APP_JWT_SECRET) and never commit it.
app.jwt.secret=ZGV2LW9ubHktc2VjcmV0LWNoYW5nZS1tZS0zMi1ieXRlcy1sb25nISE=
app.jwt.expiration=30m
# false only because local dev is plain http. Must be true in production.
app.auth.cookie-secure=false
```

Generate a real key with `openssl rand -base64 32`.

### 3.2 `jwt/JwtService.java`

Two changes:
- **Key from config.** Today `generateKey()` creates a new random key on every start, so a
  restart invalidates every cookie and logs everyone out. Running two instances would also break.
- **Subject = email**, because that's what users sign in with.

```java
@Service
public class JwtService {

  private final SecretKey secretKey;
  private final Duration expiration;

  public JwtService(@Value("${app.jwt.secret}") String secret,
                    @Value("${app.jwt.expiration}") Duration expiration) {
    this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    this.expiration = expiration;
  }

  public String generateToken(String email) {
    Instant now = Instant.now();
    return Jwts.builder()
            .subject(email)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(expiration)))
            .signWith(secretKey)
            .compact();
  }

  // Empty for a bad signature, an expired token or garbage.
  public Optional<String> extractEmail(String token) {
    try {
      return Optional.ofNullable(
              Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload().getSubject());
    } catch (JwtException | IllegalArgumentException e) {
      return Optional.empty();
    }
  }
}
```
Imports: `io.jsonwebtoken.io.Decoders`, `io.jsonwebtoken.security.Keys`, `io.jsonwebtoken.JwtException`.
`validateToken`/`extractUsername` are replaced by `extractEmail`.

### 3.3 `jwt/AuthCookies.java` (new)

Every cookie attribute is a security decision, so they live in one place.

```java
@Component
public class AuthCookies {

  public static final String ACCESS_TOKEN = "access_token";

  private final boolean secure;
  private final Duration maxAge;

  public AuthCookies(@Value("${app.auth.cookie-secure}") boolean secure,
                     @Value("${app.jwt.expiration}") Duration maxAge) {
    this.secure = secure;
    this.maxAge = maxAge; // cookie lifetime matches the JWT lifetime
  }

  public ResponseCookie create(String jwt) {
    return base(jwt).maxAge(maxAge).build();
  }

  // Same name + path, empty value, Max-Age=0: the only way to delete an HttpOnly cookie.
  public ResponseCookie clear() {
    return base("").maxAge(0).build();
  }

  private ResponseCookie.ResponseCookieBuilder base(String value) {
    return ResponseCookie.from(ACCESS_TOKEN, value)
            .httpOnly(true)   // invisible to document.cookie -> XSS can't steal it
            .secure(secure)   // HTTPS only (true in production)
            .sameSite("Lax")  // not sent on cross-site POST/PUT/DELETE -> first CSRF defence
            .path("/");       // keep "/": the dev proxy rewrites /api/users -> /users
  }
}
```

### 3.4 `jwt/JwtFilter.java`

Same filter, different source: the cookie instead of the `Authorization: Bearer` header.

```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                FilterChain filterChain) throws ServletException, IOException {
  Cookie cookie = WebUtils.getCookie(request, AuthCookies.ACCESS_TOKEN);
  if (cookie != null && SecurityContextHolder.getContext().getAuthentication() == null) {
    jwtService.extractEmail(cookie.getValue()).ifPresent(email -> {
      try {
        UserDetails user = userAuthService.loadUserByUsername(email);
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(user, null, user.getAuthorities()));
      } catch (UsernameNotFoundException ignored) {
        // Valid token for a deleted user: continue as anonymous -> 401 on protected routes.
      }
    });
  }
  filterChain.doFilter(request, response);
}
```
Imports: `jakarta.servlet.http.Cookie`, `org.springframework.web.util.WebUtils`,
`org.springframework.security.core.userdetails.UsernameNotFoundException`.

### 3.5 `config/SpaCsrfTokenRequestHandler.java` (new)

Copied from the Spring Security 6 reference ("Single-Page Applications"). Spring Security 7
replaces it with `csrf.spa()`, but your project is on 6.5.

```java
public final class SpaCsrfTokenRequestHandler implements CsrfTokenRequestHandler {

  private final CsrfTokenRequestHandler plain = new CsrfTokenRequestAttributeHandler();
  private final CsrfTokenRequestHandler xor = new XorCsrfTokenRequestAttributeHandler();

  @Override
  public void handle(HttpServletRequest request, HttpServletResponse response, Supplier<CsrfToken> csrfToken) {
    // BREACH protection for server-rendered pages that embed the token.
    this.xor.handle(request, response, csrfToken);
    // Spring loads the token lazily; loading it here makes the XSRF-TOKEN cookie
    // appear on the first response, so the SPA has a value to send back.
    csrfToken.get();
  }

  @Override
  public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
    // The SPA sends the raw cookie value in the header -> compare it as-is.
    String headerValue = request.getHeader(csrfToken.getHeaderName());
    return (StringUtils.hasText(headerValue) ? this.plain : this.xor).resolveCsrfTokenValue(request, csrfToken);
  }
}
```

### 3.6 `config/SecurityConfig.java`

Only `securityFilterChain` changes; the `authenticationProvider`, `authenticationManager` and
`passwordEncoder` beans stay as they are.

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
  return http
          // CSRF must be ON now: the browser sends the auth cookie automatically.
          .csrf(csrf -> csrf
                  .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()) // JS must read XSRF-TOKEN
                  .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler())
                  .sessionAuthenticationStrategy(new NullAuthenticatedSessionStrategy())) // see gotcha 5.1
          .authorizeHttpRequests(request -> request
                  .requestMatchers(HttpMethod.POST, "/users/signup", "/users/login", "/users/logout").permitAll()
                  .requestMatchers("/error").permitAll() // see gotcha 5.2
                  .anyRequest().authenticated())
          .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
          // Not logged in -> 401. Without this Spring answers 403, and the frontend can't
          // tell "not logged in" from "not allowed".
          .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
          .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
          .authenticationProvider(authenticationProvider())
          .build();
}
```

### 3.7 Look users up by email

```java
// repo/UserRepo.java
User findByEmail(String email);

// config/UserAuthService.java: Spring calls the login identifier "username"; ours is the email.
@Override
public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
  User user = userRepo.findByEmail(email);
  if (user == null) {
    throw new UsernameNotFoundException("User not found " + email);
  }
  return new UserPrincipal(user); // getUsername() still returns the username (see note above)
}

// dto/user/UserLoginRequest.java
private String email;      // was: username
private String password;
```

### 3.8 `service/UserService.java`

Today `verifyUser` catches every exception and returns `""` with status **200**, so the
frontend can't tell a wrong password from success. Let the exception propagate instead:

```java
public String verifyUser(UserLoginRequest userLoginRequest) {
  // Throws BadCredentialsException for a wrong email or password -> ApiExceptionHandler -> 401
  authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
          userLoginRequest.getEmail(), userLoginRequest.getPassword()));
  return jwtService.generateToken(userLoginRequest.getEmail());
}

public User getUserByEmail(String email) {
  return userRepo.findByEmail(email);
}
```

### 3.9 `controller/UserController.java`

`/login` now returns the user and puts the token in `Set-Cookie`. `/me` and `/logout` are new.

```java
@Autowired
AuthCookies authCookies;

@PostMapping("/login")
public ResponseEntity<UserResponseDTO> login(@RequestBody UserLoginRequest userLoginRequest) {
  String jwt = userService.verifyUser(userLoginRequest);
  User user = userService.getUserByEmail(userLoginRequest.getEmail());
  return ResponseEntity.ok()
          .header(HttpHeaders.SET_COOKIE, authCookies.create(jwt).toString())
          .body(userMapper.toResponse(user)); // the token is NOT in the body
}

// Reached only with a valid cookie; otherwise the entry point answers 401.
@GetMapping("/me")
public UserResponseDTO me(Authentication authentication) {
  return userMapper.toResponse(userService.getUserDetails(authentication.getName()));
}

@PostMapping("/logout")
public ResponseEntity<Void> logout() {
  return ResponseEntity.noContent()
          .header(HttpHeaders.SET_COOKIE, authCookies.clear().toString())
          .build();
}
```

### 3.10 `controller/ApiExceptionHandler.java` (new)

```java
@RestControllerAdvice
public class ApiExceptionHandler {

  // Same message for "no such email" and "wrong password", so nobody can probe which emails exist.
  @ExceptionHandler(AuthenticationException.class)
  @ResponseStatus(HttpStatus.UNAUTHORIZED)
  public Map<String, String> handleAuthentication(AuthenticationException e) {
    return Map.of("message", "Invalid email or password");
  }
}
```

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
**Fix:** `.sessionAuthenticationStrategy(new NullAuthenticatedSessionStrategy())` on the CSRF config.

### 5.2 A CSRF failure came back as 401, not 403
`CsrfFilter` correctly sends 403, but Spring Boot forwards errors to `/error`. `/error` fell
under `anyRequest().authenticated()`, so the 401 entry point overwrote the 403.
**Fix:** `.requestMatchers("/error").permitAll()`.

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
