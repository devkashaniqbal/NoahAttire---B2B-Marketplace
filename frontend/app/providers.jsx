'use client';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { useFcm } from '@/lib/useFcm';

function FcmRegistrar() {
  useFcm();
  return null;
}

export function Providers({ children }) {
  return (
    <AuthProvider>
      <FcmRegistrar />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0F2557',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#C9A84C', secondary: '#fff' },
          },
          error: {
            style: { background: '#DC2626' },
            iconTheme: { primary: '#fff', secondary: '#DC2626' },
          },
        }}
      />
    </AuthProvider>
  );
}
