# Customers API

## Endpoint

`POST /api/customers`

Creates a new customer.

Phone behavior:

- `phone` is required
- phone is normalized to digits only
- country code is enforced using `WHATSAPP_COUNTRY_CODE` (default `1`)
- if a customer with the same normalized phone already exists, it updates and returns that customer instead of creating a duplicate profile

Request body:

- `phone` (required string)
- `name` (optional string or `null`)
- `email` (optional string or `null`)
- `address` (optional string or `null`)

Create/update success (`201` for new customer, `200` for existing customer update):

```json
{
  "id": "customer-id",
  "createdAt": "2026-04-13T12:00:00.000Z",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "14075550123",
  "address": "Home address",
  "addresses": []
}
```

Validation error (`400`):

```json
{
  "error": "Invalid payload",
  "field": "phone"
}
```

`GET /api/customers/search?phone=:phone`

Searches a customer by phone number.

Phone matching behavior:

- removes non-digit characters from input
- searches possible matches (exact, ending with, or containing the number)
- also tries with/without the configured country code (`WHATSAPP_COUNTRY_CODE`, default `1`)

Returns up to 5 matching customers ordered by best match first.

## Response

Success:

```json
[
  {
    "id": "customer-id",
    "createdAt": "2026-04-13T12:00:00.000Z",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "14075550123",
    "address": null,
    "addresses": [
      {
        "id": "address-id",
        "createdAt": "2026-04-13T10:00:00.000Z",
        "description": "Home",
        "street": "Main St",
        "number": "123",
        "city": "Kissimmee",
        "state": "FL",
        "zipCode": "34747",
        "lat": "28.35",
        "lng": "-81.64",
        "complement": "Apt 4B",
        "numberComplement": "4B",
        "customerId": "customer-id",
        "deliveryFee": 420
      }
    ]
  }
]
```

Not found (`200`):

```json
[]
```

Validation error (`400`):

```json
{
  "error": "Invalid payload",
  "field": "phone"
}
```

Server error (`500`):

```json
{
  "error": "Internal Server Error"
}
```
