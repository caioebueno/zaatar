# Dispatch Queue Worker (Railway)

Standalone Node.js server that triggers:

- local queue-processing logic inside this worker (no imports from `web/src`)

This replaces Vercel Cron and is intended to run on Railway.

## Environment Variables

- `PORT`: HTTP port (`Railway` provides this automatically)
- `CRON_SCHEDULE`: cron expression (default: `0 0 * * *`, daily at 00:00 UTC)
- `JOBS_PER_RUN`: max queue jobs processed per run (default `10`)
- `DATABASE_URL`: PostgreSQL connection string (same database as app)
- `MAPBOX_API`: required by dispatch route-duration calculation
- `PROCESS_ON_START`: `true` to run once immediately on boot (default `false`)
- `RUN_TRIGGER_SECRET`: optional bearer token required by `POST /run`
- `EXTERNAL_ORDER_SCAN_ENABLED`: enable polling of external orders API (`false` by default)
- `EXTERNAL_ORDER_SCAN_SCHEDULE`: cron for external polling (default `* * * * *`, every minute)
- `EXTERNAL_ORDER_SCAN_ON_START`: run external scan once on boot (`false` by default)
- `EXTERNAL_ORDER_API_URL`: full external endpoint URL
- `EXTERNAL_ORDER_API_COMPANY_TOKEN`: sent as `app-company-token` header
- `EXTERNAL_ORDER_API_COOKIE`: optional cookie header for session-based auth
- `EXTERNAL_ORDER_API_AUTHORIZATION`: optional authorization header value (for example `Bearer <token>`)
- `EXTERNAL_ORDER_API_HEADERS_JSON`: optional JSON object with extra headers
- `ORDER_IMPORT_API_URL`: optional internal web route to import scanned external orders
- `ORDER_IMPORT_API_SECRET`: optional bearer token sent to `ORDER_IMPORT_API_URL`

## Endpoints

- `GET /health` - health/status
- `POST /run` - trigger queue processing manually
  - if `RUN_TRIGGER_SECRET` is configured, send `Authorization: Bearer <RUN_TRIGGER_SECRET>`

`GET /health` now also includes external polling status:

- whether polling is enabled
- schedule
- last scan timestamp and status
- count of known orders
- count of newly detected orders in last scan
- import API status and count of created orders from last import

## External API Polling

When enabled, the worker scans the configured external API every minute (or custom cron), extracts order IDs from the response, and logs when new orders appear.

Current behavior:

- first successful scan initializes a baseline (does not treat existing orders as new)
- subsequent scans detect new IDs and log them
- if `ORDER_IMPORT_API_URL` is configured, each scan sends `{ data: [...] }` to your web import route

## Local Run

```bash
cd queue-worker
npm install
cp .env.example .env
npm start
```

## Railway Deploy

1. Create a new Railway service from this repository.
2. Set the service root directory to `queue-worker`.
3. Add environment variables from `.env.example`.
4. Use the start command:
   - `npm start`
5. Use the same `DATABASE_URL` as your app so the worker processes the same queue.
6. If you want only your web app to trigger `/run`, set `RUN_TRIGGER_SECRET` here and `DISPATCH_QUEUE_RUN_SECRET` in the web app.
