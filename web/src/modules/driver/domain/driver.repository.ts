import type {
  CreateDriverInput,
  Driver,
  UpdateDriverActiveInput,
  UpdateDriverPriorityInput,
} from "./driver.types";

export interface DriverRepository {
  create(data: CreateDriverInput): Promise<Driver>;
  list(): Promise<Driver[]>;
  updateActive(data: UpdateDriverActiveInput): Promise<Driver>;
  updatePriority(data: UpdateDriverPriorityInput): Promise<Driver>;
}
