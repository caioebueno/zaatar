export type DispatchRouteSessionStatus = "ACTIVE" | "COMPLETED" | "CANCELED";
export type DispatchRoutePointSource = "GPS" | "NETWORK" | "MANUAL";
export type DispatchRouteMilestoneType =
  | "LEFT_PIZZERIA"
  | "LEFT_DROPOFF"
  | "ARRIVED_RESTAURANT";

export type DispatchRouteSessionRecord = {
  createdAt: Date;
  dispatchId: string;
  driverId: string;
  durationSeconds: number | null;
  endedAt: Date | null;
  id: string;
  polyline: string | null;
  startedAt: Date;
  status: DispatchRouteSessionStatus;
  totalDistanceMeters: number | null;
  updatedAt: Date;
};

export type DispatchRoutePointRecord = {
  accuracyMeters: number | null;
  altitudeMeters: number | null;
  createdAt: Date;
  headingDegrees: number | null;
  id: string;
  isMocked: boolean | null;
  lat: number;
  lng: number;
  recordedAt: Date;
  sequence: number;
  sessionId: string;
  source: DispatchRoutePointSource;
  speedMps: number | null;
};

export type CreateDispatchRouteSessionInput = {
  dispatchId: string;
  driverId: string;
  startedAt: Date;
};

export type InsertDispatchRoutePointInput = {
  accuracyMeters: number | null;
  altitudeMeters: number | null;
  headingDegrees: number | null;
  isMocked: boolean | null;
  lat: number;
  lng: number;
  recordedAt: Date;
  source: DispatchRoutePointSource;
  speedMps: number | null;
};

export type CompleteDispatchRouteSessionInput = {
  durationSeconds: number;
  endedAt: Date;
  sessionId: string;
  totalDistanceMeters: number;
};

export type DispatchRouteSessionWithPoints = DispatchRouteSessionRecord & {
  points: DispatchRoutePointRecord[];
};

export type CreateDispatchRouteMilestoneInput = {
  dispatchId: string;
  driverId: string;
  lat: number;
  lng: number;
  recordedAt: Date;
  sessionId: string;
  type: DispatchRouteMilestoneType;
};

export type MarkOrderDropOffMilestoneInput = {
  lat: number;
  lng: number;
  orderId: string;
  recordedAt: Date;
};

export type MarkDispatchArrivalMilestoneInput = {
  dispatchId: string;
  lat: number;
  lng: number;
  recordedAt: Date;
};

export type DispatchRouteRepository = {
  completeSession(
    input: CompleteDispatchRouteSessionInput,
  ): Promise<DispatchRouteSessionRecord | null>;
  createSession(
    input: CreateDispatchRouteSessionInput,
  ): Promise<DispatchRouteSessionRecord>;
  driverOwnsDispatch(dispatchId: string, driverId: string): Promise<boolean>;
  findActiveDispatchIdForDriver(driverId: string): Promise<string | null>;
  findActiveSession(
    dispatchId: string,
    driverId: string,
  ): Promise<DispatchRouteSessionRecord | null>;
  findSessionForDriver(
    sessionId: string,
    dispatchId: string,
    driverId: string,
  ): Promise<DispatchRouteSessionRecord | null>;
  enqueueEtaRecalculation(dispatchId: string): Promise<void>;
  insertPointsBatch(
    sessionId: string,
    points: InsertDispatchRoutePointInput[],
  ): Promise<{ insertedCount: number; lastSequence: number }>;
  listRecentPointsBySessionId(
    sessionId: string,
    limit: number,
  ): Promise<DispatchRoutePointRecord[]>;
  listPointsBySessionId(sessionId: string): Promise<DispatchRoutePointRecord[]>;
  listSessionsByDispatchId(dispatchId: string): Promise<DispatchRouteSessionWithPoints[]>;
  findDispatchOriginCoordinates(
    dispatchId: string,
  ): Promise<{ lat: number; lng: number } | null>;
  findNextDropOffOrderTarget(
    dispatchId: string,
  ): Promise<{ lat: number; lng: number; orderId: string } | null>;
  markOrderLeftDropOffIfMissing(input: MarkOrderDropOffMilestoneInput): Promise<boolean>;
  markDispatchArrivedAtRestaurantIfMissing(
    input: MarkDispatchArrivalMilestoneInput,
  ): Promise<boolean>;
  createMilestoneIfMissing(input: CreateDispatchRouteMilestoneInput): Promise<boolean>;
  hasMilestone(dispatchId: string, type: DispatchRouteMilestoneType): Promise<boolean>;
};
