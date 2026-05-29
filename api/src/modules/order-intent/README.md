# Order Intent API

## Endpoint

`POST /order-intents/upsert`

- Auth: not required.
- Purpose: create or edit a customer's order intent draft in one call.
- Rule enforced: a customer can have **at most one active order intent**.

## Request Body

```json
{
  "id": "optional-existing-order-intent-id",
  "branchId": "required-only-when-deliveryAddress-is-provided",
  "customerName": "optional-name-used-to-create-customer-when-phone-is-not-found",
  "customerPhone": "required-when-id-is-not-provided",
  "active": true,
  "language": "en",
  "status": "ACCEPTED",
  "type": "DELIVERY",
  "paymentMethod": "CARD",
  "paymentProvider": "STRIPE",
  "tipAmount": 0,
  "tags": ["chat", "ai"],
  "progressiveDiscountSnapshot": {},
  "amount": 3200,
  "deliveryAddressId": "optional-existing-delivery-address-id",
  "deliveryAddress": "7480 Brooklyn Drive, Kissimmee, FL 34747",
  "orderProducts": [
    {
      "id": "optional-line-item-id",
      "productId": "product-id",
      "quantity": 1,
      "comments": "no onions",
      "fullAmount": 2000,
      "amount": 1800,
      "modifierGroupItemIds": ["modifier-item-id-1", "modifier-item-id-2"]
    }
  ]
}
```

## Behavior

- If `id` is provided:
  - updates that order intent by id.
- If `id` is not provided:
  - updates the current active order intent for the customer when one exists;
  - otherwise creates a new order intent.
- If `customerPhone` does not match an existing customer:
  - API creates a customer when `customerName` is provided;
  - otherwise returns `Customer not found`.
- If resulting intent is `active=true`:
  - all other intents for that customer are set to `active=false`.
- If `deliveryAddress` is provided:
  - API searches existing customer delivery address by description.
  - If not found, API geocodes and creates a delivery address automatically.
- If `deliveryAddressId` is provided:
  - API validates and uses this address id directly.
  - API skips `deliveryAddress` search/geocoding.
- If `orderProducts` is provided:
  - replaces all existing order intent products with the provided list.

## Responses

### `200 OK`

Returns the saved order intent, including line items and `modifierGroupItemIds`.

### `400 Bad Request`

```json
{ "error": "Invalid payload", "field": "customerPhone" }
```

or

```json
{
  "error": "Invalid payload",
  "field": "deliveryAddress",
  "reason": "DELIVERY_ADDRESS_NOT_FOUND_OR_UNSUPPORTED"
}
```

### `404 Not Found`

```json
{ "error": "Customer not found" }
```

or

```json
{ "error": "Order intent not found" }
```

or

```json
{ "error": "Branch not found" }
```
