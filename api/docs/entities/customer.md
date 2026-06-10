# Entity: Customer

## General Schema

```ts
type Customer = {
  id: string;
  createdAt: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  addresses: DeliveryAddress[];
};

type DeliveryAddress = {
  id: string;
  createdAt: string;
  description: string;
  street: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
  lat: string;
  lng: string;
  complement: string | null;
  numberComplement: string | null;
  customerId: string | null;
  deliveryFee: number;
};
```

## APIs

- `GET /customers/search?phone=...`
- `POST /customers`
- `POST /customers/:customerId/addresses`
- `PATCH /delivery-addresses/:addressId`

## Detailed Docs

- [customers.md](../customers.md)
- [address-search.md](../address-search.md)
