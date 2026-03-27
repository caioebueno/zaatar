import prisma from "../../prisma";

const MAX_ORDERS = 6;

const clientOrderCount = async () => {
  const customers = await prisma.customer.findMany({
    select: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  });

  const counts: Record<string, number> = {};

  for (const customer of customers) {
    const orderCount = customer._count.orders;

    const key =
      orderCount >= MAX_ORDERS ? `${MAX_ORDERS}+` : String(orderCount);

    counts[key] = (counts[key] || 0) + 1;
  }

  const result = [];

  // 0 → 5
  for (let i = 0; i < MAX_ORDERS; i++) {
    result.push({
      orders: String(i),
      clients: counts[String(i)] || 0,
    });
  }

  // 6+
  result.push({
    orders: `${MAX_ORDERS}+`,
    clients: counts[`${MAX_ORDERS}+`] || 0,
  });

  return result;
};

export default clientOrderCount;
