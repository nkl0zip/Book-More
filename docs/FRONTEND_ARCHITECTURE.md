# Frontend Architecture
## BookMore — React Application

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Routing](#2-routing)
3. [Authentication State](#3-authentication-state)
4. [Service Layer](#4-service-layer)
5. [Component Inventory](#5-component-inventory)
6. [Page Reference](#6-page-reference)
7. [Design System](#7-design-system)
8. [Form Handling](#8-form-handling)
9. [Build & Dev Server](#9-build--dev-server)

---

## 1. Project Structure

```
frontend/
├── index.html              # Vite HTML shell
├── vite.config.js          # Vite config + /api proxy
├── package.json
└── src/
    ├── main.jsx            # React root — BrowserRouter + AuthProvider
    ├── App.jsx             # Route tree
    ├── index.css           # Global design tokens + component styles
    │
    ├── context/
    │   └── AuthContext.jsx # Global auth state (user, token, actions)
    │
    ├── services/           # Axios wrappers (one per resource)
    │   ├── api.js          # Base Axios instance + interceptors
    │   ├── authService.js
    │   ├── providerService.js
    │   ├── serviceService.js
    │   ├── slotService.js
    │   ├── appointmentService.js
    │   ├── dashboardService.js
    │   └── adminService.js
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Layout.jsx          # Navbar + <Outlet>
    │   │   └── Navbar.jsx          # Role-aware nav links
    │   └── ui/
    │       ├── ProtectedRoute.jsx  # Auth + role guard
    │       └── Spinner.jsx         # Loading spinner SVG
    │
    └── pages/
        ├── auth/
        │   ├── LoginPage.jsx
        │   └── RegisterPage.jsx
        ├── patient/
        │   ├── PatientDashboard.jsx
        │   ├── FindProvidersPage.jsx
        │   ├── ProviderDetailPage.jsx
        │   ├── PatientBookingPage.jsx
        │   └── PatientAppointmentsPage.jsx
        ├── provider/
        │   ├── ProviderDashboard.jsx
        │   ├── ProviderProfilePage.jsx
        │   ├── ProviderServicesPage.jsx
        │   ├── ProviderSlotsPage.jsx
        │   └── ProviderAppointmentsPage.jsx
        ├── shared/
        │   └── NotificationsPage.jsx
        └── admin/
            └── AdminPanel.jsx
```

---

## 2. Routing

React Router DOM v7. All routes with a layout (navbar) are nested under the `<Layout>` parent route. Auth pages (`/login`, `/register`) sit at the top level with no navbar.

### Route Table

| Path | Component | Auth | Roles |
|---|---|---|---|
| `/login` | `LoginPage` | None | — |
| `/register` | `RegisterPage` | None | — |
| `/` | `HomePage` (redirect) | None | — |
| `/patient/dashboard` | `PatientDashboard` | Required | patient |
| `/providers` | `FindProvidersPage` | Required | patient |
| `/providers/:id` | `ProviderDetailPage` | Required | patient |
| `/patient/book` | `PatientBookingPage` | Required | patient |
| `/patient/appointments` | `PatientAppointmentsPage` | Required | patient |
| `/provider/dashboard` | `ProviderDashboard` | Required | provider |
| `/provider/profile` | `ProviderProfilePage` | Required | provider |
| `/provider/services` | `ProviderServicesPage` | Required | provider |
| `/provider/slots` | `ProviderSlotsPage` | Required | provider |
| `/provider/appointments` | `ProviderAppointmentsPage` | Required | provider |
| `/settings/notifications` | `NotificationsPage` | Required | patient, provider |
| `/admin` | `AdminPanel` | Required | admin |
| `*` | `NotFound` (inline) | None | — |

### ProtectedRoute Logic

```
initialising (token verify in flight)
  → render <Spinner>

not authenticated
  → <Navigate to="/login" state={{ from: location }} />

wrong role
  → <Navigate to role-home />
     admin    → /admin
     provider → /provider/dashboard
     patient  → /patient/dashboard

correct role
  → render children
```

### HomePage Redirect

```
isAuthenticated
  admin    → /admin
  provider → /provider/dashboard
  patient  → /patient/dashboard

not authenticated
  → /login
```

---

## 3. Authentication State

### AuthContext (`context/AuthContext.jsx`)

Provides a single source of truth for auth state across the application.

**State**

| Key | Type | Description |
|---|---|---|
| `user` | object \| null | Decoded user object from last API call |
| `token` | string \| null | JWT string |
| `loading` | boolean | True while login/register in progress |
| `initialising` | boolean | True while verifying stored token on mount |
| `isAuthenticated` | boolean | Derived: `!!user` |

**Actions**

| Function | Signature | Description |
|---|---|---|
| `login` | `(email, password) → { success, user? }` | POST /auth/login, persist token |
| `register` | `(formData) → { success, user? }` | POST /auth/register, persist token |
| `logout` | `() → void` | Clear state + localStorage |

**Persistence**

- `bm_token` — JWT stored in `localStorage`
- `bm_user` — User object stored in `localStorage`

On mount, `AuthContext` reads both keys and calls `GET /api/auth/me` to verify the token is still valid. If not, both keys are cleared.

### Axios Interceptors (`services/api.js`)

**Request interceptor:** Reads `bm_token` from localStorage and attaches `Authorization: Bearer <token>` to every outgoing request automatically.

**Response interceptor:** On a `401` response, clears `bm_token` and `bm_user` and redirects to `/login` unless already there. This handles expired or invalidated tokens without any per-component logic.

---

## 4. Service Layer

Each file exports a named object of Axios call functions. All functions return an Axios response promise — callers access `res.data.*`.

### `authService.js`
```javascript
register(data)   → POST /auth/register
login(data)      → POST /auth/login
getMe()          → GET  /auth/me
updateMe(data)   → PATCH /auth/me
```

### `providerService.js`
```javascript
getAll(params)      → GET /providers
getById(id)         → GET /providers/:id
getMyProfile()      → GET /providers/me/profile
updateMyProfile(data) → PATCH /providers/me/profile
deactivate()        → PATCH /providers/me/deactivate
```

### `serviceService.js`
```javascript
getByProvider(providerId) → GET /services?providerId=
getById(id)               → GET /services/:id
getMine()                 → GET /services/mine/list
create(data)              → POST /services
update(id, data)          → PATCH /services/:id
remove(id)                → DELETE /services/:id
```

### `slotService.js`
```javascript
getByProvider(providerId, params) → GET /slots?providerId=...
getById(id)                       → GET /slots/:id
getMine(params)                   → GET /slots/mine/list
create(data)                      → POST /slots
update(id, data)                  → PATCH /slots/:id
remove(id)                        → DELETE /slots/:id
bulkRemove(ids)                   → DELETE /slots/bulk
```

### `appointmentService.js`
```javascript
book(data)                   → POST /appointments
getMine(params)              → GET  /appointments/mine
getProviderList(params)      → GET  /appointments/provider
getStats()                   → GET  /appointments/stats
getById(id)                  → GET  /appointments/:id
getHistory(id)               → GET  /appointments/:id/history
getCancelPolicy(id)          → GET  /appointments/:id/cancel-policy
cancel(id, data)             → PATCH /appointments/:id/cancel
reschedule(id, data)         → PATCH /appointments/:id/reschedule
providerReschedule(id, data) → PATCH /appointments/:id/provider-reschedule
complete(id)                 → PATCH /appointments/:id/complete
```

### `dashboardService.js`
```javascript
getProviderDashboard() → GET /dashboard/provider
```

---

## 5. Component Inventory

### Layout Components

**`Layout.jsx`**  
Renders `<Navbar>` and an `<Outlet>` for child routes. Applies the page background wrapper.

**`Navbar.jsx`**  
Role-aware navigation. Renders different links based on `user.role`:
- **Patient:** Dashboard, Find Providers, Book, My Appointments, Notifications
- **Provider:** Dashboard, Profile, Services, Slots, Appointments, Notifications
- **Admin:** Admin Panel

### UI Components

**`ProtectedRoute.jsx`**  
Wraps any route to enforce authentication and role requirements. Shows a `Spinner` while the token is being verified on mount.

**`Spinner.jsx`**  
```jsx
<Spinner size={24} color="currentColor" />
```
Renders an animated SVG ring. `size` defaults to 20, `color` defaults to `currentColor`. Requires the `@keyframes spin` animation defined in `index.css`.

---

## 6. Page Reference

### PatientDashboard
**Data:** Parallel fetch — `getStats()`, `getMine({ status: 'confirmed,pending', from: now, limit: 5 })`, `getMine({ status: 'completed', limit: 3 })`  
**Sections:** Time-aware greeting · 4 stat tiles (Upcoming, Completed, Cancelled, Total) · 4 quick action tiles · Upcoming appointments list with countdown chips · Recent visits grid

### FindProvidersPage
**Data:** `providerService.getAll(params)` with pagination  
**Features:** Search bar (by name/specialisation/keyword) · Specialisation dropdown filter · Provider card grid · Pagination

### ProviderDetailPage
**Data:** Parallel fetch — `providerService.getById(id)`, `serviceService.getByProvider(id)`  
**Sections:** Provider hero (avatar, name, spec, contact, bio) · Book Appointment CTA → `/patient/book?providerId=` · Services offered grid

### PatientBookingPage
**Flow:** 3-step stepper — Pick Service → Pick Provider → Pick Slot → Confirm  
**Slot expansion:** `expandSlot()` splits long provider slots into per-service-duration booking chips  
**Data:** `serviceService.getByProvider`, `providerService.getAll`, `slotService.getByProvider`

### PatientAppointmentsPage
**Tabs:** Upcoming · Rescheduled · Completed · Cancelled · All  
**Per card:** Provider avatar/name/spec · Date/time · Service tag · Countdown badge · Reschedule / Cancel actions (policy-gated)  
**Modals:** CancelModal · RescheduleModal (slot picker) · HistoryPanel (rescheduling chain)

### ProviderDashboard
**Data:** `dashboardService.getProviderDashboard()` — single round-trip for all sections  
**Sections:** Stats strip (today, week, total, cancellation rate) · Upcoming appointments list · 7-day week schedule calendar · Recent patients · Service breakdown · Slot summary

### ProviderProfilePage
**Sections:** Hero banner (avatar + name + spec) · Photo card (URL input) · Personal info grid (name, spec, phone) · Bio card · Save/Discard footer · Danger Zone (deactivate account with inline confirm)

### ProviderServicesPage
**Features:** Service cards with price/duration/status · Add New Service modal (name, description, duration, price, currency) · Edit modal · Soft-delete with confirm

### ProviderSlotsPage
**Features:** Create slot form (date, start/end time, service) · Week navigation calendar · Slot chips showing start–end time · Delete individual slot

### NotificationsPage
**Sections:** Delivery address card with copy button · Active notification event cards (colour-coded per event type) · Delivery facts tile grid · Dev mode note

### AdminPanel
**Sections:** Platform stats · Users table (CRUD) · Appointments table · Slots table · Services table

---

## 7. Design System

All styling is in `src/index.css`. No external CSS framework is used.

### CSS Custom Properties (Key Tokens)

```css
/* Colours */
--accent:           #8b5cf6;    /* primary violet */
--accent-2:         #6366f1;    /* indigo */
--text-primary:     rgba(255,255,255,0.92);
--text-secondary:   rgba(255,255,255,0.55);
--text-tertiary:    rgba(255,255,255,0.3);

/* Glass surfaces */
--glass-bg:         rgba(255,255,255,0.04);
--glass-bg-hover:   rgba(255,255,255,0.07);
--glass-bg-input:   rgba(255,255,255,0.06);
--glass-border:     rgba(255,255,255,0.1);

/* Border radii */
--r-sm:   4px;
--r-md:   8px;
--r-lg:   12px;
--r-xl:   16px;
--r-full: 9999px;

/* Spacing scale (4px base) */
--sp-1: 4px;   --sp-2: 8px;   --sp-3: 12px;  --sp-4: 16px;
--sp-5: 20px;  --sp-6: 24px;  --sp-8: 32px;  --sp-10: 40px;
--sp-12: 48px; --sp-16: 64px;

/* Typography */
--font-sans: 'Inter', 'DM Sans', system-ui, sans-serif;
```

### Button System

Every button requires **two classes**: a layout base + a colour modifier.

```html
<!-- Primary action -->
<button class="btn glass-btn-primary">Save</button>

<!-- Secondary action -->
<button class="btn glass-btn-secondary">Cancel</button>

<!-- Ghost / low-emphasis -->
<button class="btn glass-btn-ghost">Back</button>
```

`btn` provides: `display: inline-flex`, `align-items: center`, `gap`, `padding`, `border-radius`, `font-weight`, `cursor`, `transition`.  
`glass-btn-*` provides: background colour, border colour, text colour.

**Using a colour class without `btn` produces an unstyled element.**

### Glass Cards

```html
<div class="content-card">...</div>
```

Provides: `glass-bg` background · `glass-border` border · `r-lg` border-radius · `sp-5/6` padding · hover state.

### Form Elements

```html
<input class="form-input" />
<input class="form-input has-icon" />   <!-- left-padded for an icon -->
<textarea class="form-textarea" />
<select class="form-input" />            <!-- styled with SVG chevron -->
<label class="form-label" />
```

### Alerts

```html
<!-- Error alert (red) -->
<div class="glass-alert glass-alert-error">Message</div>
```

`glass-alert` alone produces no colour. `glass-alert-error` must always accompany it for red styling.

### Aurora Background

Every page renders:
```html
<div class="aurora-bg" aria-hidden="true">
  <div class="aurora-orb orb-1"/>
  <div class="aurora-orb orb-2"/>
  ...
</div>
```

This creates the animated gradient background orbs. It is purely decorative (`aria-hidden`).

### Animations

All entrance animations use:
```css
animation: slideInUp 0.4s var(--ease) <delay>ms both;
```

`slideInUp` is a `@keyframes` rule in `index.css` that fades and translates the element up from 16px below.

---

## 8. Form Handling

All forms use `react-hook-form` v7.

Pattern:
```jsx
const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ mode: 'onTouched' })

const onSubmit = async (data) => {
  try {
    await someService.create(data)
    // success
  } catch (err) {
    setServerError(err.response?.data?.message || 'Something went wrong.')
  }
}
```

Server errors are stored in local component state and displayed as `glass-alert glass-alert-error` elements above the submit button. Client-side validation errors from `react-hook-form` are displayed inline below each field.

---

## 9. Build & Dev Server

### Development

```bash
cd frontend
npm install
npm run dev       # starts Vite at http://localhost:5173
```

All `/api/*` requests are proxied to `http://localhost:5001` (configured in `vite.config.js`).

### Production Build

```bash
npm run build     # outputs to frontend/dist/
npm run preview   # serves the dist build locally
```

The `dist/` folder is a static SPA — serve it from any static host (Netlify, Vercel, Nginx). The server must be configured to serve `index.html` for all paths (client-side routing).

### Linting

```bash
npm run lint      # oxlint
```
