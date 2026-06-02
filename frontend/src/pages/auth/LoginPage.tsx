import AuthLayout from "../../features/auth/components/AuthLayout";
import LoginForm from "../../features/auth/components/LoginForm";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";

function LoginPage() {
  const { isAuthenticated, isPending } = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();

  const from =
    typeof location.state === "object" &&
    location.state !== null &&
    "from" in location.state
      ? String(location.state.from)
      : "";

  useEffect(() => {
    if (!isAuthenticated || from) {
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/", { replace: true });
  }, [from, isAuthenticated, navigate]);

  if (isPending) {
    return <div className="min-h-screen bg-white" />;
  }

  if (isAuthenticated) {
    if (from) {
      return <Navigate to={from} replace />;
    }

    return <div className="min-h-screen bg-white" />;
  }

  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}

export default LoginPage;
