# @foody/database

Shared Prisma schema and migrations for Foody projects.

## Prisma schema

- `prisma/schema.prisma`
- `prisma/migrations/*`

## Typical usage

- Web generate: `npm --prefix web run prisma:generate`
- API generate: `npm --prefix api run prisma:generate`

Current Prisma client output target:

- `web/src/generated/prisma`
