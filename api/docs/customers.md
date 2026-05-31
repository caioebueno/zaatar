# Customers API

Base URL (local): `http://localhost:4000`

Auth: manager access token required.

---

## Public Customer Addresses By Phone (n8n)

`GET /public/customers/addresses`

Auth: not required.

Query params:

- `phone` (required): phone number (digits or formatted)

Behavior:

- Normalizes to digits and searches `Customer.phone` using `contains`.
- Ranks candidate customers by phone match (exact > suffix > contains).
- Returns a flat list of unique delivery addresses ordered by best phone match and newest addresses first.
- If no customer matches the phone, returns `[]` (200).

Success (`200`) schema:

```ts
type PublicCustomerAddressesResponse = Array<{
  id: string;
  createdAt: string; // ISO datetime
  description: string;
  street: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
  lat: string;
  lng: string;
  complement: string | null;
  numberComplement: string | null;
  customerId: string | null;
  deliveryFee: number;
}>;
```

Validation error (`400`):

```json
{ "error": "Invalid payload", "field": "phone" }
```

Server error (`500`):

```json
{ "error": "Internal Server Error" }
```

Example:

```bash
curl --request GET \
  --url 'http://localhost:4000/api/public/customers/addresses?phone=19297669288'
```

---

## Search Customers

`GET /customers/search`

Query params:

- `phone` (required): phone number (digits or formatted)

Behavior:

- Normalizes to digits and searches `Customer.phone` using `contains`.
- Returns up to 5 best matches (ranked by exact/suffix/contains score).
- Includes customer addresses ordered by most recent first.

Success (`200`) schema:

```ts
type SearchCustomersResponse = Array<{
  id: string;
  createdAt: string; // ISO datetime
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  addresses: Array<{
    id: string;
    createdAt: string; // ISO datetime
    description: string;
    street: string;
    number: string;
    city: string;
    state: string;
    zipCode: string;
    lat: string;
    lng: string;
    complement: string | null;
    numberComplement: string | null;
    customerId: string | null;
    deliveryFee: number;
  }>;
}>;
```

Validation error (`400`):

```json
{ "error": "Invalid payload", "field": "phone" }
```

Server error (`500`):

```json
{ "error": "Internal Server Error" }
```

---

## Create Customer

`POST /customers`

Create or update a customer by phone (upsert-by-phone behavior).

Request body schema:

```ts
type CreateCustomerBody = {
  phone: string; // required
  name?: string | null;
  email?: string | null;
  address?: string | null;
};
```

Phone normalization rules:

- Non-digit characters are removed.
- Must have at least 10 digits after normalization.
- If exactly 10 digits, API prefixes `1` (US country code).
- If 11+ digits, value is used as-is.

Upsert behavior:

- Existing customer with same normalized phone:
  - updates provided fields (`name`, `email`, `address`, and phone if needed)
  - returns `200`
- New customer:
  - creates customer
  - returns `201`

Success response schema (`200` or `201`):

```ts
type CreateCustomerResponse = {
  id: string;
  createdAt: string; // ISO datetime
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  addresses: Array<{
    id: string;
    createdAt: string; // ISO datetime
    description: string;
    street: string;
    number: string;
    city: string;
    state: string;
    zipCode: string;
    lat: string;
    lng: string;
    complement: string | null;
    numberComplement: string | null;
    customerId: string | null;
    deliveryFee: number;
  }>;
};
```

Example request:

```json
{
  "phone": "(929) 766-9288",
  "name": "John Doe",
  "email": "john@example.com"
}
```

Example success (`201`):

```json
{
  "id": "b406d9b6-eedb-4d7a-8dd2-580b656df3ec",
  "createdAt": "2026-05-24T15:32:11.102Z",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "19297669288",
  "address": null,
  "addresses": []
}
```

Validation errors (`400`):

```json
{ "error": "Invalid payload", "field": "phone" }
```

```json
{ "error": "Invalid payload", "field": "name" }
```

```json
{ "error": "Invalid payload", "field": "email" }
```

Server error (`500`):

```json
{ "error": "Internal Server Error" }
```

---

## Create Customer Address

`POST /customers/:customerId/addresses`

Attach a `DeliveryAddress` to an existing customer.

Path params:

- `customerId` (required)

Request body schema:

```ts
type CreateCustomerAddressBody = {
  description: string;
  street: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
  lat: string; // numeric string
  lng: string; // numeric string
  complement?: string | null;
  numberComplement?: string | null;
};
```

Notes:

- `deliveryFee` is calculated server-side from Mapbox route distance.
- If outside coverage radius, returns:
  - `400` `{ "error": "Address outside delivery coverage area", "reason": "OUTSIDE_DELIVERY_COVERAGE_AREA" }`

Success (`201`) schema:

```ts
type CreateCustomerAddressResponse = {
  id: string;
  createdAt: string; // ISO datetime
  description: string;
  street: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
  lat: string;
  lng: string;
  complement: string | null;
  numberComplement: string | null;
  customerId: string | null;
  deliveryFee: number;
};
```

Errors:

- `400` invalid payload
- `404` customer not found
- `500` internal server error
