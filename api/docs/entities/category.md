# Entity: Category

## General Schema

```ts
type Category = {
  id: string;
  name: string;
  index: number;
  products?: Product[];
};
```

## APIs

- `GET /categories`
- `POST /categories`
- `PATCH /categories/:categoryId`
- `DELETE /categories/:categoryId`

## Detailed Docs

- [categories.md](../categories.md)
