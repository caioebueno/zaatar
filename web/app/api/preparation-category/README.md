# Preparation Category API

## Endpoint

`PUT /api/preparation-category`

Updates a preparation category as an aggregate, including its child preparation step tracks and modifier tracks.

## Request Body

The endpoint expects the full preparation category payload as JSON.

```json
{
  "id": "category-id",
  "categoryId": "menu-category-id",
  "completed": true,
  "orderId": "order-id",
  "snoozes": [],
  "steps": [
    {
      "id": "track-id",
      "name": "Grill",
      "quantity": 1,
      "completed": true,
      "comments": "no onions",
      "completedComments": true,
      "preparationStepId": "step-id",
      "preparationStepCategoryId": "category-id",
      "preparationStepModifiers": [
        {
          "id": "modifier-track-id",
          "completed": true,
          "modifierGroupItem": "modifier-id"
        }
      ]
    }
  ]
}
```

## Behavior

- Updates the `PreparationStepCategory` record.
- Updates every child `PreparationStepTrack` included in `steps`.
- Updates every child `PreparationStepModifierTrack` included in `preparationStepModifiers`.
- Persists `completedComments` on each step track.
- Recomputes the parent `completed` flag from the child step states using `steps.every((step) => step.completed)`.

## Response

Success:

```json
{}
```

Validation error:

```json
{
  "error": "Invalid preparation category payload"
}
```

Server error:

```json
{
  "error": "Internal Server Error"
}
```
