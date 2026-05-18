# API

TypeScript server project for migrating Foody APIs.

This project uses the shared Prisma schema/migrations from:

- `../packages/database/prisma/schema.prisma`
- `../packages/database/prisma/migrations`

Prisma client generation currently targets:

- `../web/src/generated/prisma`

## Architecture

This API now follows a clean-architecture style split:

- `src/modules/*/application`: use cases, ports, application errors
- `src/modules/*/infrastructure`: Prisma repositories, crypto, id generators
- `src/modules/*/presentation`: HTTP controllers and response mapping
- `src/modules/*/main`: dependency wiring/composition
- `src/shared/http`: transport-agnostic HTTP helpers/types
- `src/index.ts`: thin HTTP adapter + route binding

## Scripts

- `npm run dev`: run in watch mode with `tsx`
- `npm run build`: compile TypeScript to `dist`
- `npm run start`: run compiled server
- `npm run typecheck`: run TypeScript checks
- `npm run prisma:generate`: generate Prisma client using shared schema

## Routes

- `GET /health`
- `POST /owners`
- `POST /owners/register`
- `POST /owners/login`
- `GET /dispatches` (auth required)
- `PATCH /dispatches/:dispatchId` (auth required)
- `POST /drivers/location` (driver auth required)
- `GET /orders` (auth required)
- `GET /orders/:orderId` (auth required)
- `PATCH /orders/:orderId` (auth required)
- `PATCH /drivers/orders/:orderId` (driver auth required)
- `GET /products` (auth required)
- `POST /products` (auth required)
- `PATCH /products/:productId` (auth required)
- `GET /menus` (auth required)
- `POST /menus` (auth required)
- `PATCH /menus/:menuId` (auth required)
- `GET /businesses/current/onboarding` (auth required)
- `PATCH /businesses/current/onboarding` (auth required)
- `POST /businesses/current/onboarding/branches` (auth required)
- `PATCH /businesses/current/onboarding/branches/:branchId` (auth required)
- `DELETE /businesses/current/onboarding/branches/:branchId` (auth required)
- `POST /integrations/stripe/connect/onboarding-link` (auth required)
- `GET /integrations/stripe/connect/status` (auth required)

`POST /owners` and `POST /owners/register` accept:

```json
{
  "name": "Owner Name",
  "email": "owner@example.com",
  "password": "password123"
}
```

Responses:

- `201`: owner created
- `400`: invalid payload/json
- `409`: email already registered

`POST /owners/login` accepts:

```json
{
  "email": "owner@example.com",
  "password": "password123"
}
```

Responses:

- `200`: access token issued
- `400`: invalid payload/json
- `401`: invalid credentials

## Auth Environment Variables

- `MANAGER_ACCESS_TOKEN_SECRET`: required in production to sign access tokens
- `MANAGER_ACCESS_TOKEN_TTL_DAYS`: optional, defaults to `90`
- `DEV`: set to `1` to log incoming request bodies (development only)

## Stripe Connect Environment Variables

- `STRIPE_SECRET_KEY`: required for Stripe onboarding link generation
- `ORDER_LINK_BASE_URL` (optional): base URL used in onboarding payload order link

## Legacy Web API Gateway

Product/menu routes are forwarded to the existing web API for full behavior parity.

- `WEB_API_BASE_URL`: base URL for web app (default `http://localhost:3000`)

Authentication for protected routes can be provided with:

- `Authorization: Bearer <accessToken>` header, or
- `manager_access_token` cookie
