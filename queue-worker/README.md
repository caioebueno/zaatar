# Dispatch Queue Worker (Railway)

Standalone Node.js server that triggers:

- `GET /api/internal/dispatch-assignment-jobs/process`

This replaces Vercel Cron and is intended to run on Railway.

## Environment Variables

- `PORT`: HTTP port (`Railway` provides this automatically)
- `TARGET_BASE_URL`: base URL of your deployed Next app (required)
- `TARGET_PATH`: defaults to `/api/internal/dispatch-assignment-jobs/process`
- `CRON_SCHEDULE`: cron expression (default: `0 0 * * *`, daily at 00:00 UTC)
- `CRON_SECRET`: optional bearer token; must match `CRON_SECRET` in the Next app
- `PROCESS_ON_START`: `true` to run once immediately on boot (default `false`)
- `REQUEST_TIMEOUT_MS`: request timeout in milliseconds (default `60000`)

## Endpoints

- `GET /health` - health/status
- `POST /run` - trigger queue processing manually

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
5. Ensure `TARGET_BASE_URL` points to your deployed Next app URL.
6. If your Next API route is protected, set the same `CRON_SECRET` in both apps.
