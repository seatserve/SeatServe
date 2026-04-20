# CineBites — Multi-Tenant SaaS for Cinema In-Seat Ordering

## Original Problem Statement
QR-based in-seat food ordering for movie theaters. Each seat has a unique QR. No customer login. Must scale to multiple multiplexes sold by a single platform operator.

## Current Architecture (Feb 2026)
- **Backend**: FastAPI + MongoDB (motor), all routes `/api/*`
- **Frontend**: React (CRA), dark cinema theme (Outfit / Manrope / JetBrains Mono)
- **Auth**: JWT (HS256) via Bearer header. Three roles: `super_admin`, `owner`, `staff`
- **Multi-tenancy**: `multiplexes` collection + `multiplex_id` scoping on `menu` and `orders`
- **Tokens** stored per-role in `localStorage` under `cinebites_auth_<role>`

## User Personas
1. **Super Admin (Platform seller)** — you. Creates/deletes multiplexes, assigns owner creds, sees GMV.
2. **Multiplex Owner** — unique email + password. Scoped to their multiplex. Sees sales, orders, menu.
3. **Staff** — shared PIN per multiplex. Manages kitchen order statuses only.
4. **Moviegoer** — scans QR, orders to their seat with optional special instructions.

## Route Map
| URL | Purpose | Access |
|---|---|---|
| `/` | Landing + login CTAs + demo seat picker | Public |
| `/super-admin/login` / `/super-admin` | Platform console | super_admin |
| `/owner/login` / `/owner` | Multiplex owner (Sales / Orders / Menu tabs) | owner |
| `/m/:slug/order?screen&seat` | Customer landing from QR | Public |
| `/m/:slug/menu, /cart, /payment, /confirmation/:id` | Customer flow | Public |
| `/m/:slug/staff` | Kitchen console (PIN gate) | staff |

## Key Features Shipped
- [x] Multi-tenant core: `multiplexes` collection with slug, name, logo, color, staff_pin, owner login
- [x] JWT auth with 3 roles + per-role token storage (bcrypt password hashing)
- [x] Super-admin dashboard: create / delete multiplexes + GMV stats
- [x] Owner dashboard: Sales (today/week/lifetime, top items, status breakdown) + Orders + Menu tabs
- [x] Staff console with PIN gate + live order polling
- [x] Customer flow scoped per multiplex (each has its own seeded menu)
- [x] **Special instructions textarea on Cart page** (500 char limit), shown on Payment, Confirmation, Orders, Staff console
- [x] Stock-aware ordering: auto-mark sold out at 0, block orders on unavailable items
- [x] Free-form categories (type any name — "Fries", "Ice Creams" etc.)
- [x] Cross-tenant isolation verified (owner of A → 403 on B)
- [x] Back-compat redirects from legacy `/order`, `/admin`, etc. → `/m/amb-cinemas/*`

## Seed Data
- Super-admin: `owner@cinebites.in` / `owner123`
- Default multiplex: AMB Cinemas (`amb-cinemas`), owner `manager@amb.in` / `amb123`, PIN `1234`
- 12 default menu items per newly-created multiplex

## Not Yet Done (Backlog P0 → P2)
- P0: Bulk seat QR PDF export per multiplex (print-ready)
- P1: Staff permissions vs owner permissions (currently staff can also change status via owner endpoint)
- P1: Multiplex branding applied to customer pages (logo + primary color)
- P1: Forgot password / change password flows for owners
- P2: Subscription billing (Stripe/Razorpay) — charge platform fee per multiplex
- P2: Multiple screens + seat-map config per multiplex
- P2: Push / sound alerts for new orders in staff console
- P2: Customer phone number (optional) for SMS notifications
