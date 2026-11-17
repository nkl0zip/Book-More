# BookMore — Developer Guide

---

## Repository Structure

```
book-more/
├── backend/                  # Node.js/Express API
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/          # Route handler logic
│   │   ├── authController.js
│   │   ├── appointmentController.js
│   │   ├── providerController.js
│   │   ├── serviceController.js
│   │   ├── slotController.js
│   │   ├── dashboardController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js           # protect + authorizeRoles
│   │   └── errorHandler.js   # global error middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Service.js
│   │   ├── Slot.js
│   │   └── Appointment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── appointments.js
│   │   ├── providers.js
│   │   ├── services.js
│   │   ├── slots.js
│   │   ├── dashboard.js
│   │   └── admin.js
│   ├── utils/
│   │   └── sendEmail.js      # Nodemailer helper
│   ├── .env                  # git-ignored; copy from .env.example
│   ├── .env.example
│   ├── package.json
│   └── server.js             # App entry point
│
├── frontend/                 # React SPA
│   ├── public/
│   ├── src/
│   │   ├── context/
│   │   ├── services/
│   │   ├── components/
│   │   └── pages/
│   ├── .env                  # git-ignored; copy from .env.example
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── docs/                     # Documentation (this folder)
    ├── README.md
    ├── SDD.md
    ├── API_REFERENCE.md
    ├── DATABASE_SCHEMA.md
    ├── FRONTEND_GUIDE.md
    ├── DEPLOYMENT.md
    └── DEVELOPER_GUIDE.md
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| MongoDB Atlas | Any (free M0 is fine for dev) |
| Git | Any recent version |

---

## Getting Started

```bash
# Clone
git clone <repo-url>
cd book-more

# Backend
cd backend
cp .env.example .env
# Edit .env — fill in MONGODB_URI, JWT_SECRET, email settings
npm install
npm run dev          # nodemon; http://localhost:5000

# Frontend (new terminal)
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api  (already in .env.example)
npm install
npm run dev          # Vite; http://localhost:5173
```

After both servers are running, create your first admin:
```bash
curl -X POST http://localhost:5000/api/admin/create \
  -H 'Content-Type: application/json' \
  -d '{"secret":"YOUR_ADMIN_SECRET","name":"Admin","email":"admin@example.com","password":"password123"}'
```

---

## Scripts

### Backend (`backend/package.json`)

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `nodemon server.js` | Development with hot-reload |
| `npm start` | `node server.js` | Production |

### Frontend (`frontend/package.json`)

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite` | Dev server with HMR |
| `npm run build` | `vite build` | Production build to `dist/` |
| `npm run preview` | `vite preview` | Preview production build |
| `npm run lint` | `eslint .` | Lint check |

---

## Backend Conventions

### Controller pattern

Every controller function is an async Express handler. Errors are thrown rather than passed to `next()` — Express 5 catches async throws automatically.

```js
export const myController = async (req, res) => {
  const data = await Model.findById(req.params.id)
  if (!data) {
    const err = new Error('Not found')
    err.statusCode = 404
    throw err
  }
  res.json({ success: true, data })
}
```

### Error handling

`middleware/errorHandler.js` is the global error handler (last middleware in `server.js`). It reads `err.statusCode` (defaulting to 500) and returns:
```json
{ "success": false, "message": "...", "stack": "..." }
```
`stack` is only included when `NODE_ENV !== 'production'`.

### Route ordering rule

**Static routes must be registered before parameterised routes in the same router.**

```js
// Correct
router.get('/me/profile', protect, getMyProfile)   // static first
router.get('/:id', getProvider)                     // param after

// Wrong — :id would match "me" before the static handler runs
router.get('/:id', getProvider)
router.get('/me/profile', protect, getMyProfile)
```

### Mongoose hooks

Pre-save hooks in Mongoose 8+ use sync `throw` syntax, not `next(err)`:

```js
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})
```

### Email

Never `await` `sendEmail()`. Errors are logged but must not affect the HTTP response:

```js
sendEmail({ to, subject, html }).catch(err => console.error('Email failed:', err))
res.status(201).json({ success: true, data: appointment })
```

