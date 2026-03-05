import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { api } from '@/common/services/api';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { ProjectSetupPage } from '@/pages/ProjectSetupPage';

function ProtectedRoute() {
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: api.getMe,
    retry: false,
    throwOnError: false,
  });

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#F5F3EF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: '#A09B94',
        }}
      >
        Loading…
      </div>
    );
  }

  if (!data) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/projects/:projectId/setup" element={<ProjectSetupPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
