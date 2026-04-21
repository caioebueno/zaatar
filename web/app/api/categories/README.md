# Categories API

## Endpoint

`GET /api/categories`

Returns categories with nested products, ordered by:

1. category `menuIndex` (ascending, `null` last)
2. category `createdAt` (ascending)
3. product `categoryIndex` (ascending, `null` last)
4. product `createdAt` (ascending)

## Response

Schema:

```json
[
  {
    "id": "string",
    "title": "string",
    "menuIndex": "number | null",
    "translations": {
      "<language>": {
        "<key>": "string"
      }
    },
    "products": [
      {
        "id": "string",
        "name": "string",
        "description": "string | null",
        "price": "number | null",
        "categoryIndex": "number | null",
        "comparedAtPrice": "number | null",
        "translations": {
          "<language>": {
            "<key>": "string"
          }
        },
        "photos": [
          {
            "id": "string",
            "url": "string"
          }
        ],
        "modifierGroups": [
          {
            "id": "string",
            "title": "string",
            "translations": {
              "<language>": {
                "<key>": "string"
              }
            },
            "required": "boolean",
            "type": "\"SINGLE\" | \"MULTI\" | null",
            "minSelection": "number | null",
            "maxSelection": "number | null",
            "items": [
              {
                "id": "string",
                "name": "string",
                "description": "string | null",
                "price": "number",
                "translations": {
                  "<language>": {
                    "<key>": "string"
                  }
                },
                "photo": {
                  "id": "string",
                  "url": "string"
                }
              }
            ]
          }
        ]
      }
    ]
  }
]
```

Success:

```json
[
  {
    "id": "category-id",
    "title": "Pizzas",
    "menuIndex": 0,
    "translations": {
      "en": {
        "title": "Pizzas"
      }
    },
    "products": [
      {
        "id": "product-id",
        "name": "Mozzarella Pizza",
        "description": "Tomato sauce and mozzarella",
        "price": 2199,
        "comparedAtPrice": null,
        "categoryIndex": 0,
        "translations": {
          "en": {
            "title": "Mozzarella Pizza"
          }
        },
        "photos": [
          {
            "id": "file-id",
            "url": "https://cdn.example.com/products/mozzarella.png"
          }
        ],
        "modifierGroups": []
      }
    ]
  }
]
```

Server error:

```json
{
  "error": "Internal Server Error"
}
```
