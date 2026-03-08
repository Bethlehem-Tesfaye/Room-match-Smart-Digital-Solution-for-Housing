import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "../features/auth/hooks/useCurrentUser";

export function ProtectedLayout() {
  const { user, isPending } = useCurrentUser();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center"></div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedLayout;
