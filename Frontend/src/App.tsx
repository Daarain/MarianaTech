import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { MissionProvider } from '@/context/MissionContext';
import { ToastProvider } from '@/context/ToastContext';
import { ROUTES } from '@/constants/routes';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { RefreshCw } from 'lucide-react';

// Lazy-loaded page components for route-level chunking
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const MissionUpload = lazy(() => import('@/pages/MissionUpload'));
const MissionMonitoring = lazy(() => import('@/pages/MissionMonitoring'));
const SonarViewer = lazy(() => import('@/pages/SonarViewer'));
const MapView = lazy(() => import('@/pages/MapView'));
const AnomalyPanel = lazy(() => import('@/pages/AnomalyPanel'));
const Reports = lazy(() => import('@/pages/Reports'));
const AnalysisHistory = lazy(() => import('@/pages/AnalysisHistory'));
const Admin = lazy(() => import('@/pages/Admin'));
const DesignSystemShowcase = lazy(() => import('@/pages/DesignSystemShowcase'));
const ModulePlaceholder = lazy(() => import('@/pages/ModulePlaceholder'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Subsea-themed fallback loading spinner for route transitions
const PageLoadingFallback = () => (
  <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#101214] font-mono text-orange-400">
    <div className="flex flex-col items-center gap-3 rounded-lg border border-orange-500/30 bg-[#181B1F] p-8 shadow-2xl">
      <RefreshCw className="h-10 w-10 animate-spin text-orange-400" />
      <span className="text-sm font-bold tracking-widest uppercase">LOADING MARIANATECH MODULE...</span>
      <span className="text-[10px] text-slate-500">Initializing Subsea Telemetry Stream</span>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MissionProvider>
          <ToastProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  {/* Entry & Public Experience */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path={ROUTES.login} element={<Login />} />
                  <Route path={ROUTES.signup} element={<Signup />} />

                  {/* Main Protected Application Routes */}
                  <Route
                    path={ROUTES.dashboard}
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.sonarAnalysis}
                    element={
                      <ProtectedRoute>
                        <SonarViewer />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.missionNew}
                    element={
                      <ProtectedRoute>
                        <MissionUpload />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.missionStatus}
                    element={
                      <ProtectedRoute>
                        <MissionMonitoring />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.missionViewer}
                    element={
                      <ProtectedRoute>
                        <SonarViewer />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.missionMap}
                    element={
                      <ProtectedRoute>
                        <MapView />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.missionAnomalies}
                    element={
                      <ProtectedRoute>
                        <AnomalyPanel />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.missionReports}
                    element={
                      <ProtectedRoute>
                        <Reports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.history}
                    element={
                      <ProtectedRoute>
                        <AnalysisHistory />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path={ROUTES.models}
                    element={
                      <ProtectedRoute>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.admin}
                    element={
                      <ProtectedRoute>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.designSystem}
                    element={
                      <ProtectedRoute>
                        <DesignSystemShowcase />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 Signal Lost Fallback */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </MissionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
