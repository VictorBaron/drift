import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './common/routes';
import { storeSessionToken } from './common/services/api';
import './index.css';

// Extract OAuth token from redirect URL synchronously before React renders,
// so it's available when the first useQuery fires.
const urlParams = new URLSearchParams(window.location.search);
const oauthToken = urlParams.get('token');
if (oauthToken) {
  storeSessionToken(oauthToken);
  window.history.replaceState({}, '', window.location.pathname);
}

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
