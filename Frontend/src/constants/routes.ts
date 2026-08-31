export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  missionNew: '/missions/new',
  missionStatus: '/missions/:id/status',
  missionViewer: '/missions/:id/viewer',
  missionMap: '/missions/:id/map',
  missionAnomalies: '/missions/:id/anomalies',
  missionReports: '/missions/:id/reports',
  admin: '/admin',
} as const;

export const ROUTE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/login': 'Login',
  '/signup': 'Sign Up',
  '/dashboard': 'Dashboard',
  '/missions/new': 'New Mission',
  '/missions/:id/status': 'Monitoring',
  '/missions/:id/viewer': 'Sonar Viewer',
  '/missions/:id/map': 'Map View',
  '/missions/:id/anomalies': 'Anomalies',
  '/missions/:id/reports': 'Reports',
  '/admin': 'Admin',
};
