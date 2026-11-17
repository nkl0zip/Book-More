# BookMore — API Reference

**Base URL:** `/api`  
**Content-Type:** `application/json`  
**Authentication:** `Authorization: Bearer <jwt_token>`

All responses follow the envelope:
```json
{ "success": true,  "data": { ... } }
{ "success": false, "message": "Human-readable error" }
```

---

## Health

### GET /api/health
Public. No auth.

**Response 200**
```json
{ "success": true, "status": "ok", "env": "production" }
```

---

## Authentication `/api/auth`

### POST /api/auth/register
Register a new user. Returns a JWT on success.

**Request body**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "mypassword123",
  "role": "patient",
  "specialisation": "",
  "phone": "+91 98765 43210",
  "bio": ""
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| name | string | Yes | 2–100 chars |
| email | string | Yes | valid email |
| password | string | Yes | ≥8 chars |
| role | string | No | `patient` (default) or `provider` |
| specialisation | string | If provider | required when role=provider |
| phone | string | No | |
| bio | string | No | max 500 chars |

**Response 201**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": {
    "_id": "6afc0aee0dda4bf51c1fbbca",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "patient",
    "isActive": true,
    "createdAt": "2026-11-01T10:00:00.000Z"
  }
}
```

**Errors**
- `400` — validation failure or email already registered

---

### POST /api/auth/login

**Request body**
```json
{ "email": "jane@example.com", "password": "mypassword123" }
```

**Response 200**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "_id": "...", "name": "Jane Smith", "email": "...", "role": "patient" }
}
```

**Errors**
- `400` — validation failure
- `401` — invalid credentials

---

### GET /api/auth/me
`🔒 Auth required`

Returns the authenticated user's profile.

**Response 200**
```json
{
  "success": true,
  "user": {
    "_id": "...", "name": "Jane Smith", "email": "...",
    "role": "patient", "phone": "", "bio": "", "avatarUrl": "", "isActive": true
  }
}
```

---

### PATCH /api/auth/me
`🔒 Auth required`

Update own profile (name, phone, bio, specialisation).

**Request body** (all optional)
```json
{ "name": "Jane A Smith", "phone": "+91 98765 43210", "bio": "Updated bio" }
```

**Response 200**
```json
{ "success": true, "user": { ... } }
```

---

## Providers `/api/providers`

### GET /api/providers
Public. Returns paginated list of active providers.

**Query parameters**

| Param | Type | Default | Description |
|---|---|---|---|
| search | string | — | Name or keyword search |
| specialisation | string | — | Filter by specialisation |
| page | number | 1 | Page number |
| limit | number | 10 | Results per page |

**Response 200**
```json
{
  "success": true,
  "total": 42,
  "page": 1,
  "pages": 5,
  "providers": [
    {
      "_id": "...",
      "name": "Dr. Alice Roy",
      "email": "alice@clinic.com",
      "specialisation": "Cardiology",
      "bio": "...",
      "phone": "...",
      "avatarUrl": "https://...",
      "createdAt": "..."
    }
  ]
}
```

---

### GET /api/providers/:id
Public. Single provider's public profile.

**Response 200**
```json
{ "success": true, "provider": { "_id": "...", "name": "...", "specialisation": "...", ... } }
```

**Errors**
- `404` — provider not found or inactive

---

### GET /api/providers/me/profile
`🔒 Auth required — provider`

Own full profile.

**Response 200**
```json
{ "success": true, "provider": { ... } }
```

---

### PATCH /api/providers/me/profile
`🔒 Auth required — provider`

Update own provider profile.

**Request body** (all optional)
```json
{
  "name": "Dr. Alice Roy",
  "specialisation": "Cardiology",
  "bio": "Senior cardiologist with 15 years experience.",
  "phone": "+91 98765 43210",
  "avatarUrl": "https://cdn.example.com/alice.jpg"
}
```

**Response 200**
```json
{ "success": true, "provider": { ... } }
```

---

### PATCH /api/providers/me/deactivate
`🔒 Auth required — provider`

Soft-deactivates the provider's account (`isActive = false`). Provider will no longer appear in public listings.

