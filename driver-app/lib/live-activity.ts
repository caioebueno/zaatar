import { NativeModules, Platform } from 'react-native';

const { LiveActivityModule } = NativeModules;

export type StartDeliveryActivityParams = {
  deliveryId: string;
  customerName: string;
  address: string;
  etaMinutes: number;
  startedAt: number; // Unix ms
};

export async function startDeliveryActivity(params: StartDeliveryActivityParams): Promise<string | null> {
  if (Platform.OS !== 'ios') return null;
  if (!LiveActivityModule) return null;
  try {
    const result = await LiveActivityModule.startDelivery(params);
    return result?.activityId ?? null;
  } catch (e) {
    console.warn('[LiveActivity] startDelivery failed:', e);
    return null;
  }
}

export async function updateDeliveryActivity(params: { etaMinutes: number; startedAt: number }): Promise<void> {
  if (Platform.OS !== 'ios') return;
  if (!LiveActivityModule) return;
  try {
    await LiveActivityModule.updateDelivery(params);
  } catch (e) {
    console.warn('[LiveActivity] updateDelivery failed:', e);
  }
}

export async function endDeliveryActivity(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  if (!LiveActivityModule) return;
  try {
    await LiveActivityModule.endDelivery();
  } catch (e) {
    console.warn('[LiveActivity] endDelivery failed:', e);
  }
}
