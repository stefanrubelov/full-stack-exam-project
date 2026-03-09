import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { StateleSSEClient } from 'statele-sse';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import { realtimeApi, type TurbineAlert } from './api/apiClient';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TurbineDetailPage from './pages/TurbineDetailPage';
import AlertsPage from './pages/AlertsPage';
import CommandLogsPage from './pages/CommandLogsPage';
import UsersPage from './pages/UsersPage';
import AlertThresholdsPage from './pages/AlertThresholdsPage';
import MaintenancePage from './pages/MaintenancePage';
import ProfilePage from './pages/ProfilePage';
import MultipleTabsOverlay from './components/MultipleTabsOverlay';

const alertSse = new StateleSSEClient(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5233'}/sse`);

function AlertToastListener() {
  const { isAuthenticated } = useAuth();
  const prevIds = useRef<Set<string>>(new Set());
  const initialised = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;

    alertSse.listen(
      (id) => realtimeApi.getTurbineAlerts(id),
      (data: TurbineAlert[]) => {
        if (!mounted) return;
        if (!initialised.current) {
          prevIds.current = new Set(data.map(a => a.id));
          initialised.current = true;
          return;
        }
        data.filter(a => !prevIds.current.has(a.id)).forEach(a => {
          const isCritical = a.severity === 'critical';
          toast.custom(
            (t) => (
              <div
                style={{ borderLeft: `3px solid ${isCritical ? '#ef4444' : '#f59e0b'}` }}
                className={`flex items-start gap-3 bg-[#1a2744] border border-[#2a3a52] rounded-[10px] px-4 py-3 shadow-lg max-w-sm w-full transition-all ${t.visible ? 'opacity-100' : 'opacity-0'}`}
              >
                <span className="mt-0.5 shrink-0">{isCritical ? '🔴' : '🟠'}</span>
                <p className="flex-1 text-[0.85rem] text-[#e2e8f0] leading-snug">{a.message}</p>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="shrink-0 text-[#4d6280] hover:text-[#e2e8f0] transition-colors text-lg leading-none cursor-pointer bg-transparent border-none"
                >
                  ×
                </button>
              </div>
            ),
            { duration: 6000 }
          );
        });
        prevIds.current = new Set(data.map(a => a.id));
      }
    );

    return () => { mounted = false; };
  }, [isAuthenticated]);

  return null;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/turbines/:id" element={<PrivateRoute><TurbineDetailPage /></PrivateRoute>} />
      <Route path="/alerts" element={<PrivateRoute><AlertsPage /></PrivateRoute>} />
      <Route path="/command-logs" element={<PrivateRoute><CommandLogsPage /></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><UsersPage /></PrivateRoute>} />
      <Route path="/alert-thresholds" element={<PrivateRoute><AlertThresholdsPage /></PrivateRoute>} />
      <Route path="/maintenance" element={<PrivateRoute><MaintenancePage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MultipleTabsOverlay />
        <AlertToastListener />
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a2744',
              color: '#e2e8f0',
              border: '1px solid #2a3a52',
              borderRadius: '10px',
              fontSize: '0.85rem',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
