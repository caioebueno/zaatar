# Business API (API Project)

Base URL (local): `http://localhost:4000`

## List Owned Businesses (Manager Auth)

Endpoint:

`GET /businesses`

Description:

- Returns businesses owned by the authenticated manager/owner user.
- Uses the manager access token (`Authorization: Bearer ...`) to identify the user.
- Response includes:
  - `items`: list of owned businesses
  - `selectedBusinessId`: first business id in ownership order, or `null` if no businesses

Authentication:

- Requires manager owner access token:
  - `Authorization: Bearer <manager-access-token>`

Example request:

```bash
curl -X GET "http://localhost:4000/businesses" \
  -H "Authorization: Bearer <manager-access-token>"
```

Success (`200`):

```json
{
  "selectedBusinessId": "9f6a63f6-149f-4b5f-94cb-b4a875f94304",
  "items": [
    {
      "id": "9f6a63f6-149f-4b5f-94cb-b4a875f94304",
      "name": "Zaatar Grill",
      "logoUrl": "https://.../logo.png"
    },
    {
      "id": "a51646f8-47ba-4be0-9af5-0074c8715f2a",
      "name": "Zaatar Pizza Downtown",
      "logoUrl": null
    }
  ]
}
```

Common errors:

- `401`: unauthorized (missing/invalid manager token)

## Get Current Business (Manager Auth)

Endpoint:

`GET /businesses/current`

Description:

- Returns the active business context resolved by the API auth context.
- Includes the business profile and all its branches.
- Branches include operation hours and address metadata.

Authentication:

- Requires manager owner access token:
  - `Authorization: Bearer <manager-access-token>`

Business context selection:

- Uses the API standard business-context resolver:
  - `x-business-id` header, or
  - `businessId` query param, or
  - `manager_business_id` cookie, or
  - first owned business fallback

Success (`200`):

```json
{
  "id": "9f6a63f6-149f-4b5f-94cb-b4a875f94304",
  "createdAt": "2026-05-18T11:45:12.000Z",
  "name": "Zaatar Grill",
  "logoUrl": "https://.../logo.png",
  "bannerPhotoUrl": "https://.../banner.png",
  "brandColor": "#0f766e",
  "branches": [
    {
      "id": "branch-id-1",
      "createdAt": "2026-05-18T12:01:00.000Z",
      "name": "Downtown",
      "operationHours": {
        "MONDAY": [
          { "open": "09:00", "close": "18:00" }
        ]
      },
      "address": {
        "description": "Main branch",
        "googleMapsUrl": "https://maps.google.com/?q=...",
        "placeId": "ChIJ...",
        "lat": 27.9506,
        "lng": -82.4572,
        "street": "Main St",
        "number": "1200",
        "city": "Tampa",
        "state": "FL",
        "zipCode": "33602",
        "complement": null,
        "numberComplement": null
      }
    }
  ]
}
```

Response schema:

```ts
type GetCurrentBusinessResponse = {
  id: string;
  createdAt: string; // ISO datetime
  name: string;
  logoUrl: string | null;
  bannerPhotoUrl: string | null;
  brandColor: string;
  branches: Array<{
    id: string;
    createdAt: string; // ISO datetime
    name: string;
    operationHours: unknown;
    address: {
      description: string;
      googleMapsUrl: string;
      placeId: string | null;
      lat: number | null;
      lng: number | null;
      street: string | null;
      number: string | null;
      city: string | null;
      state: string | null;
      zipCode: string | null;
      complement: string | null;
      numberComplement: string | null;
    } | null;
  }>;
};
```

Common errors:

- `400`: missing business context (`field: "businessId", reason: "BUSINESS_CONTEXT_REQUIRED"`)
- `404`: business not found
- `401`: unauthorized (missing/invalid manager token)
