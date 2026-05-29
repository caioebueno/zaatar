import type { DispatchEntity } from "./DispatchRepository.js";

export type OutForDeliveryNotifier = {
  sendForDispatch(dispatch: DispatchEntity): Promise<void>;
};

