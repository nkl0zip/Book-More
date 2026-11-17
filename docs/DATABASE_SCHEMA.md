# BookMore — Database Schema

MongoDB Atlas cluster. All collections managed by Mongoose 9 schemas with strict mode on.

---

## Collections Overview

| Collection | Documents | Purpose |
|---|---|---|
| `users` | Users | Authentication + profile for all roles (patient, provider, admin) |
| `services` | Services | Bookable services defined by a provider |
| `slots` | Slots | Provider availability windows (raw time blocks) |
| `appointments` | Appointments | Booked sessions linking patient ↔ provider ↔ slot ↔ service |

---

## Entity-Relationship Diagram

```
┌─────────────┐        ┌─────────────┐
│    users    │        │  services   │
│  (patient)  │        │             │
└──────┬──────┘        └──────┬──────┘
       │                      │
       │ patient_id            │ provider_id
       │                      │ service_id (opt)
       ▼                      ▼
┌──────────────────────────────────┐
│           appointments           │
│                                  │
│  patient   ──► users (patient)   │
│  provider  ──► users (provider)  │
│  slot      ──► slots             │
│  service   ──► services (opt)    │
│                                  │
│  rescheduledFrom ──┐             │
│  rescheduledTo   ──┘ (self-ref)  │
└──────────────────────────────────┘
       ▲
       │ provider_id
┌──────┴──────┐
│    slots    │
│             │
│  provider  ──► users (provider)  │
│  service   ──► services (opt)    │
└─────────────┘
```

---

## Collection: `users`

### Schema

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | MongoDB default |
| `name` | String | Yes | — | 2–100 chars, trimmed |
| `email` | String | Yes | — | unique, lowercase, trimmed |
| `password` | String | Yes | — | bcrypt hash (rounds=12), excluded from queries |
| `role` | String | Yes | `'patient'` | enum: `patient`, `provider`, `admin` |
| `specialisation` | String | If provider | `''` | required when role=provider; min 2 chars |
| `phone` | String | No | `''` | |
| `bio` | String | No | `''` | max 500 chars |
| `avatarUrl` | String | No | `''` | |
| `isActive` | Boolean | No | `true` | soft-delete flag |
| `createdAt` | Date | auto | `Date.now` | |
| `updatedAt` | Date | auto | `Date.now` | updated via pre-save hook |

### Indexes

| Index | Fields | Options | Purpose |
|---|---|---|---|
| Unique | `email` | `unique: true` | Prevent duplicate accounts |
| Query | `role` | — | Admin user-list filtering |
| Query | `isActive` | — | Provider listing |
| Compound | `role, isActive` | — | Active providers list |

### Virtuals
None.

### Pre-save hooks
- Hash `password` with `bcrypt.hash(password, 12)` when `password` is modified.
- Set `updatedAt = Date.now`.

### Instance methods
- `comparePassword(candidate)` — returns `bcrypt.compare(candidate, this.password)`

### Notes
- `password` field has `select: false` — never returned in default queries.
- Single collection for all three roles; `role` field discriminates.
- `specialisation` conditional validation uses a Mongoose `validate` function that checks `this.role`.

---

## Collection: `services`

### Schema

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | |
| `provider` | ObjectId (ref: `User`) | Yes | — | must be a provider-role user |
| `name` | String | Yes | — | 2–100 chars, trimmed |
| `description` | String | No | `''` | max 500 chars |
| `durationMinutes` | Number | Yes | — | integer, 5–480 |
| `price` | Number | Yes | — | ≥0 |
| `currency` | String | No | `'INR'` | 3-char currency code |
| `isActive` | Boolean | No | `true` | |
| `createdAt` | Date | auto | `Date.now` | |
| `updatedAt` | Date | auto | `Date.now` | |

### Indexes

| Index | Fields | Options | Purpose |
|---|---|---|---|
| Query | `provider` | — | Provider's own service list |
| Compound | `provider, isActive` | — | Public service listings |
| Compound | `provider, name` | `unique: true` | Prevent duplicate service names per provider |

### Notes
- Soft-delete via `isActive = false` (DELETE endpoint sets this, does not remove document).
- `currency` stored as ISO 4217 code; display formatting is the client's responsibility.

---

## Collection: `slots`

### Schema

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | |
| `provider` | ObjectId (ref: `User`) | Yes | — | |
| `service` | ObjectId (ref: `Service`) | No | `null` | null = any service |
| `startTime` | Date | Yes | — | must be in the future at create time |
| `endTime` | Date | Yes | — | must be after startTime |
| `isBooked` | Boolean | No | `false` | set true when appointment is created |
| `notes` | String | No | `''` | max 300 chars |
| `createdAt` | Date | auto | `Date.now` | |
| `updatedAt` | Date | auto | `Date.now` | |

### Indexes

| Index | Fields | Options | Purpose |
|---|---|---|---|
| Query | `provider` | — | Provider's own slots |
| Query | `isBooked` | — | Available-slot filter |
| Compound | `provider, startTime` | — | Date-range slot queries |
| Compound | `provider, isBooked, startTime` | — | Booking page: available slots for provider |

