import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { Rol } from "@/types/api";

interface ProtectedRouteProps {
  requiredRole?: Rol;
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  const hasToken = !!localStorage.getItem("access_token");

  if (isLoading || (!isAuthenticated && hasToken)) return null;

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
