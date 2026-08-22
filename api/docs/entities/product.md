# Entity: Product

## General Schema

```ts
type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  comparedAtPrice?: number | null;
  visible: boolean;
  alertDriver: boolean;
  itemType: "PRODUCT" | "COMBO";
  translations?: Record<string, unknown>;
  modifierGroups?: ModifierGroup[];
  preparationStepIds: string[];
  preparationSteps: Array<{
    id: string;
    goalMinutes: number;
  }>;
  photos?: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  photoIds?: string[];
};
```

## Image Management

Product images are updated through `PATCH /products/:productId`.

Supported request fields:

```ts
type ProductImageUpdate = {
  photoIds?: string[];
  photoUrls?: string[];
};
```

Rules:

- `photoIds` uses uploaded file ids, usually from `POST /bucket/upload`.
- `photoUrls` uses public `http` or `https` image URLs directly.
- Send only one style per request: `photoIds` or `photoUrls`.
- Both fields replace the full image list.
- To add an image, send the existing images plus the new one.
- To remove an image, send the updated array without it.
- To clear all images, send `photoIds: []` or `photoUrls: []`.

Example:

```json
{
  "photoIds": ["file_existing_1", "file_existing_2", "file_new_3"]
}
```

## APIs

- `GET /products`
- `POST /products`
- `PATCH /products/:productId`
- `POST /bucket/upload`

## Detailed Docs

- [catalog.md](../catalog.md)
