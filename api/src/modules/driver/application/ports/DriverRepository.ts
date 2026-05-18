export type DriverActivationEventRecord = {
  createdAt: Date;
  status: "ACTIVATED" | "DEACTIVATED";
};

export type DriverRecord = {
  active: boolean;
  activatedAt: Date | null;
  activationEvents: DriverActivationEventRecord[];
  createdAt: Date;
  deactivatedAt: Date | null;
  id: string;
  name: string;
  phone: string | null;
  priorityLevel: number;
};

export type CreateDriverInput = {
  active: boolean;
  id: string;
  name: string;
  phone: string;
  priorityLevel: number;
};

export type UpdateDriverInput = {
  active: boolean;
  id: string;
  name: string;
  phone: string | null;
  priorityLevel: number;
};

export type DriverRepository = {
  create(input: CreateDriverInput): Promise<DriverRecord>;
  deleteById(id: string): Promise<boolean>;
  findById(id: string): Promise<DriverRecord | null>;
  getMaxPriorityLevel(): Promise<number | null>;
  list(): Promise<DriverRecord[]>;
  update(input: UpdateDriverInput): Promise<DriverRecord>;
};
