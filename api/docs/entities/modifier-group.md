# Entity: Modifier Group

## General Schema

```ts
type ModifierGroup = {
  id: string;
  title: string;
  type: "SINGLE" | "MULTI" | string;
  required: boolean;
  min?: number | null;
  max?: number | null;
  items: ModifierGroupItem[];
};

type ModifierGroupItem = {
  id: string;
  name: string;
  price: number;
  active?: boolean;
};
```

## APIs

- `POST /modifier-groups`
- `PATCH /modifier-groups/:modifierGroupId`
- `DELETE /modifier-groups/:modifierGroupId`
- `POST /modifier-group-items`
- `PATCH /modifier-group-items/:itemId`
- `DELETE /modifier-group-items/:itemId`

## Detailed Docs

- [catalog.md](../catalog.md)
