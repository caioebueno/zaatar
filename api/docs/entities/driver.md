# Entity: Driver

## General Schema

```ts
type Driver = {
  id: string;
  name: string;
  phone: string;
  active?: boolean;
  priorityLevel?: number;
  activationHistory?: Array<{
    action: "ACTIVATE" | "DEACTIVATE";
    at: string;
  }>;
};
```

## APIs

- `POST /drivers`
- `GET /drivers`
- `GET /drivers/:driverId`
- `PATCH /drivers/:driverId`
- `DELETE /drivers/:driverId`
- `PATCH /drivers/:driverId/activate`
- `PATCH /drivers/:driverId/deactivate`
- `PATCH /drivers/me/activate` (driver auth)
- `PATCH /drivers/me/deactivate` (driver auth)
- `POST /drivers/auth/otp/send`
- `POST /drivers/auth/otp/verify`

## Detailed Docs

- [driver.md](../driver.md)
