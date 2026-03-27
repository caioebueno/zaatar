import prisma from "../prisma";

type CustomerLite = {
  id: string;
  phone: string | null;
  createdAt: Date;
  _count: { promotionalMessages: number };
};

export async function dedupeCustomersByPhone({
  dryRun = true,
  batchPhones = 200,
}: {
  dryRun?: boolean;
  batchPhones?: number;
} = {}) {
  // 1) find duplicated phone numbers (ignore null/empty)
  const dupPhones = await prisma.customer.groupBy({
    by: ["phone"],
    where: {
      phone: { not: null },
      NOT: { phone: "" },
    },
    _count: { _all: true },
    having: {
      phone: { _count: { gt: 1 } },
    },
  });

  const phones = dupPhones
    .map((x) => x.phone)
    .filter((p): p is string => typeof p === "string" && p.length > 0);

  console.log(`Found ${phones.length} duplicated phone numbers.`);

  // process in chunks to avoid giant IN queries
  for (let i = 0; i < phones.length; i += batchPhones) {
    const chunk = phones.slice(i, i + batchPhones);

    const customers = await prisma.customer.findMany({
      where: { phone: { in: chunk } },
      select: {
        id: true,
        phone: true,
        createdAt: true,
        _count: { select: { promotionalMessages: true } },
      },
      orderBy: [{ phone: "asc" }, { createdAt: "asc" }],
    });

    // group by phone
    const byPhone = new Map<string, CustomerLite[]>();
    for (const c of customers as CustomerLite[]) {
      if (!c.phone) continue;
      const arr = byPhone.get(c.phone) ?? [];
      arr.push(c);
      byPhone.set(c.phone, arr);
    }

    for (const [phone, group] of byPhone.entries()) {
      if (group.length < 2) continue;

      // 2) decide who to keep
      const withPromo = group.filter((c) => c._count.promotionalMessages > 0);

      let keep: CustomerLite;

      if (withPromo.length === 1) {
        // your main rule: keep the one that has promo messages
        keep = withPromo[0];
      } else {
        // fallback rule (customize if you want):
        // keep oldest createdAt (first one because group ordered asc by createdAt)
        keep = group[0];
      }

      const toDelete = group.filter((c) => c.id !== keep.id);

      console.log(
        `[${phone}] keep=${keep.id} (promo=${keep._count.promotionalMessages}) delete=${toDelete
          .map((x) => x.id)
          .join(", ")}`,
      );

      if (dryRun) continue;

      // 3) delete in a transaction (children first)
      //
      await prisma.$transaction(async (tx) => {
        for (const del of toDelete) {
          // Delete child rows first to avoid FK constraint errors
          await tx.promotialMessage.deleteMany({
            where: { customerId: del.id },
          });

          await tx.order.deleteMany({
            where: { customerId: del.id },
          });

          await tx.customer.delete({
            where: { id: del.id },
          });
        }
      });
    }
  }
  return { duplicatedPhones: phones.length, dryRun };
}

// Example run:
// (async () => {
//   await dedupeCustomersByPhone({ dryRun: true });  // preview
//   // await dedupeCustomersByPhone({ dryRun: false }); // actually delete
//   await prisma.$disconnect();
// })();
