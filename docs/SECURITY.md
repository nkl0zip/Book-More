# Security Model
## BookMore — Auth, Threat Model, Input Validation

---

## Table of Contents

1. [Authentication Model](#1-authentication-model)
2. [Authorisation Model](#2-authorisation-model)
3. [JWT Storage & Transport](#3-jwt-storage--transport)
4. [Password Security](#4-password-security)
5. [Input Validation](#5-input-validation)
6. [API Security Layers](#6-api-security-layers)
7. [Threat Model](#7-threat-model)
8. [Known Limitations & Trade-offs](#8-known-limitations--trade-offs)

---

## 1. Authentication Model

BookMore uses **stateless JWT authentication**. The server issues a signed token on login/register and does not maintain a server-side session store.

### Login Flow

```
Client                              Server
  │                                   │
  │  POST /api/auth/login             │
  │  { email, password }              │
  ├──────────────────────────────────►│
  │                                   │  1. Find user by email
  │                                   │  2. bcrypt.compare(password, hash)
  │                                   │  3. If match: sign JWT { _id, role }
  │  200 { token, user }              │
  │◄──────────────────────────────────┤
  │                                   │
  │  Store token in localStorage      │
  │  (key: bm_token)                  │
  │                                   │
  │  Subsequent requests:             │
  │  Authorization: Bearer <token>    │
  ├──────────────────────────────────►│
  │                                   │  4. Verify signature + expiry
  │                                   │  5. Decode { _id, role }
  │                                   │  6. Attach req.user
```

### Token Contents

```json
{
  "id": "<user ObjectId>",
  "role": "patient | provider | admin",
  "iat": 1234567890,
  "exp": 1235172690
}
```

The token encodes the minimum necessary claims. The full user record is fetched when needed via `GET /api/auth/me`.

### Token Expiry

Default: `7d`. Configurable via `JWT_EXPIRES_IN` environment variable. There is no refresh token mechanism — clients re-authenticate on expiry.

---

## 2. Authorisation Model

### Role-Based Access Control (RBAC)

Three roles: `patient`, `provider`, `admin`. Enforced on every protected route via dedicated middleware.

| Middleware | Location | Purpose |
|---|---|---|
| `protect` | `backend/middleware/authMiddleware.js` | Verify JWT, attach `req.user` |
| `restrictTo(...roles)` | `backend/middleware/authMiddleware.js` | Gate by role(s) |

**Middleware pipeline per protected route:**
```
protect → restrictTo('provider') → controller
```

### Resource-Level Ownership

Many resources enforce ownership in the controller layer — not just role:

- **Slots:** Only the owning provider can PATCH/DELETE their slots.
- **Services:** Only the owning provider can PATCH/DELETE their services.
- **Appointments:** Only the participating patient or provider can read/cancel/reschedule.

Pattern:
```javascript
const slot = await Slot.findById(req.params.id)
if (slot.provider.toString() !== req.user.id) {
  return res.status(403).json({ success: false, message: 'Not authorised' })
}
```

### Admin Bootstrap

The admin creation route (`POST /api/admin/create`) does not require a JWT. It requires a `secret` field that must match `ADMIN_SECRET` from the environment. This route is intentionally not a standard auth route so an admin account can be created before any user exists.

---

## 3. JWT Storage & Transport

### Storage: localStorage

Tokens are stored in `localStorage` under key `bm_token`.

**Trade-off:** localStorage is accessible to JavaScript running on the page, which means XSS vulnerabilities can exfiltrate tokens. The alternative (httpOnly cookies) would require CSRF protection and complicates cross-origin deployments.

BookMore accepts this trade-off for its current scope (single-domain SPA with no sensitive financial data). Before handling payment data or PII beyond contact details, migrate to `httpOnly` cookie storage with CSRF tokens.

### Transport: Authorization Header

Every request attaches the token via an Axios request interceptor:

```javascript
// services/api.js
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('bm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

### Automatic Logout on 401

An Axios response interceptor clears stored credentials and redirects to `/login` on any `401` response:

```javascript
axiosInstance.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bm_token')
      localStorage.removeItem('bm_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
```

This handles token expiry and invalidated tokens transparently across all API calls.

---

## 4. Password Security

### Hashing

Passwords are hashed with `bcrypt` at cost factor **12** before storage. The cost factor is fixed in code (not configurable) to prevent accidental downgrade.

```javascript
// backend/models/User.js (pre-save hook)
if (!this.isModified('password')) throw next()
this.password = await bcrypt.hash(this.password, 12)
```

### Password Never Returned

The `password` field has `select: false` in the Mongoose schema. It is excluded from all queries unless explicitly opted in with `.select('+password')`.

The schema's `toJSON()` transform also strips it:
```javascript
userSchema.set('toJSON', {
  transform: (_, ret) => { delete ret.password; return ret }
})
```

### Minimum Length

Enforced at the schema level: `minlength: 8`. The frontend also validates client-side before submission.

---

## 5. Input Validation

### Backend: express-validator

All request inputs are validated before reaching controller logic. Route files declare validation chains; a shared `validate` middleware collects errors and returns early:

```javascript
// Example: booking validation
body('slotId').isMongoId().withMessage('Invalid slot ID'),
body('notes').optional().isLength({ max: 500 }),
```

On failure, the controller receives no inputs — the `validate` middleware returns:
```json
{ "success": false, "message": "Validation failed", "errors": [...] }
```

### Mongoose Schema Validation

A second layer of validation exists at the model level:
- String `maxlength` / `minlength`
- `enum` constraints for role, status, currency
- `min: 0` on price, `min: 5` / `max: 480` on durationMinutes

### Frontend: react-hook-form

Client-side validation gives immediate feedback but is not a security boundary — all validation is re-enforced on the server.

---

## 6. API Security Layers

### CORS

Backend applies CORS middleware permitting only the configured `FRONTEND_URL`:

```javascript
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
```

In production, set `FRONTEND_URL` to the exact frontend domain. Wildcard (`*`) is not used.

### Helmet

`helmet` is applied on all responses to set security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS) in production
- `Content-Security-Policy` (Helmet default)

### Rate Limiting

`express-rate-limit` is applied globally:
- **Window:** 15 minutes
- **Max requests:** 100 per IP per window

Auth routes (`/api/auth/*`) have a stricter limit:
- **Window:** 15 minutes
- **Max requests:** 20 per IP per window

On breach: `429 Too Many Requests`.

### Request Size Limit

`express.json({ limit: '10kb' })` — rejects bodies over 10 KB, preventing trivial memory exhaustion.

### MongoDB Injection

Mongoose parameterises all queries. Raw string concatenation into queries does not exist in the codebase. Express-validator's `isMongoId()` check ensures that ObjectId parameters are valid before reaching Mongoose.

### Error Information Leakage

In `NODE_ENV=production`, error responses omit the stack trace:

```javascript
// Global error handler
if (process.env.NODE_ENV === 'development') {
  res.json({ success: false, message: err.message, stack: err.stack })
} else {
  res.json({ success: false, message: err.message })
}
```

Unhandled errors that would expose internal implementation details are caught by the global error handler and returned as generic 500 responses.

---

## 7. Threat Model

### In Scope (mitigated)

| Threat | Mitigation |
|---|---|
| **Password theft via DB breach** | bcrypt cost 12 — dictionary attack is expensive |
| **Privilege escalation by role manipulation** | Role is embedded in JWT and verified server-side on every request |
| **Horizontal privilege escalation** (accessing another user's data) | Ownership checks in every controller that touches user-owned resources |
| **API abuse / DoS** | Rate limiting at global and auth-route level |
| **Injection into MongoDB** | Mongoose parameterisation + express-validator MongoId checks |
| **Clickjacking** | `X-Frame-Options: DENY` via Helmet |
| **MIME sniffing** | `X-Content-Type-Options: nosniff` via Helmet |
| **Expired token reuse** | Token expiry enforced server-side; `exp` claim checked on every request |
| **Cross-origin requests** | CORS restricted to configured frontend URL |

### Out of Scope / Known Gaps

| Threat | Current Status |
|---|---|
| **XSS → token theft** | Accepted risk (localStorage). Mitigate by migrating to httpOnly cookies for production PII handling |
| **CSRF** | Not applicable while using Authorization header (not cookies). Will become necessary if migrating to cookie auth |
| **Token revocation** | No mechanism. A compromised token remains valid until expiry. Mitigation: short `JWT_EXPIRES_IN` (e.g. 1h) or add a token blocklist (Redis) |
| **Brute-force login** | Rate limiter helps but does not lock accounts. Add account lockout for production |
| **Email deliverability / spoofing** | No SPF/DKIM configured in this app — configure on the email provider level |
| **Audit logging** | No persistent audit log of sensitive actions (cancellations, account deactivation) |

---

## 8. Known Limitations & Trade-offs

### localStorage JWT Storage

**Risk:** XSS can read `localStorage`. A persistent XSS payload could exfiltrate the token.

**Why accepted:** The application currently handles appointment data, not financial data or government-regulated PII. The SPA has no third-party script injection surface.

**Migration path:** Replace localStorage with `httpOnly` cookies (`Secure`, `SameSite=Strict`). Add CSRF double-submit cookie. Update Axios to `withCredentials: true`.

### No Token Refresh

Tokens expire after 7 days. Users are logged out and must re-authenticate. There is no silent refresh.

**Migration path:** Add a refresh token (long-lived, httpOnly cookie) + short-lived access token (15 min). Backend: `POST /auth/refresh`.

### No Account Lockout

After N failed login attempts, the account is not locked. The rate limiter (20 requests per 15 min per IP) provides partial protection.

**Migration path:** Track `failedLoginAttempts` and `lockUntil` fields on the User model; lock for 15 minutes after 10 failures.
