import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
export const ROUTE_TASK = 'DRIVER_LOCATION_TASK';
const CTX_KEY = 'driver_location_ctx';

const BATCH_SIZE        = 5;    // flush after this many points
const FLUSH_INTERVAL_MS = 30_000; // or after 30s, whichever comes first

type RoutePoint = {
  lat: number;
  lng: number;
  recordedAt: string;
  accuracyMeters?: number;
  speedMps?: number;
  headingDegrees?: number;
  altitudeMeters?: number;
  source: 'GPS';
  isMocked: boolean;
};

type LocationCtx = {
  token: string;
  dispatchId?: string;
  sessionId?: string;
  buffer: RoutePoint[];
  lastFlushAt: number;
};

function buildPoint(loc: Location.LocationObject): RoutePoint {
  return {
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
    recordedAt: new Date(loc.timestamp).toISOString(),
    accuracyMeters: (loc.coords.accuracy != null && loc.coords.accuracy >= 0) ? loc.coords.accuracy : undefined,
    speedMps:       (loc.coords.speed   != null && loc.coords.speed   >= 0) ? loc.coords.speed   : undefined,
    headingDegrees: (loc.coords.heading != null && loc.coords.heading >= 0) ? loc.coords.heading : undefined,
    altitudeMeters: loc.coords.altitude ?? undefined,
    source: 'GPS',
    isMocked: false,
  };
}

