import prisma from "../../../../prisma.js";
import type {
  CreatePaymentInput,
  OrderPayment,
  PaymentsRepository,
  UpdatePaymentInput,
} from "../../application/ports/PaymentsRepository.js";

function toPayment(row: {
  id: string;
  createdAt: Date;
  orderId: string;
  amount: number;
  paymentType: string;
  paymentProvider: string | null;
  externalId: string | null;
  paidAt: Date | null;
}): OrderPayment {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    orderId: row.orderId,
    amount: row.amount,
    paymentType: row.paymentType,
    paymentProvider: row.paymentProvider,
    externalId: row.externalId,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
  };
}

export class PrismaPaymentsRepository implements PaymentsRepository {
  async listByOrderId(orderId: string): Promise<OrderPayment[]> {
    const rows = await prisma.orderPayment.findMany({
      where: { orderId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return rows.map(toPayment);
  }

  async create(input: CreatePaymentInput): Promise<OrderPayment> {
    const row = await prisma.orderPayment.create({
      data: {
        id: input.id,
        orderId: input.orderId,
        amount: input.amount,
        paymentType: input.paymentType as never,
        paymentProvider: (input.paymentProvider as never) ?? null,
        externalId: input.externalId ?? null,
        paidAt: input.paidAt ? new Date(input.paidAt) : null,
      },
    });
    return toPayment(row);
  }

  async update(input: UpdatePaymentInput): Promise<OrderPayment | null> {
    try {
      const row = await prisma.orderPayment.update({
        where: { id: input.id },
        data: {
          ...(input.amount !== undefined && { amount: input.amount }),
          ...(input.paymentType !== undefined && {
            paymentType: input.paymentType as never,
          }),
          ...(input.paymentProvider !== undefined && {
            paymentProvider: (input.paymentProvider as never) ?? null,
          }),
          ...(input.externalId !== undefined && { externalId: input.externalId }),
          ...(input.paidAt !== undefined && {
            paidAt: input.paidAt ? new Date(input.paidAt) : null,
          }),
        },
      });
      return toPayment(row);
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.orderPayment.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
