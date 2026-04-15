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

## Endpoints

- `GET /health` - health/status
- `POST /run` - trigger queue processing manually
  - if `RUN_TRIGGER_SECRET` is configured, send `Authorization: Bearer <RUN_TRIGGER_SECRET>`

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
