# Eventra — IT Event Platform

Plan, launch and run tech events end to end: an organizer signs up, builds an
event from a template, customizes it with a live preview, publishes it, and
attendees self-register from a public page and get a check-in QR code.

A NestJS microservice backend behind an API gateway, with a Next.js 16
organizer + attendee frontend.

---

## The demo, in one flow

```
landing → register / login → dashboard → create event → pick template
        → customize (live preview) → publish → public page /e/:id
        → attendee self-registers → QR confirmation
        → confirmation email (event details + check-in QR)
```

Every step in that line works against the real backend.

Once an event exists, the organizer gets a full **event console** (tabbed):

- **Analytics** — registrations/revenue/email KPIs, registration timeline, pricing breakdown.
- **Registrations** — totals by status, capacity, attendee list.
- **Forms** — build the registration form (custom fields, types, required, options).
- **Check-in** — live attendance + one-click manual check-in (QR check-in also supported).
- **Emails** — create a campaign and send it to every registrant.
- **Tasks** — a Kanban board (To do / In progress / Review / Done) for event ops.
- **Networking** — searchable attendee directory.

Plus, outside the per-event console:

- **Support desk** (`/dashboard/support`) — ticket triage with resolve / escalate
  / close and SLA-aware creation.
- **Back office** (`/dashboard/admin/users`) — user list, role management
  (super admin → participant), activate / deactivate.
- **Notifications** (`/dashboard/admin/notifications`) — dispatch Slack / email
  / push and review the log.

---

## Run it locally

Prerequisites: **Node ≥ 20**, **npm ≥ 10**, and **Docker** (for Postgres + Redis).

```bash
# 1. Install workspace deps (backend + shared packages)
npm install

# 2. Env — sensible dev defaults are already in .env (copy the example if missing)
cp .env.example .env   # only if you don't have .env

# 3. Infrastructure: Postgres + Redis
npm run infra:up

# 4. Backend: API gateway + microservices (TypeORM auto-syncs schema in dev)
npm run dev:backend -- --concurrency=15

# 5. Frontend: the Eventra app (separate install — not an npm workspace)
cd apps/frontend/it-event-platfome
npm install
npm run dev -- -p 3100
```

| Surface          | URL                              |
|------------------|----------------------------------|
| Eventra UI       | http://localhost:3100            |
| API gateway      | http://localhost:3000            |
| Swagger docs     | http://localhost:3000/api/docs   |
| Postgres / Redis | localhost:5432 / localhost:6379  |

Port `3100` matches the gateway's default CORS allow-list (`ALLOWED_ORIGINS`).

> The older `apps/frontend/src` (Next.js 14) is **deprecated**. The active,
> user-facing app is `apps/frontend/it-event-platfome` (Next.js 16, React 19,
> Tailwind 4). The root `npm run dev:frontend` runs the *old* app — don't use
> it for the demo.

---

## Seed the demo

With the full stack running:

```bash
npm run seed:demo
```

This creates an organizer, a published **DevConf 2026** event (Tech Conference
template, customized), and three registered attendees. It's idempotent — safe
to re-run. It prints the URLs and these credentials:

```
email:     demo@eventra.dev
password:  DemoPass123!
```

---

## Architecture

```
apps/
├── api-gateway/          # JWT auth, rate limiting, request routing
│                         #   + public (unauthenticated) event / register routes
├── user-service/         # users, auth (JWT), guest find-or-create
├── event-service/        # event CRUD, lifecycle, public sanitized read
├── registration-service/ # registrations, QR, Stripe, dynamic form builder
├── email-service/        # campaigns + transactional confirmation email
├── checkin-service/      # QR + manual check-in, live attendance
├── analytics-service/    # event dashboards, timelines, pricing
├── task-service/         # ops Kanban board
├── support-service/      # ticketing, SLA, resolve/escalate/close
├── notification-service/ # Slack / email / push dispatch + log
├── networking-service/   # searchable attendee directory
├── file-service/         # S3 uploads — built, not surfaced (needs real
│                         #   S3 + a multipart-capable gateway path)
└── frontend/
    ├── it-event-platfome/  # ACTIVE — Next.js 16 organizer + attendee app
    └── src/                # deprecated Next.js 14 app

packages/
├── shared/    # shared TS types, enums (UserRole, EventStatus, …)
└── database/  # TypeORM entities shared across services
```

The organizer console + attendee flow exercise **gateway → user, event,
registration, email, checkin, analytics, task, support, networking and
notification services**. Only **file-service** isn't surfaced in the UI — it
needs real S3 credentials and a multipart-capable gateway route (the proxy
currently forces `application/json`). Stripe payment UI is likewise omitted
(placeholder keys only); registration uses the free/confirmed path.

### Public vs. authenticated surface

- The organizer flow (`/dashboard/*`) is JWT-guarded; the token is stored as an
  httpOnly session cookie.
- The attendee surface is unauthenticated. The gateway exposes
  `GET /api/v1/public/events/:id` (only resolves *published* events, no
  organizer PII) and `POST /api/v1/public/register`. A signed-in organizer
  previewing their own event sees it at any status; the public sees it only
  once published.

---

## Tech stack

| Layer     | Tech                                                        |
|-----------|-------------------------------------------------------------|
| Frontend  | Next.js 16, React 19, Tailwind CSS 4, server actions        |
| Backend   | NestJS 11, TypeScript, microservices behind an API gateway  |
| Data      | PostgreSQL (TypeORM), Redis                                  |
| Auth      | JWT (httpOnly cookie session), bcrypt                        |
| Payments  | Stripe (registration-service)                               |
| Build     | Turborepo, npm workspaces                                    |

---

## Notes & known limitations

- **Dev only.** `DB_SYNC=true` lets TypeORM auto-create the schema — fine for
  the demo, replace with migrations before production.
- The access token lifetime follows `JWT_EXPIRES_IN` (7d in dev) so demo
  sessions don't expire mid-walkthrough. Tighten this for production and add a
  refresh flow in the frontend.
- Guest attendees get a passwordless `PARTICIPANT` account, claimable later by
  registering normally with the same email.
- **Confirmation emails work offline.** With no Brevo/SendGrid/SES credentials,
  email-service uses a `dev` transport that writes the rendered email to
  `apps/email-service/.maildev/*.html` and logs the path — open it in a
  browser to see the attendee's ticket. Set `BREVO_API_KEY` / `SENDGRID_API_KEY`
  / real AWS keys (or `MAIL_PREVIEW_DIR`) to change this.
- Slack/S3/Cognito integrations are optional locally and no-op without real
  credentials.

---

## License

MIT
