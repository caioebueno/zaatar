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
- `PATCH /modifier-group-items/:modifierGroupItemId`
- `DELETE /modifier-group-items/:modifierGroupItemId`

Delete behavior:

- `DELETE /modifier-group-items/:modifierGroupItemId` disconnects the item from its modifier group instead of hard-deleting the database row.
- This preserves historical order and preparation-step references to that modifier item.

## Detailed Docs

- [catalog.md](../catalog.md)
