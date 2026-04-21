# Address Search API

## Endpoint

`GET /api/address-search?q=:query`

Searches addresses using Mapbox Geocoding and returns normalized address suggestions.

## Query Params

- `q` (required string): search text

Behavior:

- if `q` has fewer than 3 characters, returns `[]`
- searches only US addresses (`country=us`)
- returns up to 8 results
- only returns entries that include a house number
- prioritizes suggestions closer to `28.34865140234854, -81.65148804725864`

## Response

Schema:

```json
[
  {
    "id": "string",
    "display_name": "string",
    "lat": "number",
    "lon": "number",
    "address": {
      "house_number": "string | null",
      "road": "string | undefined",
      "city": "string | undefined",
      "state": "string | undefined",
      "postcode": "string | undefined",
      "country": "string | undefined",
      "country_code": "string"
    }
  }
]
```

Success:

```json
[
  {
    "id": "address.123",
    "display_name": "123 Main St, Kissimmee, Florida 34747, United States",
    "lat": 28.35,
    "lon": -81.64,
    "address": {
      "house_number": "123",
      "road": "Main St",
      "city": "Kissimmee",
      "state": "Florida",
      "postcode": "34747",
      "country": "United States",
      "country_code": "US"
    }
  }
]
```

Short query (`q` shorter than 3 chars):

```json
[]
```

Mapbox request failure:

```json
[]
```

Server configuration error (`500`):

```json
{
  "error": "Missing MAPBOX_TOKEN"
}
```
