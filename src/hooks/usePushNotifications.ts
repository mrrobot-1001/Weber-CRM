'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { apiService } from '@/services/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const attempted = useRef(false);

  // Register the service worker and auto-subscribe if already granted
  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission as PushPermission);

    navigator.serviceWorker
      .register('/sw.js')
      .then(async (reg) => {
        // If permission is already granted, ensure we have a subscription
        if (Notification.permission === 'granted') {
          const existing = await reg.pushManager.getSubscription();
          if (existing) {
            setSubscribed(true);
          } else {
            await subscribeToPush(reg);
          }
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribeToPush = useCallback(async (reg?: ServiceWorkerRegistration) => {
    try {
      const swReg = reg ?? (await navigator.serviceWorker.ready);
      const { publicKey } = await apiService.getVapidPublicKey();
      const applicationServerKey = urlBase64ToUint8Array(publicKey) as BufferSource;
      const sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      await apiService.savePushSubscription(sub.toJSON());
      setSubscribed(true);
      setPermission('granted');
    } catch {
      setSubscribed(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result as PushPermission);
    if (result === 'granted') {
      await subscribeToPush();
    }
  }, [subscribeToPush]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await apiService.removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
        setSubscribed(false);
      }
    } catch {
      // ignore
    }
  }, []);

  return { permission, subscribed, requestPermission, unsubscribe };
}
