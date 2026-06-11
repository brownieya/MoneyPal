import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { PaymentNotification } from '../types';

type PaymentNotificationNativeModule = {
  consumePendingNotifications?: () => Promise<PaymentNotification[]>;
  isNotificationAccessEnabled?: () => Promise<boolean>;
  openNotificationAccessSettings?: () => void;
};

const nativeModule = NativeModules.PaymentNotificationModule as PaymentNotificationNativeModule | undefined;
const eventEmitter =
  Platform.OS === 'android' && nativeModule
    ? new NativeEventEmitter(NativeModules.PaymentNotificationModule)
    : null;

function normalizeNotification(value: Partial<PaymentNotification>): PaymentNotification | null {
  if (!value.externalId) {
    return null;
  }

  return {
    externalId: String(value.externalId),
    packageName: String(value.packageName ?? ''),
    title: String(value.title ?? ''),
    text: String(value.text ?? ''),
    postedAt: String(value.postedAt ?? new Date().toISOString()),
  };
}

export async function consumePendingNotifications(): Promise<PaymentNotification[]> {
  if (Platform.OS !== 'android' || !nativeModule?.consumePendingNotifications) {
    return [];
  }

  const notifications = await nativeModule.consumePendingNotifications();
  return notifications
    .map(normalizeNotification)
    .filter((item): item is PaymentNotification => item !== null);
}

export async function isNotificationAccessEnabled(): Promise<boolean> {
  if (Platform.OS !== 'android' || !nativeModule?.isNotificationAccessEnabled) {
    return false;
  }

  return nativeModule.isNotificationAccessEnabled();
}

export function openNotificationAccessSettings(): void {
  nativeModule?.openNotificationAccessSettings?.();
}

export function listenToNotifications(
  onNotification: (notification: PaymentNotification) => void
): () => void {
  if (!eventEmitter) {
    return () => undefined;
  }

  const subscription = eventEmitter.addListener(
    'paymentNotificationReceived',
    (payload: Partial<PaymentNotification>) => {
      const notification = normalizeNotification(payload);
      if (notification) {
        onNotification(notification);
      }
    }
  );

  return () => subscription.remove();
}
