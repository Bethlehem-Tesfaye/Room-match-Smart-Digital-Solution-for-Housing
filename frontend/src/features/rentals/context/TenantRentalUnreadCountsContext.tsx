import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import { useMessageSocket } from "../../message/hooks/useMessageHooks";
import {
  useMarkTenantRequestedRead,
  useMarkTenantTerminationRead,
  useTenantRentalUnreadCounts,
  type TenantRentalUnreadCounts,
} from "../hooks/useTenantRentalUnreadHooks";

interface TenantRentalUnreadCountsContextValue {
  requestedUnreadCount: number;
  terminationUnreadCount: number;
  totalUnreadCount: number;
  isLoading: boolean;
  markRequestedAsRead: () => Promise<TenantRentalUnreadCounts | undefined>;
  markTerminationAsRead: () => Promise<TenantRentalUnreadCounts | undefined>;
}

const TenantRentalUnreadCountsContext =
  createContext<TenantRentalUnreadCountsContextValue | null>(null);

export function TenantRentalUnreadCountsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useCurrentUser();
  const countsQuery = useTenantRentalUnreadCounts(!!user);
  const { mutateAsync: markRequestedMutateAsync } = useMarkTenantRequestedRead();
  const { mutateAsync: markTerminationMutateAsync } =
    useMarkTenantTerminationRead();

  useMessageSocket({ enabled: !!user });

  const markRequestedAsRead = useCallback(async () => {
    return markRequestedMutateAsync();
  }, [markRequestedMutateAsync]);

  const markTerminationAsRead = useCallback(async () => {
    return markTerminationMutateAsync();
  }, [markTerminationMutateAsync]);

  const value = useMemo<TenantRentalUnreadCountsContextValue>(
    () => ({
      requestedUnreadCount: countsQuery.data?.requestedUnreadCount ?? 0,
      terminationUnreadCount: countsQuery.data?.terminationUnreadCount ?? 0,
      totalUnreadCount: countsQuery.data?.totalUnreadCount ?? 0,
      isLoading: countsQuery.isLoading,
      markRequestedAsRead,
      markTerminationAsRead,
    }),
    [
      countsQuery.data?.requestedUnreadCount,
      countsQuery.data?.terminationUnreadCount,
      countsQuery.data?.totalUnreadCount,
      countsQuery.isLoading,
      markRequestedAsRead,
      markTerminationAsRead,
    ],
  );

  return (
    <TenantRentalUnreadCountsContext.Provider value={value}>
      {children}
    </TenantRentalUnreadCountsContext.Provider>
  );
}

export const useTenantRentalUnreadCountsContext = () => {
  const context = useContext(TenantRentalUnreadCountsContext);

  if (!context) {
    throw new Error(
      "useTenantRentalUnreadCountsContext must be used within TenantRentalUnreadCountsProvider",
    );
  }

  return context;
};
