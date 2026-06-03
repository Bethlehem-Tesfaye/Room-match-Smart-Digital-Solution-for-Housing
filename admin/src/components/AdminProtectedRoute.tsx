import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { signOutAdmin, verifyAdminAccess } from "../lib/api";

function AdminProtectedRoute() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAccess = async () => {
      try {
        await verifyAdminAccess();
        if (!cancelled) {
          setIsAuthorized(true);
        }
      } catch {
        await signOutAdmin().catch(() => undefined);
        if (!cancelled) {
          navigate("/login", {
            replace: true,
            state: {
              error:
                "This account does not have admin access. Sign in with an admin account.",
            },
          });
        }
      }
    };

    void checkAccess();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!isAuthorized) {
    return null;
  }

  return <Outlet />;
}

export default AdminProtectedRoute;
