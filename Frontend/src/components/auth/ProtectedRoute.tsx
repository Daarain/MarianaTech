import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#101214] font-mono text-orange-400">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-orange-500/30 bg-[#181B1F] p-8 shadow-2xl">
          <RefreshCw className="h-10 w-10 animate-spin text-orange-400" />
          <span className="text-sm font-bold tracking-widest uppercase">AUTHENTICATING...</span>
          <span className="text-[10px] text-slate-500">Verifying Operator Credentials</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
