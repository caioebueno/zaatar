export type Driver = {
  id: string;
  createdAt: string;
  name: string;
  active: boolean;
  priorityLevel: number;
};

export type CreateDriverInput = {
  name: string;
  active?: boolean;
  priorityLevel: number;
};

export type UpdateDriverPriorityInput = {
  driverId: string;
  priorityLevel: number;
};
