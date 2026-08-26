import LandingPage from './pages/LandingPage';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { MissionProvider } from '@/context/MissionContext';
import { ROUTES } from '@/constants/routes';
import Dashboard from '@/pages/Dashboard';
import MissionUpload from '@/pages/MissionUpload';
import MissionMonitoring from '@/pages/MissionMonitoring';
import SonarViewer from '@/pages/SonarViewer';
import MapView from '@/pages/MapView';
import AnomalyPanel from '@/pages/AnomalyPanel';
import Reports from '@/pages/Reports';
import Admin from '@/pages/Admin';

function App() {
  return (
    <AuthProvider>
      <MissionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path={ROUTES.dashboard} element={<Dashboard />} />
            <Route path={ROUTES.missionNew} element={<MissionUpload />} />
            <Route path={ROUTES.missionStatus} element={<MissionMonitoring />} />
            <Route path={ROUTES.missionViewer} element={<SonarViewer />} />
            <Route path={ROUTES.missionMap} element={<MapView />} />
            <Route path={ROUTES.missionAnomalies} element={<AnomalyPanel />} />
            <Route path={ROUTES.missionReports} element={<Reports />} />
            <Route path={ROUTES.admin} element={<Admin />} />
          </Routes>
        </BrowserRouter>
      </MissionProvider>
    </AuthProvider>
  );
}

export default App;
