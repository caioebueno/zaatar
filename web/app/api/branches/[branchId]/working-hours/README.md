# Branch Working Hours API

## Endpoints

`GET /api/branches/:branchId/working-hours`

Returns the persisted working hours for a branch.

`PUT /api/branches/:branchId/working-hours`

Creates or updates the working hours for a branch.

## Working Hours Shape

```json
{
  "operationHours": {
    "monday": [{ "from": "09:00", "to": "18:00" }],
    "tuesday": [{ "from": "09:00", "to": "18:00" }],
    "wednesday": [{ "from": "09:00", "to": "18:00" }],
    "thursday": [{ "from": "09:00", "to": "18:00" }],
    "friday": [{ "from": "09:00", "to": "22:00" }],
    "saturday": [{ "from": "10:00", "to": "22:00" }],
    "sunday": []
  }
}
```

Each day must be present.

Each time range must have:

- `from`: string in hour format like `09:00`
- `to`: string in hour format like `18:00`

## GET Response

Success:

```json
{
  "branchId": "branch-id",
  "operationHours": {
    "monday": [],
    "tuesday": [],
    "wednesday": [],
    "thursday": [],
    "friday": [],
    "saturday": [],
    "sunday": []
  }
}
```

## PUT Request

Example:

```json
{
  "operationHours": {
    "monday": [{ "from": "09:00", "to": "18:00" }],
    "tuesday": [{ "from": "09:00", "to": "18:00" }],
    "wednesday": [{ "from": "09:00", "to": "18:00" }],
    "thursday": [{ "from": "09:00", "to": "18:00" }],
    "friday": [{ "from": "09:00", "to": "22:00" }],
    "saturday": [{ "from": "10:00", "to": "22:00" }],
    "sunday": []
  }
}
```

Success response:

```json
{
  "branchId": "branch-id",
  "operationHours": {
    "monday": [{ "from": "09:00", "to": "18:00" }],
    "tuesday": [{ "from": "09:00", "to": "18:00" }],
    "wednesday": [{ "from": "09:00", "to": "18:00" }],
    "thursday": [{ "from": "09:00", "to": "18:00" }],
    "friday": [{ "from": "09:00", "to": "22:00" }],
    "saturday": [{ "from": "10:00", "to": "22:00" }],
    "sunday": []
  }
}
```

Validation error:

```json
{
  "error": "Invalid operationHours payload"
}
```

Server error:

```json
{
  "error": "Internal Server Error"
}
```
