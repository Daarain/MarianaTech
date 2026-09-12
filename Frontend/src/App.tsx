import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { MissionProvider } from '@/context/MissionContext';
import { ToastProvider } from '@/context/ToastContext';
import { ROUTES } from '@/constants/routes';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { RefreshCw } from 'lucide-react';

// Lazy-loaded page components for route-level chunking
const LandingPage = lazy(() => import('@/pages/LandingPage'));
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
  <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#030712] font-mono text-cyan-400">
    <div className="flex flex-col items-center gap-3 rounded-lg border border-cyan-500/30 bg-[#050D1A] p-8 shadow-2xl">
      <RefreshCw className="h-10 w-10 animate-spin text-cyan-400" />
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
                  {/* Entry & Landing Experience */}
                  <Route path="/" element={<LandingPage />} />

                  {/* Main Application Shell Routes */}
                  <Route path={ROUTES.dashboard} element={<Dashboard />} />
                  <Route path={ROUTES.sonarAnalysis} element={<SonarViewer />} />
                  <Route path={ROUTES.missionNew} element={<MissionUpload />} />
                  <Route path={ROUTES.missionStatus} element={<MissionMonitoring />} />
                  <Route path={ROUTES.missionViewer} element={<SonarViewer />} />
                  <Route path={ROUTES.missionMap} element={<MapView />} />
                  <Route path={ROUTES.missionAnomalies} element={<AnomalyPanel />} />
                  <Route path={ROUTES.missionReports} element={<Reports />} />
                  <Route path={ROUTES.history} element={<AnalysisHistory />} />

                  <Route path={ROUTES.models} element={<Admin />} />
                  <Route path={ROUTES.admin} element={<Admin />} />
                  <Route path={ROUTES.designSystem} element={<DesignSystemShowcase />} />

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
