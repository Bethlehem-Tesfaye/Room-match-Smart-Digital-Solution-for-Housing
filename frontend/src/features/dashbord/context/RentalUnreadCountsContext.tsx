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
  useMarkOwnerIncomingRead,
  useMarkOwnerTerminationRead,
  useOwnerRentalUnreadCounts,
  type OwnerRentalUnreadCounts,
} from "../hooks/useRentalUnreadHooks";

interface RentalUnreadCountsContextValue {
  incomingUnreadCount: number;
  terminationUnreadCount: number;
  totalUnreadCount: number;
  isLoading: boolean;
  markIncomingAsRead: () => Promise<OwnerRentalUnreadCounts | undefined>;
  markTerminationAsRead: () => Promise<OwnerRentalUnreadCounts | undefined>;
}

const RentalUnreadCountsContext =
  createContext<RentalUnreadCountsContextValue | null>(null);

export function RentalUnreadCountsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useCurrentUser();
  const countsQuery = useOwnerRentalUnreadCounts(!!user);

  // Keep rental counters in sync in real time for any logged-in owner session.
  useMessageSocket({ enabled: !!user });
  const { mutateAsync: markIncomingMutateAsync } = useMarkOwnerIncomingRead();
  const { mutateAsync: markTerminationMutateAsync } =
    useMarkOwnerTerminationRead();

  const markIncomingAsRead = useCallback(async () => {
    return markIncomingMutateAsync();
  }, [markIncomingMutateAsync]);

  const markTerminationAsRead = useCallback(async () => {
    return markTerminationMutateAsync();
  }, [markTerminationMutateAsync]);

  const value = useMemo<RentalUnreadCountsContextValue>(
    () => ({
      incomingUnreadCount: countsQuery.data?.incomingUnreadCount ?? 0,
      terminationUnreadCount: countsQuery.data?.terminationUnreadCount ?? 0,
      totalUnreadCount: countsQuery.data?.totalUnreadCount ?? 0,
      isLoading: countsQuery.isLoading,
      markIncomingAsRead,
      markTerminationAsRead,
    }),
    [
      countsQuery.data?.incomingUnreadCount,
      countsQuery.data?.terminationUnreadCount,
      countsQuery.data?.totalUnreadCount,
      countsQuery.isLoading,
      markIncomingAsRead,
      markTerminationAsRead,
    ],
  );

  return (
    <RentalUnreadCountsContext.Provider value={value}>
      {children}
    </RentalUnreadCountsContext.Provider>
  );
}

export const useRentalUnreadCounts = () => {
  const context = useContext(RentalUnreadCountsContext);

  if (!context) {
    throw new Error(
      "useRentalUnreadCounts must be used within RentalUnreadCountsProvider",
    );
  }

  return context;
};
