import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
        },
        success: {
          iconTheme: {
            primary: '#16A34A',
            secondary: '#f8fafc',
          },
        },
        error: {
          iconTheme: {
            primary: '#DC2626',
            secondary: '#f8fafc',
          },
        },
      }}
    />
  );
}
