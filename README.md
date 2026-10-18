# TravelPlan

A travel planner web app: create trips with dates, budget, travellers and trip style, and keep
them all in one place. React + TypeScript on the frontend, Spring Boot on the backend, with
cookie-based authentication.

> Built with React and Spring Boot; used Claude for code review, debugging and test generation.

## Screenshots

<!-- Replace these placeholders with real screenshots (e.g. docs/screenshots/*.png). -->

| Sign in | Dashboard |
| ------- | --------- |
| _screenshot placeholder_ | _screenshot placeholder_ |

| My trips | Plan a new trip |
| -------- | --------------- |
| _screenshot placeholder_ | _screenshot placeholder_ |

| Trip detail | Mobile |
| ----------- | ------ |
| _screenshot placeholder_ | _screenshot placeholder_ |

## Features

- **Accounts**: create an account, sign in, "Keep me signed in" (7-day session), sign out
- **Secure sessions**: the JWT lives in an HttpOnly cookie (never readable by JavaScript), with
  CSRF protection; see [docs/AUTH.md](docs/AUTH.md)
- **Trips**: list, create, edit and delete trips, each with dates, budget, travellers, trip types
  and invited travellers
- **Validation** on both sides: required fields, end date on or after start date, budget ≥ 0,
  password rules; server errors are shown in the UI
- **Protected routes**: signed-out users are sent to sign-in and returned to the page they asked
  for afterwards
- **Loading, empty and error states** for every data view, with retry
- **Responsive layout**: permanent sidebar on desktop, slide-in menu on phones
- **Accessibility**: labelled inputs, real headings, keyboard-friendly toggle chips with
  `aria-pressed`, live regions for dynamic messages

## Tech stack

| Area | Choices |
| ---- | ------- |
| Frontend | React 19, TypeScript, Vite 8, React Router 7 |
| UI | MUI 9 with a custom theme (design palette, Inter font), MUI X Date Pickers, dayjs |
| Data | TanStack Query (caching, cache invalidation after create/edit/delete) |
| Forms | react-hook-form |
| Tests | Vitest, React Testing Library, jsdom |
| Backend | Java 17, Spring Boot 3.5, Spring Security 6.5, Spring Data JPA, PostgreSQL, JJWT |

## Running locally

### Prerequisites

- **Node.js 22** (see `.nvmrc`; with nvm: `nvm use`) and **npm 11**
- For the real backend: **Java 17** and **PostgreSQL** with a `travel_planner` database

### Frontend

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api to the backend on :8080
```

Without a backend, use the built-in mock API (auth with real HttpOnly cookies, plus in-memory
trips). The test account is defined in `mock-api/mockApi.ts`.

```bash
npm run dev:mock
```

Other scripts:

```bash
npm test           # Vitest in watch mode
npm run test:run   # run the tests once
npm run lint
npm run build      # type-check and production build into dist/
```

### Backend (`travel-planner-api`)

1. Copy `src/main/resources/local.properties.example` to `local.properties` (gitignored) and
   fill in your database password and a JWT key (`openssl rand -base64 32`).
2. Start it:

   ```bash
   ./mvnw spring-boot:run   # http://localhost:8080
   ```

In production, set `APP_JWT_SECRET` and `APP_AUTH_COOKIE_SECURE=true` as environment variables.

## How the frontend talks to the backend

In development the browser only talks to `localhost:5173`. Vite proxies `/api/*` to Spring Boot
and strips the prefix, so requests are same-origin: cookies are first-party and no CORS setup is
needed. Every request goes through `apiFetch` (`src/services/serviceWrapper.ts`), which sends
cookies, adds the CSRF header to POST/PUT/DELETE requests, and turns any 401 into "signed out".

### API endpoints used

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| `POST` | `/users/signup` | Create an account |
| `POST` | `/users/login` | Sign in; sets the HttpOnly `access_token` cookie |
| `GET` | `/users/me` | Who is signed in (restores the session on page load) |
| `POST` | `/users/logout` | Sign out; expires the cookie |
| `GET` | `/trip/list` | The signed-in user's trips |
| `GET` | `/trip/{id}` | One trip (404 if it doesn't exist or isn't yours) |
| `POST` | `/trip/create` | Create a trip |
| `PUT` | `/trip/{id}` | Update a trip |
| `DELETE` | `/trip/{id}` | Delete a trip (with its itinerary items and expenses) |

## Project structure

```
src/
  common/        theme, trip and password helpers (+ unit tests)
  components/
    layout/      app shell (sidebar, mobile menu), logo, coming-soon page
    routing/     ProtectedRoute
    signin/      sign-in page and form
    signup/      create-account page and form
    trips/       trip list, cards, form, detail page, delete dialog
    dashboard/
  context/       AuthProvider and useAuth (auth state: loading | unauthenticated | authenticated)
  services/      apiFetch, auth and trip API calls, TanStack Query hooks
  test/          test setup and renderWithProviders
mock-api/        dev-only mock API for `npm run dev:mock`
docs/AUTH.md     how cookie-based auth works, end to end
```

## Design decisions

- **HttpOnly cookie instead of localStorage** for the JWT, so XSS can't steal it, plus Spring's
  double-submit CSRF token. The full reasoning, request flow and gotchas are in
  [docs/AUTH.md](docs/AUTH.md).
- **Auth state as a status union** (`loading | unauthenticated | authenticated`) instead of
  `user + isLoading`, so impossible combinations can't be represented.
- **TanStack Query** for server state: one query key prefix (`["trips"]`) is invalidated after
  every create, edit or delete, so all lists refresh themselves. The cache is cleared on sign-out.
- **Code splitting**: every page except sign-in is lazy-loaded, and React and MUI get separate,
  cacheable vendor chunks. The date-picker code only downloads when the trip form opens.
- **A typed MUI theme** holds every design colour; components use theme paths such as
  `color: "text.secondary"` rather than hex values.

## Roadmap

- [ ] Itinerary: day-by-day activities per trip (backend endpoints already exist)
- [ ] Expenses: per-trip spending against the budget (backend endpoints already exist)
- [ ] Packing list
- [ ] Shared trips: actually send invites and give invitees access (invites are saved, not sent, today)
- [ ] Dashboard statistics (total trips, upcoming, spent vs budget)
- [ ] Google sign-in and "Forgot password"
- [ ] Refresh tokens, so "Keep me signed in" doesn't rely on a long-lived JWT
- [ ] Terms of Service and Privacy Policy pages
- [ ] Mobile app (React Native) using `Authorization: Bearer` alongside the web app's cookies
- [ ] End-to-end tests (e.g. Playwright) and CI
- [ ] Update the dev tooling flagged by `npm audit` (dev-only; production dependencies are clean)
- [ ] Deployment with the SPA and API on the same site
