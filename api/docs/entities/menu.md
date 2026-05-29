# Entity: Menu

## General Schema

```ts
type Menu = {
  id: string;
  name: string;
  isDefault?: boolean;
  sectionOrder?: string[];
};
```

## APIs

- `GET /menus`
- `POST /menus`
- `PATCH /menus/:menuId`

## Detailed Docs

- [catalog.md](../catalog.md)
