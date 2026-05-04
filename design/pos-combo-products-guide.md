# POS Combo Products Integration Guide

## 1. Goal
Implement combo products in your POS app using the existing Foody backend.

A combo product is a product where `itemType = "COMBO"` and the customer must pick options from `comboSlots`.

## 2. Core Data Model
A combo product contains:

- `id`
- `itemType` (`"COMBO"`)
- `name`
- `price` (base combo price)
- `comboSlots[]`

Each `comboSlot` contains:

- `id`
- `name`
- `translations` (optional JSON, including `es`/`pt` titles)
- `minSelect`
- `maxSelect`
- `allowDuplicates`
- `options[]`

Each slot option contains:

- `productId`
- `productName`
- `productTranslations` (optional)
- `extraPrice` (in cents)

## 3. POS Read APIs
### 3.1 Products/Menu data
Use your existing menu/products endpoint flow (the one your POS already uses) and read combo fields from each product.

Combo-ready product payload should include:

- `itemType`
- `comboSlots`
- `comboSlots[].translations`
- `comboSlots[].options[].extraPrice`

### 3.2 Exclusive promotions for POS
Use:

- `GET /api/pos/exclusive-promotions`

Useful query params:

- `onlyAvailable=true|false` (default `true`)
- `at=<ISO datetime>`
- `timezone=<IANA timezone>`

This endpoint returns:

- `availableNow`
- `productIds`
- `products[]` with item/pricing/translation/photo data

## 4. Dashboard APIs for Combo Setup
### 4.1 Create combo product
Use:

- `POST /api/products`

Important fields:

- `itemType: "COMBO"`
- `comboSlots: [{ name, translations, minSelect, maxSelect, allowDuplicates, sortIndex, options[] }]`

### 4.2 Update combo product
Use:

- `PATCH /api/products/:productId`

Send the full `comboSlots` structure when updating slot names/translations/options.

## 5. POS UI Behavior
For each combo product:

1. Show combo slots in `sortIndex` order.
2. Show slot title using locale fallback:
- `slot.translations[locale].title`
- `slot.translations.en.title`
- `slot.name`
3. Open a selector modal/screen per slot.
4. Enforce `minSelect` and `maxSelect`.
5. If `allowDuplicates = false`, do not allow selecting the same option more than once.
6. Use option title fallback:
- `option.productTranslations[locale].title`
- `option.productTranslations.en.title`
- `option.productName`

## 6. Cart Payload for Combo Orders
When placing orders, use `comboSelections` per cart item.

Example:

```json
{
  "cart": {
    "items": [
      {
        "cartId": "local-1",
        "productId": "combo-product-id",
        "quantity": 1,
        "modifiers": [],
        "comboSelections": [
          {
            "slotId": "slot-1",
            "optionProductId": "pizza-margherita-id",
            "quantity": 1
          },
          {
            "slotId": "slot-2",
            "optionProductId": "pizza-pepperoni-id",
            "quantity": 1
          }
        ]
      }
    ]
  },
  "orderType": "DELIVERY",
  "paymentMethod": "CASH",
  "language": "en",
  "addressId": "address-id"
}
```

## 7. Backend Validation Rules You Must Respect
- `comboSelections` must be an array when sent.
- Every selection requires:
- `slotId` (string)
- `optionProductId` (string)
- `quantity` (integer > 0)
- For combo definitions:
- each slot must have at least one option
- `maxSelect >= minSelect`
- if `allowDuplicates = false`, `maxSelect` cannot exceed number of options

## 8. Pricing Logic in POS
Use this formula per combo cart item:

- `itemPrice = baseComboPrice + sum(selectedOption.extraPrice * selection.quantity)`
- `lineTotal = itemPrice * cartItem.quantity`

All prices are in cents.

## 9. Translation Support Scope
You can now update and consume translations for:

- Product title/description
- Combo slot title (`comboSlots[].translations`)
- Option product titles (from each option product translations)

Recommended locale fallback order:

- current locale (`es`/`pt`/`en`)
- `en`
- base non-translated name

## 10. Implementation Checklist
- Render combo slots with localized titles.
- Enforce slot selection constraints.
- Build `comboSelections` payload correctly.
- Include combo selections in order submit.
- Display combo selections in cart/order summary.
- Pull exclusive promotions from `/api/pos/exclusive-promotions`.
- Filter/show promotion products based on `availableNow`.
- Validate final price matches backend behavior.
