import LandingPage from './pages/LandingPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';

function App() {
  return (
    <AuthProvider>
      <MissionProvider>
        <BrowserRouter>
          <Routes>
            <Route path={ROUTES.home} element={<LandingPage />} />
            <Route path={ROUTES.login} element={<LoginPage />} />
            <Route path={ROUTES.signup} element={<SignupPage />} />
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
