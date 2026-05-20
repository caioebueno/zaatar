const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function sendOtp(phone: string) {
  const body = { phone, channel: 'SMS', language: 'pt' };
  console.log('[driver-api] sendOtp →', JSON.stringify(body));
  const r = await fetch(`${BASE}/drivers/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw Object.assign(new Error('send_failed'), { data: e, status: r.status });
  }
  return r.json() as Promise<{ ok: boolean; expiresInMinutes: number }>;
}

export type VerifyOtpResult = {
  ok: boolean;
  accessToken: string;
  expiresAt: string;
  driver: {
    id: string;
    name: string;
    phone: string;
    active: boolean;
    priorityLevel: number;
  };
};

export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  const body = { phone, code };
  console.log('[driver-api] verifyOtp →', JSON.stringify(body));
  const r = await fetch(`${BASE}/drivers/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw Object.assign(new Error(data.reason ?? 'verify_failed'), { data, status: r.status });
  }
  return data;
}
