import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const CTX_KEY = 'driver_location_ctx';

// ─── Bundled simulation route (Winter Garden FL) ─────────────────────────────
// Source: ios/simulation_route.gpx
// 41 points · ~3.4 km · start 28.3486,-81.6514 → end 28.3606,-81.6834
export const SIMULATION_ROUTE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Zippy Driver Simulator"
     xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>Simulation Route</name><trkseg>
    <trkpt lat="28.348632" lon="-81.651434"><ele>30.0</ele></trkpt>
    <trkpt lat="28.348684" lon="-81.652304"><ele>30.0</ele></trkpt>
    <trkpt lat="28.348736" lon="-81.653174"><ele>30.0</ele></trkpt>
    <trkpt lat="28.348788" lon="-81.654044"><ele>30.0</ele></trkpt>
    <trkpt lat="28.348840" lon="-81.654914"><ele>30.0</ele></trkpt>
    <trkpt lat="28.348892" lon="-81.655784"><ele>30.0</ele></trkpt>
    <trkpt lat="28.348944" lon="-81.656654"><ele>30.0</ele></trkpt>
    <trkpt lat="28.348996" lon="-81.657524"><ele>30.0</ele></trkpt>
    <trkpt lat="28.349048" lon="-81.658394"><ele>30.0</ele></trkpt>
    <trkpt lat="28.349100" lon="-81.659264"><ele>30.0</ele></trkpt>
    <trkpt lat="28.349152" lon="-81.660134"><ele>30.0</ele></trkpt>
    <trkpt lat="28.349200" lon="-81.661000"><ele>30.0</ele></trkpt>
    <trkpt lat="28.349630" lon="-81.661700"><ele>30.0</ele></trkpt>
    <trkpt lat="28.350060" lon="-81.662400"><ele>30.0</ele></trkpt>
    <trkpt lat="28.350490" lon="-81.663100"><ele>30.0</ele></trkpt>
    <trkpt lat="28.350920" lon="-81.663800"><ele>30.0</ele></trkpt>
    <trkpt lat="28.351350" lon="-81.664500"><ele>30.0</ele></trkpt>
    <trkpt lat="28.351780" lon="-81.665200"><ele>30.0</ele></trkpt>
    <trkpt lat="28.352210" lon="-81.665900"><ele>30.0</ele></trkpt>
    <trkpt lat="28.352640" lon="-81.666600"><ele>30.0</ele></trkpt>
    <trkpt lat="28.353070" lon="-81.667300"><ele>30.0</ele></trkpt>
    <trkpt lat="28.353500" lon="-81.668000"><ele>30.0</ele></trkpt>
    <trkpt lat="28.353889" lon="-81.668778"><ele>30.0</ele></trkpt>
    <trkpt lat="28.354278" lon="-81.669556"><ele>30.0</ele></trkpt>
    <trkpt lat="28.354667" lon="-81.670334"><ele>30.0</ele></trkpt>
    <trkpt lat="28.355056" lon="-81.671112"><ele>30.0</ele></trkpt>
    <trkpt lat="28.355445" lon="-81.671890"><ele>30.0</ele></trkpt>
    <trkpt lat="28.355833" lon="-81.672667"><ele>30.0</ele></trkpt>
    <trkpt lat="28.356222" lon="-81.673445"><ele>30.0</ele></trkpt>
    <trkpt lat="28.356611" lon="-81.674223"><ele>30.0</ele></trkpt>
    <trkpt lat="28.357000" lon="-81.675000"><ele>30.0</ele></trkpt>
    <trkpt lat="28.357355" lon="-81.675837"><ele>30.0</ele></trkpt>
    <trkpt lat="28.357710" lon="-81.676674"><ele>30.0</ele></trkpt>
    <trkpt lat="28.358065" lon="-81.677511"><ele>30.0</ele></trkpt>
    <trkpt lat="28.358421" lon="-81.678349"><ele>30.0</ele></trkpt>
    <trkpt lat="28.358776" lon="-81.679186"><ele>30.0</ele></trkpt>
    <trkpt lat="28.359131" lon="-81.680023"><ele>30.0</ele></trkpt>
    <trkpt lat="28.359486" lon="-81.680860"><ele>30.0</ele></trkpt>
    <trkpt lat="28.359841" lon="-81.681697"><ele>30.0</ele></trkpt>
    <trkpt lat="28.360196" lon="-81.682534"><ele>30.0</ele></trkpt>
    <trkpt lat="28.360551" lon="-81.683371"><ele>30.0</ele></trkpt>
  </trkseg></trk>
