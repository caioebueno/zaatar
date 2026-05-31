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
};
```

## APIs

- `GET /products`
- `POST /products`
- `PATCH /products/:productId`
- `POST /bucket/upload`

## Detailed Docs

- [catalog.md](../catalog.md)
