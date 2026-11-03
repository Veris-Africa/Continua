import { WorkspaceSkeleton } from "./WorkspaceSkeleton";
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, initializationError, retrySession } = useAuth();
  const location = useLocation();

  if (loading) {
    return <WorkspaceSkeleton path={location.pathname} label="Connecting your account" />;
  }

  if (!user) {
    if(initializationError)return <main className="min-h-screen grid place-items-center p-6"><div role="alert" className="max-w-sm space-y-4"><h1 className="text-xl font-semibold">Reconnect your account</h1><p>{initializationError}</p><button className="rounded-full bg-primary px-5 py-3 text-primary-foreground" onClick={retrySession}>Retry account connection</button></div></main>;
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