</gpx>`;

// ─── Types ────────────────────────────────────────────────────────────────────

export type GpxPoint = { lat: number; lng: number; ele?: number };
export type SimStatus = { running: boolean; current: number; total: number };

// ─── Singleton state ──────────────────────────────────────────────────────────

let _timer: ReturnType<typeof setInterval> | null = null;
let _points: GpxPoint[] = [];
let _index = 0;
const _listeners = new Set<(s: SimStatus) => void>();

// ─── Internal helpers ─────────────────────────────────────────────────────────

function currentStatus(): SimStatus {
  return { running: _timer !== null, current: _index, total: _points.length };
}

function notify() {
  const s = currentStatus();
  _listeners.forEach(l => l(s));
}

function headingBetween(from: GpxPoint, to: GpxPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLon = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

async function postPoint(pt: GpxPoint, prev: GpxPoint): Promise<void> {
  const raw = await AsyncStorage.getItem(CTX_KEY);
  if (!raw) { stopSimulation(); return; }
  const ctx = JSON.parse(raw);

  const point = {
    lat: pt.lat,
    lng: pt.lng,
    recordedAt: new Date().toISOString(),
    accuracyMeters: 3.5,
    speedMps: 8.3,
    headingDegrees: headingBetween(prev, pt),
    altitudeMeters: pt.ele ?? 30.0,
    source: 'GPS' as const,
    isMocked: true,
  };

  if (ctx.dispatchId) {
    await fetch(`${BASE}/drivers/dispatches/${ctx.dispatchId}/route/points/batch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ctx.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: [point] }),
    }).catch(() => {});
  } else {
    await fetch(`${BASE}/drivers/location`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ctx.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(point),
    }).catch(() => {});
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function parseGpx(xml: string): GpxPoint[] {
  const points: GpxPoint[] = [];
  const re = /<trkpt\b[^>]*\blat="([^"]+)"[^>]*\blon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const eleMatch = m[3].match(/<ele>([^<]+)<\/ele>/);
    points.push({
      lat: parseFloat(m[1]),
      lng: parseFloat(m[2]),
      ele: eleMatch ? parseFloat(eleMatch[1]) : undefined,
    });
  }
  return points;
}

export function onSimStatus(cb: (s: SimStatus) => void): () => void {
  _listeners.add(cb);
  cb(currentStatus());
  return () => _listeners.delete(cb);
}

export async function startSimulation(gpxString: string, intervalMs = 10_000): Promise<string | null> {
  stopSimulation();

  const points = parseGpx(gpxString);
  if (!points.length) return 'Nenhum ponto encontrado no GPX.';

  const raw = await AsyncStorage.getItem(CTX_KEY);
  if (!raw) return 'Ative o modo motorista antes de simular.';

  _points = points;
  _index = 0;

  const tick = async () => {
    if (_index >= _points.length) { stopSimulation(); return; }
    const prev = _index > 0 ? _points[_index - 1] : _points[0];
    await postPoint(_points[_index], prev);
    _index++;
    notify();
  };

  await tick();
  _timer = setInterval(tick, intervalMs);
  notify();
  return null;
}

export function stopSimulation(): void {
  if (_timer) { clearInterval(_timer); _timer = null; }
  _points = [];
  _index = 0;
  notify();
}
