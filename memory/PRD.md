# CineBites — QR-based In-Seat Food Ordering for Cinemas

## Original Problem Statement
Build a modern web app prototype for a QR-based in-seat food ordering system for movie theaters. A QR on each seat identifies Theater/Screen/Seat. No login. Flows: scan → landing → menu → cart → mock payment → confirmation with status tracker. Plus admin/staff dashboard.

## Architecture
- **Backend**: FastAPI + MongoDB (motor). Routes under `/api`. Menu auto-seeded on startup.
- **Frontend**: React (CRA) + react-router-dom. Cart & seat state via React Context persisted in localStorage. QR codes rendered with `react-qr-code`.
- **Design**: Dark cinema theme per `/app/design_guidelines.json` — Outfit/Manrope fonts, crimson #E50914 accents, glassmorphic sticky cart, grain texture.

## User Personas
1. **Moviegoer** — scans seat QR, orders food silently during show.
2. **Staff / Kitchen** — manages incoming orders from `/admin` dashboard.

## Core Routes
- `/` — QR demo hub with 6 sample seats & live QR preview
- `/order?screen=X&seat=Y` — Seat landing (from QR scan)
- `/menu` — Menu with 4 categories + quick-add steppers + sticky cart
- `/cart` — Cart review with 5% tax + seat delivery banner
- `/payment` — Mock UPI / Card
- `/confirmation/:orderId` — Order status + live 3-step tracker (polling)
- `/admin` — Staff console: stats, filters, mark Out-for-Delivery / Delivered

## API Endpoints
- `GET /api/theater-info?screen&seat`
- `GET /api/menu` (12 seeded items)
- `POST /api/orders` → creates order, returns short_id
- `GET /api/orders` / `GET /api/orders/:id`
- `PATCH /api/orders/:id/status` → preparing | out_for_delivery | delivered

## Implemented (Feb 2026)
- [x] Full flow end-to-end (QR → seat → menu → cart → payment → confirmation)
- [x] Staff dashboard with live polling + status update buttons
- [x] 6 sample seats with unique QR code links
- [x] Dark cinema UI with Outfit/Manrope fonts, grain texture, glow CTAs
- [x] Backend tests 10/10 pass, E2E flow visually validated

## Mocked / Deferred
- Payment is **MOCKED** (900ms delay, no real gateway)
- No auth (by design)
- Admin has no password gate

## Backlog (P0 → P2)
- P1: Real payment (Stripe / Razorpay UPI)
- P1: Staff PIN lock on `/admin`
- P1: Push notifications / sound alerts for new orders
- P2: Multi-theater support, per-theater menus
- P2: Order history for moviegoer (phone-number optional)
- P2: Show-time & interval awareness (boost orders 10 min before interval)
