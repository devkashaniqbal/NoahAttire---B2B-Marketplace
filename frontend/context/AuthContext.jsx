'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import api from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from our JWT cookie
  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Exchange a Firebase ID token for our JWT cookie
  async function exchangeFirebaseToken(idToken, extra = {}) {
    const res = await api.post('/auth/firebase', { idToken, ...extra });
    setUser(res.data.user);
    return res.data.user;
  }

  // Register with email + password via Firebase, then sync to our backend
  async function register({ name, email, password, role }) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const idToken    = await credential.user.getIdToken();
    return exchangeFirebaseToken(idToken, { name, role });
  }

  // Sign in with email + password via Firebase
  async function login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const idToken    = await credential.user.getIdToken();
    return exchangeFirebaseToken(idToken);
  }

  // Google sign-in
  async function googleLogin(role = 'buyer') {
    const credential = await signInWithPopup(auth, googleProvider);
    const idToken    = await credential.user.getIdToken();
    return exchangeFirebaseToken(idToken, { role });
  }

  async function logout() {
    await Promise.allSettled([
      signOut(auth),
      api.post('/auth/logout'),
    ]);
    setUser(null);
  }

  // Save FCM push token to backend so the server can push notifications
  async function saveFcmToken(fcmToken) {
    try {
      await api.post('/auth/fcm-token', { fcmToken });
    } catch {
      // Non-fatal
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, setUser, saveFcmToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
