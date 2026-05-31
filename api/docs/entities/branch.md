# Entity: Branch

## General Schema

```ts
type Branch = {
  id: string;
  businessId: string;
  name: string;
  workingHours?: unknown;
  address?: unknown;
  chatwootAccountId?: string | null;
  chatwootSourceId?: string | null;
  chatwootAgentId?: string | null;
};
```

## APIs

- `POST /businesses/current/branches`
- `POST /businesses/current/onboarding/branches`
- `PATCH /businesses/current/onboarding/branches/:branchId`
- `DELETE /businesses/current/onboarding/branches/:branchId`

## Detailed Docs

- [business.md](../business.md)
