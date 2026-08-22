# Entity: Branch

## General Schema

```ts
type Branch = {
  id: string;
  businessId: string;
  name: string;
  workingHours?: unknown;
  address?: unknown;
  showUpsellModalOnAddToCart: boolean;
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

## Update Fields

`PATCH /businesses/current/onboarding/branches/:branchId` currently supports branch profile updates such as:

- `name`
- `addressDescription`
- `addressGoogleMapsUrl`
- `addressStreet`
- `addressNumber`
- `addressCity`
- `addressState`
- `addressZipCode`
- `addressComplement`
- `addressNumberComplement`
- `operationHours`

Note: if the UI says "opening hours", the API field name is `operationHours`.

## Detailed Docs

- [business.md](../business.md)
