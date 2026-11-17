# BookMore — Software Design Document (SDD)

**Version:** 1.0  
**Date:** November 2026  
**Status:** Production

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Data Model Design](#5-data-model-design)
6. [Backend Architecture](#6-backend-architecture)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Authentication & Security](#8-authentication--security)
9. [Email Notification System](#9-email-notification-system)
10. [Appointment Lifecycle](#10-appointment-lifecycle)
11. [Design System](#11-design-system)
12. [Key Design Decisions](#12-key-design-decisions)
13. [Known Constraints & Limitations](#13-known-constraints--limitations)

---

## 1. Overview

**BookMore** is a full-stack web application for healthcare appointment management. It connects patients with healthcare providers — patients discover providers, browse available time slots, and book appointments; providers manage their schedule, services, and patient bookings; administrators have full platform visibility.

### Core Features

| Feature | Roles |
|---|---|
| Register / Login (JWT) | All |
| Browse & search providers | Patient |
| View provider profile & services | Patient |
| Book appointments (slot selection) | Patient |
| Cancel / reschedule appointments | Patient, Provider |
| View appointment history & rescheduling chain | Patient, Provider |
| Manage availability slots | Provider |
| Manage service catalogue | Provider |
| Provider dashboard with weekly schedule & stats | Provider |
| Patient dashboard with upcoming appointments & stats | Patient |
| Email notifications (booking, cancellation, reschedule) | All |
| Admin panel (users, appointments, services, slots) | Admin |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                                                             │
│   React 19 + Vite 8 SPA                                     │
│   ├── React Router v7 (client-side routing)                  │
│   ├── AuthContext (JWT, localStorage)                        │
│   ├── Axios (api.js — baseURL /api, JWT interceptor)         │
│   └── react-hook-form (form validation)                      │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP  /api/*  (Vite dev proxy → :5001)
                     │ Direct in production
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express 5 API Server                       │
│   Port 5001 (dev) / process.env.PORT (prod)                  │
│                                                             │
│   app.js                                                     │
│   ├── cors + express.json + morgan                           │
│   ├── GET  /api/health                                       │
│   ├── /api/auth          ← authRoutes                        │
│   ├── /api/providers     ← providerRoutes                    │
│   ├── /api/services      ← serviceRoutes                     │
│   ├── /api/slots         ← slotRoutes                        │
│   ├── /api/appointments  ← appointmentRoutes                 │
│   ├── /api/dashboard     ← dashboardRoutes                   │
│   ├── /api/admin         ← adminRoutes                       │
│   └── errorMiddleware (notFound + errorHandler)              │
│                                                             │
│   Middleware chain per request:                              │
│   cors → json → morgan → route → protect? → authorise? →    │
│   validate? → controller → errorHandler                      │
└────────────────────┬────────────────────────────────────────┘
                     │ mongoose 9
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               MongoDB Atlas (or local)                       │
│   Collections: users, services, slots, appointments         │
└─────────────────────────────────────────────────────────────┘
                     
                     ┌────────────────────────────┐
                     │   Nodemailer / SMTP        │
                     │   (fire-and-forget)        │
                     │   Dev: Ethereal test inbox │
                     │   Prod: configured SMTP    │
                     └────────────────────────────┘
```

### Request Flow

```
Browser
  → Axios (attaches Bearer token from localStorage)
    → Vite proxy (dev) or nginx/reverse-proxy (prod)
      → Express router
        → protect middleware (verify JWT, attach req.user)
        → authorise middleware (role check)
        → validate middleware (Joi schema)
        → controller (business logic + DB queries)
          → (async) emailService.sendEmail (fire-and-forget)
        → JSON response
      → errorHandler (normalises all errors to { success, message })
```

---

## 3. Technology Stack

### Backend

| Package | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18 | Runtime |
| Express | 5.x | HTTP framework |
| Mongoose | 9.x | MongoDB ODM |
| bcryptjs | 3.x | Password hashing (12 rounds) |
| jsonwebtoken | 9.x | JWT generation & verification |
| Joi | 18.x | Request body validation |
| nodemailer | 10.x | Email transport |
| morgan | 1.x | HTTP request logging (dev) |
| dotenv | 18.x | Environment variable loading |
| cors | 2.x | Cross-origin resource sharing |
| nodemon | 3.x | Dev auto-restart |

### Frontend

| Package | Version | Purpose |
|---|---|---|
| React | 19.x | UI library |
| React DOM | 19.x | DOM renderer |
| Vite | 8.x | Build tool & dev server |
| React Router DOM | 7.x | Client-side routing |
| Axios | 1.x | HTTP client |
| react-hook-form | 7.x | Form state & validation |
| oxlint | 1.x | Fast JS/JSX linter |

---

## 4. User Roles & Permissions

Three roles are enforced at both the backend (`authorise` middleware) and frontend (`ProtectedRoute` component).

```
Role      │ Registration       │ Capabilities
──────────┼────────────────────┼─────────────────────────────────────────────
patient   │ Self-registration  │ Browse providers, book/cancel/reschedule
          │ role='patient'     │ appointments, view own history & stats
──────────┼────────────────────┼─────────────────────────────────────────────
provider  │ Self-registration  │ Manage slots, services, own profile;
          │ role='provider'    │ view/complete/reschedule patient bookings;
          │                   │ provider dashboard with analytics
──────────┼────────────────────┼─────────────────────────────────────────────
admin     │ POST /api/admin/   │ Full read/write access to all users,
          │ create (secret-    │ appointments, slots, services; platform stats
          │ gated bootstrap)   │
```

### Route Protection Matrix

| Route prefix | Auth required | Role required |
|---|---|---|
| `/api/auth/register`, `/api/auth/login` | No | — |
| `GET /api/providers`, `GET /api/providers/:id` | No | — |
| `GET /api/services`, `GET /api/services/:id` | No | — |
| `GET /api/slots`, `GET /api/slots/:id` | No | — |
| `/api/providers/me/*` | Yes | provider |
| `/api/services` (POST/PATCH/DELETE) | Yes | provider |
| `/api/slots` (POST/PATCH/DELETE) | Yes | provider |
| `POST /api/appointments` | Yes | patient |
| `GET /api/appointments/provider` | Yes | provider |
| `PATCH /api/appointments/:id/complete` | Yes | provider |
| `GET /api/dashboard/provider` | Yes | provider |
| `/api/admin/*` (except /create) | Yes | admin |

---

## 5. Data Model Design

### Entity Relationship

```
User (1) ──────────────────────────────── (*) User
 │ (as provider)                               (as patient)
 │                                             │
 │ (1) ──── (*) Service                        │
 │                                             │
 │ (1) ──── (*) Slot ──── (0..1) ──── Service  │
 │                │                            │
 │                └──── (*) Appointment ────────┘
 │                           │
 │                           └── self-ref: rescheduledFrom / rescheduledTo
```

### User

```
Field          Type      Constraints
─────────────────────────────────────────────────────
_id            ObjectId  auto
name           String    required, 2–100 chars, trimmed
email          String    required, unique, lowercase, valid format
password       String    required, ≥8 chars, select:false (never returned)
role           String    enum: patient | provider | admin; default: patient
specialisation String    optional (required for providers at registration)
bio            String    max 500 chars
phone          String    trimmed
avatarUrl      String    URL string
isActive       Boolean   default: true (soft-delete for deactivation)
createdAt      Date      auto (timestamps)
updatedAt      Date      auto (timestamps)
```

Password is hashed via bcrypt (12 rounds) in a pre-save hook. `toJSON()` always strips the password field.

### Service

```
Field           Type      Constraints
─────────────────────────────────────────────────────
_id             ObjectId  auto
provider        ObjectId  ref: User, required
name            String    required, 2–100 chars, trimmed
description     String    max 500 chars
durationMinutes Number    required, 5–480 (integer)
price           Number    required, ≥0
currency        String    3-char ISO code, default: INR
isActive        Boolean   default: true
createdAt/updatedAt Date  auto
```

**Index:** `{ provider: 1, name: 1 }` — unique compound (no duplicate service names per provider).

### Slot

```
Field      Type      Constraints
─────────────────────────────────────────────────────
_id        ObjectId  auto
provider   ObjectId  ref: User, required, indexed
service    ObjectId  ref: Service, nullable (default null)
startTime  Date      required; must be in the future (pre-save, new docs only)
endTime    Date      required; must be after startTime (pre-save)
isBooked   Boolean   default: false (set true when appointment confirmed)
notes      String    max 300 chars
createdAt/updatedAt Date auto
```

**Indexes:** `{ provider: 1 }`, `{ provider: 1, startTime: 1, endTime: 1 }` (overlap queries).

A slot represents a provider's available window. It may span multiple hours. The frontend expands long slots into service-duration-length chips for the booking UI.

### Appointment

```
Field               Type      Constraints
─────────────────────────────────────────────────────────────
_id                 ObjectId  auto
patient             ObjectId  ref: User, required, indexed
provider            ObjectId  ref: User, required, indexed
slot                ObjectId  ref: Slot, required
service             ObjectId  ref: Service, nullable
startTime           Date      required (denormalised snapshot from slot)
endTime             Date      required (denormalised snapshot from slot)
status              String    enum: pending|confirmed|cancelled|completed|rescheduled
                              default: confirmed
notes               String    max 500 chars
cancelledBy         String    enum: patient|provider|null
cancellationReason  String    max 300 chars
cancelledAt         Date      nullable
rescheduledTo       ObjectId  self-ref: Appointment, nullable
rescheduledFrom     ObjectId  self-ref: Appointment, nullable
createdAt/updatedAt Date      auto
```

**Indexes:** `{ slot: 1, status: 1 }` (live booking check), `{ patient: 1, startTime: -1 }`, `{ provider: 1, startTime: -1 }`.

`startTime`/`endTime` are copied from the slot at booking time — they remain stable even if the slot is later modified or deleted.

---

## 6. Backend Architecture

### Layer Structure

```
server.js          — HTTP listener only (binds port)
app.js             — Express application factory (routes, middleware)
config/db.js       — MongoDB connection (mongoose.connect)
routes/            — Route definitions (path → middleware chain → controller)
middleware/
  authMiddleware.js    — protect (JWT verify), authorise (role check), generateToken
  validateMiddleware.js — Joi validation wrapper + all schema definitions
  errorMiddleware.js   — notFound (404), errorHandler (normalise all errors)
controllers/       — Business logic, DB queries, response formatting
models/            — Mongoose schemas + hooks + indexes
utils/
  emailService.js  — nodemailer transport factory + sendEmail (fire-and-forget)
  emailTemplates.js — HTML + plain-text email builders (inline styles)
```

### Middleware

**`protect`** — extracts Bearer token from `Authorization` header, verifies with `JWT_SECRET`, fetches the user from MongoDB, attaches to `req.user`. Returns 401 if missing, invalid, or user deleted.

**`authorise(...roles)`** — checks `req.user.role` against the allowed roles list. Returns 403 if not permitted. Always called after `protect`.

**`validate(schema)`** — runs Joi validation against `req.body` with `abortEarly: false` and `stripUnknown: true`. Returns 400 with concatenated error messages on failure.

**`errorHandler`** — catches all errors forwarded via `next(err)` or thrown in async routes (Express 5 catches async errors automatically). Normalises:
- Mongoose duplicate key (11000) → 400 "{field} already in use"
- Mongoose ValidationError → 400 with all messages joined
- JsonWebTokenError → 401
- TokenExpiredError → 401
- Other → statusCode from error or 500. Stack trace included in development.

### Controller Patterns

All controllers are async. Express 5 automatically catches thrown/rejected promises and forwards to `errorHandler`, so no `try/catch` boilerplate is needed at the controller level.

Controllers follow the pattern:
```js
const action = async (req, res) => {
  // 1. Extract from req.params, req.query, req.body, req.user
  // 2. DB queries (Mongoose)
  // 3. Business logic / validation
  // 4. Fire-and-forget email if applicable
  // 5. return res.status(N).json({ success: true, data/key: result })
}
```

### Route Ordering Rule

Parameterised routes (`/:id`) are always registered **after** all static routes in the same router. This prevents Express from treating literal path segments (e.g., `/me/profile`, `/mine/list`, `/stats`, `/bulk`) as ObjectId values. This is enforced in providerRoutes, serviceRoutes, slotRoutes, and appointmentRoutes.

---

## 7. Frontend Architecture

### Application Entry

```
main.jsx
  └── BrowserRouter
        └── AuthProvider (AuthContext)
              └── App.jsx (Routes)
```

### Routing

All app routes are wrapped in `<Layout />` which renders the `<Navbar />` and an `<Outlet />`. Auth routes (`/login`, `/register`) render without the layout.

`ProtectedRoute` reads `isAuthenticated` and `user.role` from `AuthContext`. Unauthenticated users are redirected to `/login`. Users authenticated with the wrong role are redirected to their own dashboard home.

### AuthContext

Provides: `user`, `token`, `loading`, `initialising`, `isAuthenticated`, `login()`, `register()`, `logout()`.

On mount, verifies any stored token by calling `GET /api/auth/me`. If invalid, clears localStorage. The `initialising` flag prevents rendering protected routes until this check completes, avoiding flashes of the login page for authenticated users.

JWT and user object are persisted in `localStorage` under keys `bm_token` and `bm_user`.

### API Layer (`services/api.js`)

A single Axios instance with:
- `baseURL: '/api'` (resolved by Vite proxy in dev, directly in prod)
- **Request interceptor:** attaches `Authorization: Bearer <token>` from localStorage
- **Response interceptor:** on 401, clears localStorage and redirects to `/login`

Each domain has its own service module that wraps the Axios instance:

| Service | Endpoints covered |
|---|---|
| `authService` | /auth/* |
| `providerService` | /providers/* |
| `serviceService` | /services/* |
| `slotService` | /slots/* |
| `appointmentService` | /appointments/* |
| `dashboardService` | /dashboard/* |
| `adminService` | /admin/* |

### Page Structure

```
pages/
  auth/
    LoginPage.jsx      — email + password form, redirects by role on success
    RegisterPage.jsx   — role selector, conditional specialisation field
  patient/
    PatientDashboard.jsx      — stats tiles, upcoming appts, quick actions, recent visits
    FindProvidersPage.jsx     — paginated provider grid with search + specialisation filter
    ProviderDetailPage.jsx    — provider profile + services list + Book CTA
    PatientBookingPage.jsx    — 3-step wizard: pick service → pick provider → pick slot
    PatientAppointmentsPage.jsx — tabbed (upcoming/rescheduled/completed/cancelled/all)
                                   with cancel/reschedule/history modals per card
  provider/
    ProviderDashboard.jsx     — stats, week schedule strip, upcoming appts, recent patients
    ProviderProfilePage.jsx   — hero + profile photo + personal info + bio + danger zone
    ProviderServicesPage.jsx  — service cards + create/edit modal
    ProviderSlotsPage.jsx     — week calendar view, create slot modal
    ProviderAppointmentsPage.jsx — appointment management (complete, reschedule)
  shared/
    NotificationsPage.jsx     — email notification info page (no toggles — all transactional)
  admin/
    AdminPanel.jsx            — users, appointments, slots, services tables with actions
```

### Component Library

```
components/
  layout/
    Layout.jsx    — Outlet wrapper (renders Navbar + page content)
    Navbar.jsx    — role-aware navigation links, logout button
  ui/
    ProtectedRoute.jsx — role-based route guard
    Spinner.jsx        — reusable animated SVG spinner (size, color props)
```

---

## 8. Authentication & Security

### JWT Flow

```
Register/Login
  → authController generates JWT: jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' })
  → Response: { token, user }
  → Frontend: localStorage.setItem('bm_token', token)

Subsequent requests
  → Axios interceptor: Authorization: Bearer <token>
  → protect middleware: jwt.verify(token, JWT_SECRET) → req.user = User.findById(decoded.id)

Token expiry / invalidity
  → protect returns 401
  → Axios response interceptor clears localStorage, redirects to /login
```

### Password Security

- bcryptjs with **12 salt rounds** (computationally expensive by design)
- `password` field has `select: false` — never returned in queries unless `.select('+password')` is explicitly called (only in `comparePassword` usage)
- `toJSON()` hook strips `password` from all serialised User documents

### Input Validation

All mutating endpoints use Joi schemas validated before the controller runs. Schemas enforce:
- Type coercion and `stripUnknown: true` (extra fields discarded)
- String length bounds, format constraints (email, URL, ObjectId hex)
- `abortEarly: false` (all errors reported at once)

### CORS

`cors()` middleware is applied globally with default settings (all origins). For production, this should be restricted to the frontend domain.

### Admin Bootstrap

Admin accounts cannot be self-registered. `POST /api/admin/create` requires the request body to include `secret` matching `process.env.ADMIN_SECRET`. This prevents privilege escalation through the normal registration flow.

---

## 9. Email Notification System

### Architecture

```
appointmentController
  → sendEmail({ to, subject, html, text })  ← fire-and-forget, never awaited for response
      → getTransporter()                     ← cached singleton
          if EMAIL_HOST set:  SMTP transport
          else:               Ethereal ephemeral test account
      → transporter.sendMail(...)
          success: log preview URL (dev) or messageId (prod)
          failure: console.error, swallow — API already responded
```

### Email Events

| Event | Recipient(s) | Template |
|---|---|---|
| Appointment booked | Patient | bookingConfirmationPatient |
| Appointment booked | Provider | bookingNotificationProvider |
| Appointment cancelled | Patient | cancellationPatient |
| Appointment cancelled | Provider | cancellationProvider |
| Appointment rescheduled (by patient) | Patient | reschedulePatient |
| Appointment rescheduled (by patient) | Provider | rescheduleProvider |
| Appointment rescheduled (by provider) | Patient | reschedulePatient |
| Appointment rescheduled (by provider) | Provider | rescheduleProvider |

### Template Design

All templates use inline CSS (no external stylesheets) for maximum email client compatibility. Shared layout wrapper provides a branded header (purple `#8b5cf6` accent), white content area, and grey footer. Cancellation emails use a red (`#ef4444`) accent to signal urgency.

---

## 10. Appointment Lifecycle

```
                    PATIENT books slot
                          │
                          ▼
                    status: "confirmed"
                    slot.isBooked = true
                    Email → patient + provider
                          │
              ┌───────────┴────────────┐
              │                        │
        PATIENT or PROVIDER       PATIENT or PROVIDER
           cancels                  reschedules
              │                        │
              ▼                        ▼
        status: "cancelled"    OLD → status: "rescheduled"
        slot.isBooked = false  NEW → status: "confirmed"
        cancelledBy = who      rescheduledTo / rescheduledFrom linked
        cancellationReason     OLD slot.isBooked = false
        cancelledAt = now      NEW slot.isBooked = true
        Email → both           Email → both
              │
              │              PROVIDER marks complete
              │                        │
              │                        ▼
              │                status: "completed"
              │                Email: (none — completion is internal)
              │
              └────── All terminal states ──────────────────────────
                      (cancelled, completed, rescheduled-old)
                      cannot transition further
```

### Cancellation Policy

`GET /api/appointments/:id/cancel-policy` returns:
- `canCancel` — true if appointment is active AND current time is before the cancellation deadline
- `canReschedule` — same window (currently identical to canCancel)
- `deadlineISO` — ISO timestamp of cancellation cutoff (currently: 1 hour before `startTime`)
- `msRemaining`, `hoursRemaining`, `minutesRemaining` — countdown values for UI display

### Rescheduling Chain

Every reschedule creates a **new** appointment document linked to the previous one via `rescheduledFrom` / `rescheduledTo`. The full chain can be retrieved via `GET /api/appointments/:id/history`, which traverses the chain from the root (oldest) to the current (newest). The UI renders this as a timeline in the "History" panel.

### Slot Expansion (Frontend)

Providers create slots as time windows (e.g., 09:00–17:30). The patient booking page expands these into individual chips sized to the service duration (default 60 minutes) using `expandSlot()`:

```js
const expandSlot = (slot) => {
  const chunkMs = (slot.service?.durationMinutes ?? 60) * 60_000
  const start = new Date(slot.startTime).getTime()
  const end   = new Date(slot.endTime).getTime()
  if (end - start <= chunkMs) return [slot]  // already fits in one chunk
  const chips = []
  let cursor = start
  while (cursor + chunkMs <= end) {
    chips.push({ ...slot, startTime: new Date(cursor), endTime: new Date(cursor + chunkMs) })
    cursor += chunkMs
  }
  return chips
}
```

Only one appointment can be booked per underlying slot (enforced by `slot.isBooked = true` and the booking controller checking this before creating the appointment).

---

## 11. Design System

The frontend uses a single global stylesheet (`src/index.css`) implementing a dark glassmorphism design system.

### CSS Variables

```css
--accent          /* primary purple #8b5cf6 */
--accent-2        /* secondary indigo #6366f1 */
--glass-bg        /* card background rgba(255,255,255,0.06) */
--glass-bg-hover  /* card hover rgba(255,255,255,0.09) */
--glass-border    /* rgba(255,255,255,0.1) */
--text-primary    /* rgba(255,255,255,0.95) */
--text-secondary  /* rgba(255,255,255,0.6) */
--text-tertiary   /* rgba(255,255,255,0.35) */
--r-md            /* border-radius: 8px */
--r-lg            /* border-radius: 12px */
--r-full          /* border-radius: 9999px */
--sp-1 … --sp-16  /* spacing scale: 4px–64px */
--ease            /* cubic-bezier(0.22, 1, 0.36, 1) */
```

### Button System

Two classes always required together:

```
btn               — base: display:inline-flex, align-items:center, gap, padding, border-radius, transitions
glass-btn-primary — gradient purple background + purple glow shadow
glass-btn-ghost   — transparent background, border, subtle hover
glass-btn-secondary — muted variant
```

**Rule:** `glass-btn-*` classes only provide colours. `btn` provides layout. Both must be present.

### Reusable Classes

| Class | Purpose |
|---|---|
| `.content-card` | Glass card with border, backdrop-blur, border-radius |
| `.page-wrapper` | Full-height page with padding |
| `.page-container` | Max-width container, horizontal padding |
| `.page-title` | H1 typography with gradient |
| `.page-subtitle` | Muted subtitle text |
| `.glass-tabs` | Horizontal tab strip |
| `.glass-tab` / `.glass-tab.active` | Individual tab button |
| `.glass-alert.glass-alert-error` | Red error alert with icon |
| `.form-input` | Styled input field |
| `.form-textarea` | Styled textarea |
| `.form-label` | Label above form fields |
| `.modal-overlay` | Full-screen modal backdrop |
| `.modal-card` | Modal container (glass card) |
| `.modal-header` / `.modal-footer` | Modal layout |
| `.empty-state` | Centred empty state with icon |
| `.aurora-bg` / `.aurora-orb` | Animated background gradient orbs |
| `.slot-service-tag` | Pill tag for service names |

---

## 12. Key Design Decisions

### 1. Mongoose 9 / Kareem 3 Hook Pattern
Sync pre-save hooks must `throw` errors (not call `next(err)`). Async hooks must `return` or `throw` (no `next` parameter). This differs from Mongoose <8 documentation.

### 2. Static Routes Before Parameterised Routes
Express registers routes in order. `/me/profile` must be registered before `/:id` or Express will attempt to cast "me" as a MongoDB ObjectId and throw a CastError. This pattern is enforced in all routers with static sub-paths.

### 3. Denormalised Appointment Times
`startTime` and `endTime` are copied from the slot onto the appointment at booking time. This preserves appointment history even if a slot is later modified or deleted by the provider. Rescheduling creates a new appointment (never mutates the old one's times).

### 4. Fire-and-Forget Email
`sendEmail()` is never `await`ed for its result in controllers. Email failures are logged but never propagate to the API response. A broken SMTP configuration will never prevent bookings from being made.

### 5. Client-Side Slot Expansion
Providers think in availability windows (e.g., free all Tuesday afternoon). Patients book individual appointment slots. The expansion from window → chips happens in the browser, reducing API complexity while giving patients a clear per-appointment view.

### 6. No Soft-Delete on Appointments
Appointments are never deleted — they are cancelled (status = "cancelled"). The full history is always preserved. Admins can hard-delete via the admin API but this is an exceptional operation.

### 7. Token Storage in localStorage
JWT is stored in `localStorage` for simplicity. For higher-security deployments, consider `httpOnly` cookies. The current implementation is appropriate for the target use case (healthcare scheduling, not financial data).

---

## 13. Known Constraints & Limitations

| Constraint | Detail |
|---|---|
| No file upload | `avatarUrl` is a URL string — providers must host their photo externally |
| No real-time updates | Dashboard and appointment lists require a page reload to show new data |
| Single SMTP account | All emails come from one `EMAIL_FROM` address; no per-provider sender |
| No payment integration | Prices are informational only; no checkout or billing |
| No time zone handling | All times stored and displayed in server/browser local time |
| No recurring slots | Slots must be created individually (no weekly repeat pattern) |
| CORS unrestricted | All origins allowed; should be restricted to frontend domain in production |
| No rate limiting | API endpoints have no per-IP rate limiting |
| No refresh tokens | JWT expiry (7d) requires full re-login; no silent token renewal |
