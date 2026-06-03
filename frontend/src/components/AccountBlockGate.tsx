import type { ReactNode } from "react";
import { useCurrentUser } from "../features/auth/hooks/useCurrentUser";
import BlockedAccountModal from "../features/auth/components/BlockedAccountModal";
import { useAccountStatus } from "../features/profile/hooks/useProfileHooks";
import { palette } from "../theme/palette";

function AccountBlockLoader() {
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

type AccountBlockGateProps = {
  children: ReactNode;
};

function AccountBlockGate({ children }: AccountBlockGateProps) {
  const { user, isPending } = useCurrentUser();
  const accountStatusQuery = useAccountStatus(!!user && !isPending);

  if (!isPending && user && accountStatusQuery.isLoading) {
    return <AccountBlockLoader />;
  }

  if (user && accountStatusQuery.data?.blocked) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: palette.pageBg }}
      >
        <BlockedAccountModal
          message={
            accountStatusQuery.data.message ??
            "Your account has been blocked. Contact support for help."
          }
          blockedReason={accountStatusQuery.data.blockedReason}
        />
      </div>
    );
  }

  return children;
}

export default AccountBlockGate;
