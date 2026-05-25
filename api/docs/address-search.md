# Address Search API

Base URL (local): `http://localhost:4000`

Auth: manager access token required.

---

## GET /address-search

Searches US addresses using Mapbox geocoding and returns normalized address candidates.

Query params:

- `q` (required): search text.

Behavior:

- If `q.trim().length < 3`, returns `200` with an empty array.
- Search is restricted to US (`country=us`) and `types=address`.
- Results are sorted by proximity to an internal priority coordinate.
- Maximum upstream results requested: `8`.
- If Mapbox responds non-2xx, API returns `200` with an empty array.

Success (`200`) schema:

```ts
type AddressSearchResponse = Array<{
  id: string;
  display_name: string;
  lat: number;
  lon: number;
  address: {
    house_number: string | null;
    road: string | undefined;
    city: string | undefined;
    state: string | undefined;
    postcode: string | undefined;
    country: string | undefined;
    country_code: string; // defaults to "US" when missing
  };
}>;
```

Example (`200`):

```json
[
  {
    "id": "address.123",
    "display_name": "123 Main St, Orlando, Florida 32801, United States",
    "lat": 28.5411,
    "lon": -81.379,
    "address": {
      "house_number": "123",
      "road": "Main St",
      "city": "Orlando",
      "state": "Florida",
      "postcode": "32801",
      "country": "United States",
      "country_code": "US"
    }
  }
]
```

Short query example (`200`):

```json
[]
```

Server error (`500`) when Mapbox token is not configured:

```json
{ "error": "Missing MAPBOX_TOKEN" }
```

---

## Environment

| Variable | Required | Description |
|---|---|---|
| `MAPBOX_API` | Yes | Mapbox access token used by `/address-search` |
