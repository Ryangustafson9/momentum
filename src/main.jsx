
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App.jsx';
import '@/index.css';
import { Toaster } from '@/components/ui/toaster.jsx';
import { ThemeProvider } from '@/hooks/useTheme.jsx';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <AuthProvider>
            <App />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
