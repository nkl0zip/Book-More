# BookMore — Deployment Guide

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Example | Notes |
|---|---|---|---|
| `PORT` | No | `5000` | Default: 5000 |
| `NODE_ENV` | Yes | `production` | `development` or `production` |
| `MONGODB_URI` | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/bookmore` | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | `super-long-random-string-min-32-chars` | Used to sign/verify JWTs — keep secret |
| `JWT_EXPIRE` | No | `7d` | Token expiry. Default: `7d` |
| `ADMIN_SECRET` | Yes | `bootstrap-admin-secret-value` | Required body field for `POST /api/admin/create` |
| `EMAIL_HOST` | Yes | `smtp.gmail.com` | SMTP host |
| `EMAIL_PORT` | Yes | `587` | SMTP port (587 = STARTTLS, 465 = SSL) |
| `EMAIL_USER` | Yes | `noreply@yourapp.com` | SMTP username |
| `EMAIL_PASS` | Yes | `app-password-here` | SMTP password or app password |
| `EMAIL_FROM` | No | `"BookMore <noreply@yourapp.com>"` | Sender name/address |
| `CLIENT_URL` | Yes | `https://yourapp.com` | CORS allowed origin + email links |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `VITE_API_URL` | Yes | `http://localhost:5000/api` | Backend API base URL |

For production, set `VITE_API_URL=https://api.yourapp.com/api`.

---

## Local Development Setup

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- MongoDB Atlas account (or local MongoDB 7+)

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd book-more

# 2. Backend setup
cd backend
cp .env.example .env        # copy template, then fill in values
npm install
npm run dev                 # starts on http://localhost:5000

# 3. Frontend setup (new terminal)
cd frontend
cp .env.example .env        # set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                 # starts on http://localhost:5173

# 4. (Optional) Create the first admin account
curl -X POST http://localhost:5000/api/admin/create \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_ADMIN_SECRET","name":"Admin","email":"admin@example.com","password":"password123"}'
```

Both servers need to run simultaneously. The frontend proxies nothing — it calls the backend directly via `VITE_API_URL`.

---

## Production Deployment

### Option 1: Single VPS (e.g. Render, Railway, DigitalOcean)

**Backend**

1. Point your provider at the `backend/` directory.
2. Set all backend environment variables in the provider dashboard.
3. Start command: `npm start` (runs `node server.js`).
4. Expose the port defined by `PORT` env var.

**Frontend**

1. Build the frontend: `cd frontend && npm run build` — outputs to `frontend/dist/`.
2. Serve `dist/` with a static host (Netlify, Vercel, Cloudflare Pages) or via the same Node server:
   ```js
   // In backend server.js, after API routes:
   app.use(express.static(path.join(__dirname, '../frontend/dist')))
   app.get('*', (req, res) =>
     res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
   )
   ```
3. Set `VITE_API_URL` to the backend's public URL before building.

### Option 2: Separate Hosts

- Backend: any Node.js host (Render, Railway, Heroku, EC2, etc.)
- Frontend: static host (Netlify, Vercel, Cloudflare Pages)

Set `VITE_API_URL` in the frontend host's environment, then trigger a rebuild.

Set `CLIENT_URL` in the backend to the frontend's public URL (used for CORS).

---

## MongoDB Atlas Setup

1. Create a free M0 cluster at https://cloud.mongodb.com.
2. Create a database user with read/write access.
3. Whitelist your server's IP (or `0.0.0.0/0` for development — restrict in production).
4. Copy the connection string and set as `MONGODB_URI`.
5. The database name is embedded in the URI: `...mongodb.net/bookmore?...`
6. Collections are created automatically by Mongoose on first write.
7. Recommended indexes are defined in each Mongoose schema. Run `npm run create-indexes` (if configured) or let Mongoose auto-create on startup.

---

## Email Setup

BookMore uses Nodemailer for transactional emails. Emails are fire-and-forget — failures are logged but never crash requests.

### Gmail (development / low volume)
1. Enable 2-factor auth on your Google account.
2. Generate an App Password: Google Account → Security → App passwords.
3. Set:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=you@gmail.com
   EMAIL_PASS=your-16-char-app-password
   ```

### SendGrid (production)
1. Create a SendGrid account and verify a sender domain.
2. Create an API key with "Mail Send" permission.
3. Set:
   ```
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=SG.your-api-key
   ```

### AWS SES (production, high volume)
1. Verify a sending identity in SES.
2. Set up SMTP credentials in AWS IAM.
3. Set:
   ```
   EMAIL_HOST=email-smtp.<region>.amazonaws.com
   EMAIL_PORT=587
   EMAIL_USER=<SMTP user from IAM>
   EMAIL_PASS=<SMTP password from IAM>
   ```

---

## Security Checklist

Before deploying to production:

- [ ] `JWT_SECRET` is at least 32 characters of random data (`openssl rand -hex 32`)
- [ ] `ADMIN_SECRET` is long and random — rotated after first admin account is created
- [ ] `NODE_ENV=production` is set (disables stack traces in error responses)
- [ ] `CLIENT_URL` is set to the exact frontend origin (no trailing slash)
- [ ] MongoDB Atlas IP allowlist is restricted to your server's static IP
- [ ] MongoDB Atlas user has minimum required permissions (readWrite on the app DB only)
- [ ] HTTPS is enforced on both frontend and backend origins
- [ ] Email `from` address matches a verified sender domain
- [ ] `frontend/.env` does not include secrets — only `VITE_*` vars (they are inlined in the JS bundle)
- [ ] `backend/.env` is not committed to version control (in `.gitignore`)

---

## Health Check

```bash
curl https://api.yourapp.com/api/health
# { "success": true, "status": "ok", "env": "production" }
```

Use this endpoint for uptime monitoring (UptimeRobot, Better Uptime, etc.).

---

## Scaling Considerations

- **MongoDB Atlas auto-scaling:** upgrade cluster tier as load grows; indexes handle query performance.
- **Backend horizontal scaling:** the backend is stateless (JWT auth, no server-side sessions). Multiple instances can run behind a load balancer.
- **Email volume:** switch from Gmail to SendGrid/SES before hitting daily limits. Gmail allows ~500 emails/day; SendGrid free tier allows 100/day.
- **Static assets:** frontend `dist/` can be served from a CDN (Cloudflare, CloudFront) for global low-latency.
