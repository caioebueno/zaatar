export type StationPreparationStepItem = {
  goalMinutes: number;
  id: string;
  includeComments: boolean;
  includeModifiers: boolean;
  name: string;
};

export type StationListItem = {
  id: string;
  name: string;
  preparationSteps: StationPreparationStepItem[];
};

export type StationRepository = {
  completeOrderTracksByStation(input: {
    orderId: string;
    stationId: string;
  }): Promise<{
    completedTracks: number;
    stationCompleted: boolean;
    totalTracks: number;
  }>;
  listStations(input: { businessId: string }): Promise<StationListItem[]>;
  createStation(input: { id: string; name: string }): Promise<StationListItem>;
  updateStation(input: { id: string; name: string }): Promise<StationListItem | null>;
  deleteStation(input: { id: string }): Promise<boolean>;
  createStep(input: {
    goalMinutes: number;
    id: string;
    stationId: string;
    name: string;
    includeComments: boolean;
    includeModifiers: boolean;
  }): Promise<StationPreparationStepItem>;
  updateStep(input: {
    goalMinutes?: number;
    id: string;
    name?: string;
    includeComments?: boolean;
    includeModifiers?: boolean;
  }): Promise<StationPreparationStepItem | null>;
  deleteStep(input: { id: string }): Promise<boolean>;
};
