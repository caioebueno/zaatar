# Entity: Business

## General Schema

```ts
type Business = {
  id: string;
  name: string;
  logoUrl?: string | null;
  ownerUserId: string;
  branches: Branch[];
  settings?: BusinessSettings;
};
```

## APIs

- `POST /businesses`
- `GET /businesses`
- `GET /businesses/current`
- `GET /businesses/current/settings`
- `PATCH /businesses/current/settings`
- `GET /public/order-link/settings` (public)

## Update Fields

`PATCH /businesses/current/settings` currently supports:

- `name`
- `brandColor`
- `logoUrl`
- `bannerPhotoUrl`

Note: the UI label "header image" maps to `bannerPhotoUrl` in the API.

## Detailed Docs

- [business.md](../business.md)
