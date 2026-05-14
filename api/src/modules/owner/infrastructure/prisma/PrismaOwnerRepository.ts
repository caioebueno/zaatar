import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import prisma from "../../../../prisma.js";
import { EmailAlreadyRegisteredError } from "../../application/errors/EmailAlreadyRegisteredError.js";
import type {
  CreateOwnerInput,
  OwnedBusinessRecord,
  OwnerAuthRecord,
  OwnerRecord,
  OwnerRepository,
} from "../../application/ports/OwnerRepository.js";

export class PrismaOwnerRepository implements OwnerRepository {
  async create(input: CreateOwnerInput): Promise<OwnerRecord> {
    try {
      const owner = await prisma.user.create({
        data: {
          id: input.id,
          name: input.name,
          email: input.email,
          passwordHash: input.passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      return owner;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new EmailAlreadyRegisteredError();
      }

      throw error;
    }
  }

  async findByEmailForAuth(email: string): Promise<OwnerAuthRecord | null> {
    const owner = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });

    return owner;
  }

  async findOwnedBusinesses(userId: string): Promise<OwnedBusinessRecord[]> {
    const rows = await prisma.businessOwner.findMany({
      where: { userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return rows
      .map((row) => {
        if (!row.business) return null;
        return {
          businessId: row.business.id,
          name: row.business.name,
        } satisfies OwnedBusinessRecord;
      })
      .filter((row): row is OwnedBusinessRecord => row !== null);
  }
}
