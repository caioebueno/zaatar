# Foody API — Documentation Index

Base URL (local): `http://localhost:4000`

All responses are JSON. All protected routes require an `Authorization: Bearer <token>` header (or cookie fallback for manager routes). See [authentication.md](./authentication.md) for details.

## Health

`GET /health` — Returns service status. No auth required.

```json
{ "service": "foody-api", "status": "ok", "timestamp": "2026-05-19T00:00:00.000Z" }
```

## Docs

| File | Topics |
|---|---|
| [authentication.md](./authentication.md) | How manager and driver tokens work, business context resolution |
| [owner.md](./owner.md) | Owner registration, email/password login, OTP auth |
| [business.md](./business.md) | Businesses, branches, onboarding, business settings |
| [catalog.md](./catalog.md) | Products, menus, categories, modifier groups, media upload, customers, address search |
| [categories.md](./categories.md) | Full `/categories` request/response schemas (list/create/update/detach) |
| [customers.md](./customers.md) | Full customer APIs (`/customers`, `/customers/search`, `/customers/:customerId/addresses`) |
| [progressive-discount.md](./progressive-discount.md) | Full `/progressive-discount` schema, selection behavior, and examples |
| [address-search.md](./address-search.md) | Full `/address-search` schema, behavior, and examples |
| [orders.md](./orders.md) | List/get/create/update orders, orders by station |
| [dispatch.md](./dispatch.md) | Dispatch management (manager), driver dispatch flow |
| [dispatch-route.md](./dispatch-route.md) | GPS route tracking, route sessions, route history |
| [driver.md](./driver.md) | Driver CRUD, OTP auth, driver self-management |
| [analytics.md](./analytics.md) | Sales analytics (revenue, ticket, orders, daily charts) |
| [stations.md](./stations.md) | Stations, preparation steps, preparation tasks |
| [integrations.md](./integrations.md) | Stripe Connect onboarding, Uber Eats OAuth and menu sync |
| [chatwoot.md](./chatwoot.md) | Owner-authenticated Chatwoot proxy routes |
| [chatwoot-webhook.md](./chatwoot-webhook.md) | Chatwoot webhook ingest and iOS push notification delivery |
| [chatwoot-websocket.md](./chatwoot-websocket.md) | Realtime architecture and event contract for chat list/messages |
| [feedback.md](./feedback.md) | Customer feedback listing |

## Auth Summary

| Auth type | Token source | Used by |
|---|---|---|
| Manager | `POST /owners/login` or `POST /owners/auth/otp/verify` | All `requiresAuth` routes |
| Driver | `POST /drivers/auth/otp/verify` | All `requiresDriverAuth` routes |
| None | — | Public routes (`/health`, `/public/order-link/settings`, OTP send/verify endpoints) |