---

## Frontend Conventions

### Button rule

Every button needs BOTH the `btn` base class and a `glass-btn-*` color class:

```jsx
<button className="btn glass-btn-primary">Action</button>
<button className="btn glass-btn-ghost">Back</button>
```

Omitting `btn` means no `display: inline-flex`, no padding, no gap — the button renders unstyled.

### Alert rule

Both classes required together:

```jsx
<div className="glass-alert glass-alert-error">{error}</div>
```

### Spinner import

`Spinner` is a **named export**:

```jsx
import { Spinner } from '../../components/ui/Spinner'
// NOT: import Spinner from ...
```

### API response shapes

Different endpoints return data under different keys — always use nullish coalescing:

```js
const providers = res.data.providers ?? res.data.data ?? []
const provider  = res.data.provider  ?? res.data.data
```

### Responsive grid

Use flex-wrap instead of media queries for tile grids:

```jsx
// Container
<div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
  {/* Each tile */}
  <div style={{ flex: '1 1 160px' }}>...</div>
</div>
```

### Hover effects

For interactive tiles, use `onMouseEnter`/`onMouseLeave` with state (not CSS classes):

```jsx
const [hovered, setHovered] = useState(false)
<div
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
  style={{ transform: hovered ? 'translateY(-2px)' : 'none', transition: 'transform 0.2s' }}
>
```

---

## Adding a New API Endpoint

1. **Model** — add fields to the relevant Mongoose model in `backend/models/`.
2. **Controller** — add handler function in `backend/controllers/`.
3. **Route** — register with correct auth middleware in `backend/routes/`:
   ```js
   router.get('/new-path', protect, authorizeRoles('provider'), myHandler)
   ```
4. **Mount** — if new router file, mount in `backend/server.js`:
   ```js
   app.use('/api/new-resource', newRouter)
   ```
5. **Service** — add wrapper method in the appropriate `frontend/src/services/*.js` file.
6. **Document** — add endpoint to `docs/API_REFERENCE.md`.

---

## Adding a New Frontend Page

1. Create `frontend/src/pages/<role>/NewPage.jsx`.
2. Import and add the route in `frontend/src/App.jsx`:
   ```jsx
   import NewPage from './pages/patient/NewPage'
   // In the router:
   <Route path="/new-path" element={
     <ProtectedRoute allowedRoles={['patient']}>
       <NewPage />
     </ProtectedRoute>
   } />
   ```
3. Follow the page template:
   - State: `data`, `loading`, `error`
   - `useEffect` for data fetching
   - Loading state: `<Spinner />`
   - Error state: `<div className="glass-alert glass-alert-error">`
4. Update `docs/FRONTEND_GUIDE.md` routing table.

---

## Code Style

- **No TypeScript.** Plain JS throughout.
- **ES Modules.** `import`/`export` syntax in both backend (type: "module" in package.json) and frontend.
- **No comments** unless the WHY is non-obvious (hidden constraint, bug workaround, subtle invariant).
- **No half-finished code.** Don't add TODOs, placeholder functions, or stubbed-out handlers.
- **No extra abstractions.** Three similar lines of code is better than a premature helper.
- **Consistent naming:** `camelCase` variables/functions, `PascalCase` components/classes, `UPPER_SNAKE` constants.

---

## Testing

The repository has no automated test suite currently. Manual testing workflow:

1. Start both servers (`npm run dev` in each directory).
2. Register a patient and a provider via the UI.
3. Provider: create services and slots.
4. Patient: browse providers, view a provider's profile, book an appointment.
5. Both: verify confirmation emails arrive.
6. Patient: cancel or reschedule an appointment.
7. Provider: mark an appointment complete.
8. Verify dashboard stats update accordingly.

---

## Known Constraints

See `docs/SDD.md` § "Known Constraints & Limitations" for a full list. Key items:

- No payment processing — price is displayed only.
- No real-time updates — pages require manual refresh.
- Slot booking is not atomically safe under high concurrent load.
- Password change is not implemented (requires re-registration or admin reset).
- No email verification flow.
