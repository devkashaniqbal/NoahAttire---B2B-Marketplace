'use client';
import { useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { getFirebaseMessaging } from './firebase';
import { useAuth } from '@/context/AuthContext';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function useFcm() {
  const { user, saveFcmToken } = useAuth();

  useEffect(() => {
    if (!user || !VAPID_KEY) return;

    (async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const messaging = await getFirebaseMessaging();
        if (!messaging) return;

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) await saveFcmToken(token);
      } catch {
        // Non-fatal: notifications just won't work
      }
    })();
  }, [user, saveFcmToken]);
}