### Business Rules (enforced in controller)
1. `startTime` must be strictly in the future at creation time.
2. `endTime > startTime`.
3. No overlapping slots for same provider (checked via `$lt`/`$gt` query before save).
4. Cannot update or delete a slot where `isBooked = true`.

### Notes
- A slot represents a raw time block, not a specific service appointment duration.
- The frontend splits long slots into per-service chips using `durationMinutes` from the service.
- `isBooked` is flipped atomically with appointment creation / cancellation.

---

## Collection: `appointments`

### Schema

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | |
| `patient` | ObjectId (ref: `User`) | Yes | — | |
| `provider` | ObjectId (ref: `User`) | Yes | — | |
| `slot` | ObjectId (ref: `Slot`) | Yes | — | the slot that was booked |
| `service` | ObjectId (ref: `Service`) | No | `null` | |
| `startTime` | Date | Yes | — | snapshot of `slot.startTime` at booking time |
| `endTime` | Date | Yes | — | snapshot of `slot.endTime` at booking time |
| `status` | String | Yes | `'confirmed'` | enum: see Status Machine below |
| `notes` | String | No | `''` | max 500 chars |
| `cancellationReason` | String | No | `''` | |
| `rescheduledFrom` | ObjectId (ref: `Appointment`) | No | `null` | self-ref: previous appointment |
| `rescheduledTo` | ObjectId (ref: `Appointment`) | No | `null` | self-ref: next appointment |
| `createdAt` | Date | auto | `Date.now` | |
| `updatedAt` | Date | auto | `Date.now` | |

### Indexes

| Index | Fields | Options | Purpose |
|---|---|---|---|
| Query | `patient` | — | Patient's own appointment list |
| Query | `provider` | — | Provider's appointment list |
| Compound | `patient, status` | — | Status-filtered patient list |
| Compound | `provider, status` | — | Status-filtered provider list |
| Compound | `patient, startTime` | — | Date-range queries |
| Compound | `provider, startTime` | — | Dashboard week schedule |
| Query | `slot` | — | Check if slot is booked |

### Status Machine

```
          ┌──────────┐
          │ confirmed│ ◄── initial state on booking
          └────┬─────┘
               │
       ┌───────┴───────┐
       ▼               ▼
 ┌──────────┐   ┌─────────────┐
 │cancelled │   │ rescheduled │ ──► creates new `confirmed` appointment
 └──────────┘   └─────────────┘
       ▲               ▲
       │               │
       └──── from ─────┘
          confirmed
               │
               ▼ (provider action)
          ┌──────────┐
          │completed │
          └──────────┘
```

Valid transitions:
- `confirmed` → `cancelled` (by patient or provider)
- `confirmed` → `rescheduled` (by patient or provider)
- `confirmed` → `completed` (by provider only)
- No other transitions are permitted.

### Denormalised Fields
`startTime` and `endTime` are copied from the slot at booking time, not fetched dynamically. This means appointment times remain accurate even if the provider edits or deletes the slot later.

### Rescheduling Chain
When an appointment is rescheduled:
1. Old appointment: `status = 'rescheduled'`, `rescheduledTo = newAppt._id`
2. New appointment created: `status = 'confirmed'`, `rescheduledFrom = oldAppt._id`
3. Old slot: `isBooked = false`
4. New slot: `isBooked = true`

Traversing the chain uses `GET /api/appointments/:id/history`.

### Cancellation Policy
Enforced in the controller: an appointment may be cancelled or rescheduled if the current time is at least **1 hour before** `startTime`. If inside that window, the action is rejected with HTTP 400.

---

## Relationships Summary

```
users (provider) ──< slots          (one provider → many slots)
users (provider) ──< services       (one provider → many services)
services         ──< slots          (one service → many slots, optional)
users (patient)  ──< appointments   (one patient → many appointments)
users (provider) ──< appointments   (one provider → many appointments)
slots            ──< appointments   (one slot → one appointment, via isBooked)
services         ──< appointments   (one service → many appointments, optional)
appointments     ──< appointments   (self-ref rescheduling chain)
```

---

## Data Integrity Notes

1. **No cascading deletes.** Mongoose does not automatically clean up related documents. If a user is hard-deleted via the admin API, their slots, services, and appointments remain on disk with dangling ObjectId references. Hard deletes are admin-only and infrequent in practice.
2. **Soft deletes only for services.** Setting `isActive = false` hides a service from public APIs but preserves historical appointment records that reference it.
3. **Slot booking atomicity.** Slot `isBooked` and appointment creation are done in a single async sequential operation in the controller (not a Mongo transaction). A race condition between two patients booking the same slot simultaneously is possible under high concurrency. Mitigation: the slot controller checks `isBooked` before creating the appointment; a partial failure leaves the slot marked booked with no appointment — recoverable by admin.
4. **No Mongoose transactions.** The codebase does not use MongoDB multi-document transactions. Each operation is a single atomic document write.