async function flushBuffer(ctx: LocationCtx): Promise<Partial<LocationCtx>> {
  const { token, dispatchId, sessionId, buffer } = ctx;
  if (buffer.length === 0) return {};

  try {
    if (dispatchId) {
      // Delivery active → batch endpoint
      const res = await fetch(`${BASE}/drivers/dispatches/${dispatchId}/route/points/batch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: buffer }),
      });
      console.log('[route-tracking] batch flush', buffer.length, 'points, status', res.status);
      if (res.ok) {
        const body = await res.json().catch(() => null);
        return { buffer: [], lastFlushAt: Date.now(), sessionId: body?.sessionId ?? sessionId };
      }
    } else {
      // Waiting (no dispatch) → single latest point to /drivers/location
      const latest = buffer[buffer.length - 1];
      const res = await fetch(`${BASE}/drivers/location`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(latest),
      });
      console.log('[route-tracking] location flush, status', res.status);
      if (res.ok) {
        return { buffer: [], lastFlushAt: Date.now() };
      }
    }
  } catch (e) {
    console.log('[route-tracking] flush error', e);
  }

  return {};
}

TaskManager.defineTask(ROUTE_TASK, async ({
  data, error,
}: { data?: { locations: Location.LocationObject[] }; error?: TaskManager.TaskManagerError | null }) => {
  console.log('[route-tracking] task fired at', new Date().toISOString());
  if (error) { console.log('[route-tracking] task error', error); return; }
  if (!data?.locations?.length) { console.log('[route-tracking] no location data'); return; }

  const raw = await AsyncStorage.getItem(CTX_KEY);
  if (!raw) { console.log('[route-tracking] no ctx, skipping'); return; }

  const ctx: LocationCtx = JSON.parse(raw);
  const point = buildPoint(data.locations[0]);

  const updatedBuffer = [...ctx.buffer, point];

  const shouldFlush =
    updatedBuffer.length >= BATCH_SIZE ||
    Date.now() - ctx.lastFlushAt >= FLUSH_INTERVAL_MS;

  console.log('[route-tracking] point collected', { total: updatedBuffer.length, shouldFlush });

  if (shouldFlush) {
    const patch = await flushBuffer({ ...ctx, buffer: updatedBuffer });
    await AsyncStorage.setItem(CTX_KEY, JSON.stringify({ ...ctx, ...patch, buffer: patch.buffer ?? updatedBuffer }));
  } else {
    await AsyncStorage.setItem(CTX_KEY, JSON.stringify({ ...ctx, buffer: updatedBuffer }));
  }
});

console.log('[route-tracking] TASK DEFINED');

// ─── Internal: start or restart the location task with given accuracy ─────────
async function startTask(accuracy: Location.Accuracy, foregroundBody: string): Promise<void> {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(ROUTE_TASK).catch(() => false);
  if (isRunning) {
    // Stop and restart to apply new accuracy settings
    await Location.stopLocationUpdatesAsync(ROUTE_TASK).catch(() => {});
  }
  await Location.startLocationUpdatesAsync(ROUTE_TASK, {
    accuracy,
    timeInterval: 10_000,          // Android: minimum ms between updates
    distanceInterval: 0,           // no distance gate — fire on time only
    pausesUpdatesAutomatically: false, // iOS: never let OS pause updates
    activityType: Location.ActivityType.AutomotiveNavigation, // iOS: skip low-power throttling
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Zippy',
      notificationBody: foregroundBody,
    },
  });
}

// ─── Driver-level tracking (active shift, no delivery yet) ────────────────────
export async function startDriverTracking(token: string): Promise<void> {
  console.log('[route-tracking] startDriverTracking');
  const raw = await AsyncStorage.getItem(CTX_KEY);
  const existing: Partial<LocationCtx> = raw ? JSON.parse(raw) : {};
  await AsyncStorage.setItem(CTX_KEY, JSON.stringify({
    ...existing,
    token,
    buffer: existing.buffer ?? [],
    lastFlushAt: existing.lastFlushAt ?? Date.now(),
  }));
  await startTask(Location.Accuracy.High, 'Você está disponível para entregas.');
}

export async function stopDriverTracking(): Promise<void> {
  console.log('[route-tracking] stopDriverTracking');
  const isRunning = await Location.hasStartedLocationUpdatesAsync(ROUTE_TASK).catch(() => false);
  if (isRunning) await Location.stopLocationUpdatesAsync(ROUTE_TASK).catch(() => {});
  await AsyncStorage.removeItem(CTX_KEY);
}

// ─── Delivery-level tracking (dispatch active) ────────────────────────────────
export async function startRouteTracking(token: string, dispatchId: string): Promise<void> {
  console.log('[route-tracking] startRouteTracking', { dispatchId });
  const raw = await AsyncStorage.getItem(CTX_KEY);
  const existing: Partial<LocationCtx> = raw ? JSON.parse(raw) : {};
  // Flush any buffered waiting-mode points before switching to delivery mode
  if ((existing.buffer?.length ?? 0) > 0 && !existing.dispatchId) {
    await flushBuffer({ ...existing, buffer: existing.buffer!, lastFlushAt: existing.lastFlushAt ?? 0 } as LocationCtx);
  }
  await AsyncStorage.setItem(CTX_KEY, JSON.stringify({
    token,
    dispatchId,
    sessionId: undefined,
    buffer: [],
    lastFlushAt: Date.now(),
  }));
  // Upgrade to high accuracy for turn-by-turn navigation
  await startTask(Location.Accuracy.High, 'Rastreando sua rota de entrega.');
}

export async function stopRouteTracking(): Promise<void> {
  const raw = await AsyncStorage.getItem(CTX_KEY);
  if (!raw) return;

  const ctx: LocationCtx = JSON.parse(raw);

  // Flush any remaining buffered delivery points
  if (ctx.buffer.length > 0) {
    await flushBuffer(ctx);
  }

  // Close the route session
  if (ctx.sessionId && ctx.dispatchId) {
    await fetch(`${BASE}/drivers/dispatches/${ctx.dispatchId}/route/stop`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ctx.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: ctx.sessionId }),
    }).catch(() => {});
  }

  // Drop back to waiting mode — keep task running at Balanced accuracy
  await AsyncStorage.setItem(CTX_KEY, JSON.stringify({
    token: ctx.token,
    buffer: [],
    lastFlushAt: Date.now(),
  }));
  await startTask(Location.Accuracy.High, 'Você está disponível para entregas.');
}
