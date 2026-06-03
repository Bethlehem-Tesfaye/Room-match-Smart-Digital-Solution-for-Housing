import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUser } from "../features/auth/hooks/useCurrentUser";
import {
  useAccountStatus,
  useMyProfile,
} from "../features/profile/hooks/useProfileHooks";
import { palette } from "../theme/palette";

function PageLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: palette.pageBg }}
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
        style={{
          borderColor: palette.border,
          borderTopColor: palette.purple,
        }}
      />
    </div>
  );
}

export function ProtectedLayout() {
  const { user, isPending } = useCurrentUser();
  const location = useLocation();

  const accountStatusQuery = useAccountStatus(!!user);
  const isBlocked = accountStatusQuery.data?.blocked === true;

  const profileQuery = useMyProfile(!!user && !isBlocked && !isPending);
  const profileError = profileQuery.error as Error | undefined;

  if (isPending) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  if (profileQuery.isLoading) {
    return <PageLoader />;
  }

  if (profileQuery.isError) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4"
        style={{ backgroundColor: palette.pageBg }}
      >
        <div
          className="w-full max-w-md rounded-2xl border p-6"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardBg,
          }}
        >
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--palette-deep)" }}
          >
            Unable to load account
          </h1>
          <p className="mt-2 text-sm" style={{ color: palette.softPurple }}>
            {profileError?.message ?? "Unable to load profile."}
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export default ProtectedLayout;
