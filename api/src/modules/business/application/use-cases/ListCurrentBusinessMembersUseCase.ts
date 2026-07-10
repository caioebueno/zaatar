import { BusinessContextRequiredError } from "../errors/BusinessContextRequiredError.js";
import type { BusinessRepository } from "../ports/BusinessRepository.js";

export type ListCurrentBusinessMembersInput = {
  businessId?: string | null;
};

export type ListCurrentBusinessMembersOutput = {
  items: Array<{
    createdAt: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    status: string;
    userId: string;
  }>;
};

export class ListCurrentBusinessMembersUseCase {
  constructor(private readonly repository: BusinessRepository) {}

  async execute(
    input: ListCurrentBusinessMembersInput,
  ): Promise<ListCurrentBusinessMembersOutput> {
    const businessId = input.businessId?.trim();
    if (!businessId) {
      throw new BusinessContextRequiredError();
    }

    const members = await this.repository.listBusinessMembers(businessId);
    return {
      items: members.map((member) => ({
        createdAt: member.createdAt.toISOString(),
        email: member.email,
        name: member.name,
        phone: member.phone,
        role: member.role,
        status: member.status,
        userId: member.userId,
      })),
    };
  }
}
