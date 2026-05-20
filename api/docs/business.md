# Business API

Base URL (local): `http://localhost:4000`

All routes require manager auth (`Authorization: Bearer <manager-access-token>`).

---

## Businesses

### Create Business

`POST /businesses`

Request body:

```json
{
  "name": "My Restaurant"
}
```

Success (`201`): returns created business object.

### List Owned Businesses

`GET /businesses`

Returns businesses owned by the authenticated user.

Success (`200`):

```json
{
  "selectedBusinessId": "business-id",
  "items": [
    { "id": "business-id", "name": "Zaatar Grill", "logoUrl": "https://.../logo.png" },
    { "id": "business-id-2", "name": "Downtown Branch", "logoUrl": null }
  ]
}
```

### Get Current Business

`GET /businesses/current`

Returns the active business (resolved via business context) with branches.

Success (`200`):

```json
{
  "id": "business-id",
  "createdAt": "2026-05-18T11:45:12.000Z",
  "name": "Zaatar Grill",
  "logoUrl": "https://.../logo.png",
  "bannerPhotoUrl": "https://.../banner.png",
  "brandColor": "#0f766e",
  "branches": [
    {
      "id": "branch-id",
      "createdAt": "2026-05-18T12:01:00.000Z",
      "name": "Downtown",
      "operationHours": {
        "MONDAY": [{ "open": "09:00", "close": "18:00" }]
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

Errors:

- `400`: missing business context (`field: "businessId"`, `reason: "BUSINESS_CONTEXT_REQUIRED"`)
- `404`: business not found

---

## Business Settings

### Get Settings

`GET /businesses/current/settings`

Success (`200`): returns current business settings object.

### Update Settings

`PATCH /businesses/current/settings`

Request body (all fields optional):

```json
{
  "name": "New Name",
  "brandColor": "#0f766e",
  "logoUrl": "https://.../logo.png",
  "bannerPhotoUrl": "https://.../banner.png"
}
```

Success (`200`): returns updated settings object.

Errors:

- `400`: invalid payload (`field` returned)
- `400`: missing business context
- `404`: business not found

---

## Branches

### Create Branch

`POST /businesses/current/branches`

Request body:

```json
{
  "name": "East Side",
  "addressDescription": "East side location",
  "addressGoogleMapsUrl": "https://maps.google.com/...",
  "addressStreet": "Broadway",
  "addressNumber": "42",
  "addressCity": "Tampa",
  "addressState": "FL",
  "addressZipCode": "33601",
  "addressComplement": null,
  "addressNumberComplement": null,
  "operationHours": {
    "MONDAY": [{ "open": "10:00", "close": "22:00" }]
  }
}
```

Success (`201`): returns created branch object.

---

## Onboarding

### Get Onboarding Status

`GET /businesses/current/onboarding`

Returns the business onboarding status including basic info, branches, and Stripe Connect status.

Success (`200`): returns onboarding status object.

### Update Onboarding Basic Info

`PATCH /businesses/current/onboarding`

Request body (all fields optional):

```json
{
  "name": "Business Name",
  "brandColor": "#0f766e",
  "logoUrl": "https://.../logo.png",
  "bannerPhotoUrl": "https://.../banner.png"
}
```

Success (`200`): returns updated onboarding object.

### Create Onboarding Branch

`POST /businesses/current/onboarding/branches`

Request body:

```json
{
  "name": "Branch Name",
  "addressDescription": "Description",
  "addressGoogleMapsUrl": "https://maps.google.com/...",
  "mapboxPlaceId": "place.123",
  "mapboxLatitude": 27.9506,
  "mapboxLongitude": -82.4572,
  "addressStreet": "Main St",
  "addressNumber": "100",
  "addressCity": "Tampa",
  "addressState": "FL",
  "addressZipCode": "33602",
  "addressComplement": null,
  "addressNumberComplement": null,
  "operationHours": {
    "MONDAY": [{ "open": "09:00", "close": "18:00" }]
  }
}
```

Success (`201`): returns created branch object.

### Update Onboarding Branch

`PATCH /businesses/current/onboarding/branches/:branchId`

Same body as create, all fields optional.

Success (`200`): returns updated branch object.

Errors:

- `404`: branch not found

### Delete Onboarding Branch

`DELETE /businesses/current/onboarding/branches/:branchId`

Success (`204`): no content.

Errors:

- `404`: branch not found