**Response 200**
```json
{ "success": true, "message": "Account deactivated" }
```

---

## Services `/api/services`

### GET /api/services
Public. List active services for a provider.

**Query parameters**

| Param | Required | Description |
|---|---|---|
| providerId | Yes | Provider's ObjectId |

**Response 200**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "provider": "...",
      "name": "General Consultation",
      "description": "30-minute general check-up",
      "durationMinutes": 30,
      "price": 500,
      "currency": "INR",
      "isActive": true
    }
  ]
}
```

---

### GET /api/services/mine/list
`🔒 Auth required — provider`

Returns all of the authenticated provider's services (including inactive).

**Response 200**
```json
{ "success": true, "count": 5, "data": [ ... ] }
```

---

### GET /api/services/:id
Public. Single service by ID.

**Response 200**
```json
{ "success": true, "data": { ... } }
```

---

### POST /api/services
`🔒 Auth required — provider`

Create a new service.

**Request body**
```json
{
  "name": "ECG",
  "description": "Electrocardiogram",
  "durationMinutes": 20,
  "price": 800,
  "currency": "INR"
}
```

**Response 201**
```json
{ "success": true, "data": { "_id": "...", ... } }
```

**Errors**
- `400` — validation failure or duplicate service name for this provider

---

### PATCH /api/services/:id
`🔒 Auth required — provider (owner only)`

Update a service. All fields optional.

**Request body**
```json
{ "price": 900, "isActive": false }
```

**Response 200**
```json
{ "success": true, "data": { ... } }
```

**Errors**
- `403` — not the owner of this service
- `404` — service not found

---

### DELETE /api/services/:id
`🔒 Auth required — provider (owner only)`

Soft-deletes (sets `isActive = false`).

**Response 200**
```json
{ "success": true, "message": "Service deactivated" }
```

---

## Slots `/api/slots`

### GET /api/slots
Public. List slots for a provider with optional filters.

**Query parameters**

| Param | Type | Description |
|---|---|---|
| providerId | string | Required. Provider ObjectId |
| from | ISO date | Filter start (inclusive) |
| to | ISO date | Filter end (inclusive) |
| available | boolean string | `"true"` = only unbooked slots |

**Response 200**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "_id": "...",
      "provider": "...",
      "service": { "_id": "...", "name": "General Consultation" },
      "startTime": "2026-12-01T09:00:00.000Z",
      "endTime": "2026-12-01T17:30:00.000Z",
      "isBooked": false,
      "notes": ""
    }
  ]
}
```

---

### GET /api/slots/mine/list
`🔒 Auth required — provider`

Provider's own slots with optional date range filters (same query params as above minus `providerId`).

**Response 200**
```json
{ "success": true, "count": 12, "data": [ ... ] }
```

---

### GET /api/slots/:id
Public. Single slot by ID.

**Response 200**
```json
{ "success": true, "data": { ... } }
```

---

### POST /api/slots
`🔒 Auth required — provider`

Create an availability slot.

**Request body**
```json
{
  "startTime": "2026-12-01T09:00:00.000Z",
  "endTime": "2026-12-01T17:30:00.000Z",
  "service": "6afc0aee0dda4bf51c1fbbca",
  "notes": "Morning availability"
}
```

| Field | Required | Notes |
|---|---|---|
| startTime | Yes | ISO date; must be in the future |
| endTime | Yes | ISO date; must be after startTime |
| service | No | ObjectId of a service; null = any service |
| notes | No | max 300 chars |

**Response 201**
```json
{ "success": true, "data": { ... } }
```

**Errors**
- `400` — validation failure, start in the past, end before start, or overlapping slot

---

### PATCH /api/slots/:id
`🔒 Auth required — provider (owner only)`

Update an unbooked slot.

**Request body** (all optional)
```json
{ "endTime": "2026-12-01T18:00:00.000Z", "notes": "Updated" }
```

**Errors**
- `400` — slot is already booked (cannot modify)
- `403` — not the owner

---

### DELETE /api/slots/:id
`🔒 Auth required — provider (owner only)`

