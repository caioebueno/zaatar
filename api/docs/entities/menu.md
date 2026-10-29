# Entity: Menu

## General Schema

```ts
type Menu = {
  id: string;
  name: string;
  isDefault?: boolean;
  /** Progressive discount this menu runs; null = none. */
  progressiveDiscountId?: string | null;
  sectionOrder?: string[];
};
```

## APIs

- `GET /menus`
- `POST /menus`
- `PATCH /menus/:menuId`

## Detailed Docs

- [catalog.md](../catalog.md)
