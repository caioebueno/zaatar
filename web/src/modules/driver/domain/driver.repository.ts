import type {
  CreateDriverInput,
  Driver,
  UpdateDriverPriorityInput,
} from "./driver.types";

export interface DriverRepository {
  create(data: CreateDriverInput): Promise<Driver>;
  list(): Promise<Driver[]>;
  updatePriority(data: UpdateDriverPriorityInput): Promise<Driver>;
}