Delete an unbooked slot. Cannot delete if `isBooked = true`.

**Response 200**
```json
{ "success": true, "message": "Slot deleted" }
```

---

### DELETE /api/slots/bulk
`🔒 Auth required — provider`

Delete multiple slots at once.

**Request body**
```json
{ "ids": ["6afc...", "6afd..."] }
```

**Response 200**
```json
{ "success": true, "message": "2 slot(s) deleted", "deletedCount": 2 }
```

---

## Appointments `/api/appointments`
All routes require `🔒 Auth`.

### POST /api/appointments
`Role: patient`

Book an appointment on a slot.

**Request body**
```json
{
  "slotId": "6afc0aee0dda4bf51c1fbbca",
  "serviceId": "6afc0aee0dda4bf51c1fbbcb",
  "notes": "First consultation"
}
```

| Field | Required | Notes |
|---|---|---|
| slotId | Yes | Must be unbooked |
| serviceId | No | ObjectId of a service |
| notes | No | max 500 chars |

**Response 201**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "patient": { "_id": "...", "name": "Jane Smith", "email": "..." },
    "provider": { "_id": "...", "name": "Dr. Alice Roy", "specialisation": "..." },
    "slot": "...",
    "service": { "_id": "...", "name": "General Consultation" },
    "startTime": "2026-12-01T09:00:00.000Z",
    "endTime": "2026-12-01T09:30:00.000Z",
    "status": "confirmed",
    "notes": "First consultation"
  }
}
```

**Errors**
- `400` — slot already booked
- `404` — slot not found

**Side effects:** slot marked `isBooked = true`; confirmation email sent to patient and provider.

---

### GET /api/appointments/mine
`Role: patient or provider`

List own appointments.

**Query parameters**

| Param | Type | Description |
|---|---|---|
| status | string | Single or comma-separated: `confirmed,pending` |
| from | ISO date | Start time filter |
| to | ISO date | End time filter |
| page | number | Default 1 |
| limit | number | Default 20 |

**Response 200**
```json
{
  "success": true,
  "count": 5,
  "total": 23,
  "page": 1,
  "pages": 5,
  "data": [ { ... } ]
}
```

---

### GET /api/appointments/provider
`Role: provider`

Provider's appointment list (same query params as `/mine`).

---

### GET /api/appointments/stats
`Role: any authenticated`

Per-user appointment counts by status.

**Response 200**
```json
{
  "success": true,
  "data": {
    "confirmed": 3,
    "pending": 1,
    "cancelled": 2,
    "completed": 15,
    "rescheduled": 4,
    "total": 25,
    "cancellationRate": 8
  }
}
```

---

### GET /api/appointments/:id
`Role: patient or provider (must be participant)`

**Response 200**
```json
{ "success": true, "data": { ... } }
```

---

### GET /api/appointments/:id/history
Returns the full rescheduling chain (oldest → newest).

**Response 200**
```json
{
  "success": true,
  "data": [
    { "_id": "...", "startTime": "...", "status": "rescheduled", ... },
    { "_id": "...", "startTime": "...", "status": "confirmed", ... }
  ]
}
```

---

### GET /api/appointments/:id/cancel-policy
Returns whether and until when the appointment can be cancelled/rescheduled.

**Response 200**
```json
{
  "success": true,
  "data": {
    "canCancel": true,
    "canReschedule": true,
    "deadlineISO": "2026-12-01T08:00:00.000Z",
    "msRemaining": 3480000,
    "hoursRemaining": 0,
    "minutesRemaining": 58
  }
}
```

---

### PATCH /api/appointments/:id/cancel
`Role: patient or provider (must be participant)`

**Request body** (optional)
```json
{ "reason": "Personal emergency" }
```

**Response 200**
```json
{ "success": true, "data": { ... } }
```

**Side effects:** slot marked `isBooked = false`; cancellation emails sent to both parties.

---

### PATCH /api/appointments/:id/reschedule
`Role: patient`

**Request body**
```json
{ "newSlotId": "6afc...", "notes": "Updated notes" }
```

**Response 200**
```json
{
  "success": true,
  "data": { /* new appointment document */ }
}
```

**Side effects:** old appointment status → `rescheduled`; old slot `isBooked = false`; new appointment created with status `confirmed`; new slot `isBooked = true`; reschedule emails sent.

---

### PATCH /api/appointments/:id/provider-reschedule
`Role: provider`

Same as patient reschedule but initiated by provider. Additional `reason` field in body.

**Request body**
```json
{ "newSlotId": "6afc...", "reason": "Schedule conflict" }
```

---

### PATCH /api/appointments/:id/complete
`Role: provider`

Marks appointment as completed.

**Response 200**
```json
{ "success": true, "data": { ... } }
```

---

## Dashboard `/api/dashboard`

### GET /api/dashboard/provider
`🔒 Auth required — provider`

Single-request dashboard payload.

**Response 200**
```json
{
  "success": true,
  "data": {
    "stats": {
      "today": 2,
      "thisWeek": 8,
      "total": 145,
      "completed": 120,
      "cancelled": 12,
      "cancellationRate": 8.3
    },
    "upcomingAppts": [
      {
        "_id": "...",
        "patient": { "name": "...", "email": "...", "phone": "..." },
        "service": { "name": "...", "durationMinutes": 30, "price": 500 },
        "startTime": "...",
        "endTime": "...",
        "status": "confirmed"
      }
    ],
    "weekSchedule": [
      {
        "date": "2026-11-17T00:00:00.000Z",
        "dayLabel": "Mon",
        "dateNum": 17,
        "isToday": true,
        "slotCount": 3,
        "bookedCount": 2,
        "availableCount": 1,
        "appointments": [ { ... } ]
      }
    ],
    "recentPatients": [
      { "patientId": "...", "name": "...", "email": "...", "lastAppt": "..." }
    ],
    "serviceBreakdown": [
      { "serviceId": "...", "name": "General Consultation", "count": 45, "price": 500 }
    ],
    "slotSummary": { "open": 12, "booked": 8, "total": 20 }
  }
}
```

---

## Admin `/api/admin`

### POST /api/admin/create
No auth. Bootstrap admin account.

**Request body**
```json
{
  "secret": "your_ADMIN_SECRET_value",
  "name": "Super Admin",
  "email": "admin@bookmore.app",
  "password": "strongpassword123"
}
```

**Response 201**
```json
{ "success": true, "token": "...", "user": { ... } }
```

---

### GET /api/admin/stats
`🔒 admin`

**Response 200**
```json
{
  "success": true,
  "data": {
    "users": { "total": 250, "patients": 200, "providers": 48, "admins": 2 },
    "appointments": { "total": 1200, "confirmed": 320, "completed": 780, "cancelled": 100 },
    "slots": { "total": 540, "booked": 320, "available": 220 },
    "services": { "total": 180, "active": 165 }
  }
}
```

---

### GET /api/admin/users
`🔒 admin`

**Query params:** `?role=patient|provider|admin`, `?page`, `?limit`

**Response 200**
```json
{ "success": true, "count": 10, "total": 250, "data": [ ... ] }
```

---

### GET /api/admin/users/:id | PATCH /api/admin/users/:id | DELETE /api/admin/users/:id
Standard CRUD. PATCH accepts any user fields. DELETE hard-deletes.

---

### GET /api/admin/appointments | DELETE /api/admin/appointments/:id
List with filters (`?status`, `?page`, `?limit`). Hard-delete.

---

### GET /api/admin/slots | DELETE /api/admin/slots/:id
List with filters. Hard-delete.

---

### GET /api/admin/services | PATCH /api/admin/services/:id | DELETE /api/admin/services/:id
List, update, hard-delete.

---

## Error Reference

| HTTP Status | When |
|---|---|
| 400 | Validation failure, business rule violation (slot already booked, etc.) |
| 401 | No token, invalid token, expired token |
| 403 | Authenticated but wrong role, or not the resource owner |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, duplicate service name) |
| 500 | Unhandled server error |

All error responses:
```json
{ "success": false, "message": "Human-readable description" }
```

In development (`NODE_ENV=development`), a `stack` field is also included.
