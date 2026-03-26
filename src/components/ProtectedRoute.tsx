import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && profile && !roles.includes(profile.role)) {
    // Redirige vers le bon dashboard selon le rôle
    const roleRedirects: Record<string, string> = {
      admin: '/admin/global',
      abattoir: '/abattoir',
      livreur: '/livreur',
      mosquee_admin: '/mosquee',
      client: '/',
    };
    const redirect = roleRedirects[profile.role] || '/';
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}