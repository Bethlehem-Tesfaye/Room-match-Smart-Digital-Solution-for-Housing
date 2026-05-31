import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api } from "../../../lib/axios";

export interface OwnerRentalUnreadCounts {
  incomingUnreadCount: number;
  terminationUnreadCount: number;
  totalUnreadCount: number;
}

export const ownerRentalUnreadCountsQueryKey = [
  "contracts",
  "owner",
  "unread-counts",
] as const;

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const maybeResponse = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };

    return (
      maybeResponse.response?.data?.message ||
      maybeResponse.message ||
      "Request failed"
    );
  }

  if (error instanceof Error) return error.message;

  return "Request failed";
};

export const useOwnerRentalUnreadCounts = (
  enabled = true,
): UseQueryResult<OwnerRentalUnreadCounts, Error> => {
  return useQuery<OwnerRentalUnreadCounts, Error>({
    queryKey: ownerRentalUnreadCountsQueryKey,
    enabled,
    queryFn: async () => {
      try {
        const response = await api.get<OwnerRentalUnreadCounts>(
          "/api/contracts/owner/unread-counts",
        );

        return response.data;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    refetchInterval: enabled ? 15_000 : false,
    refetchOnWindowFocus: enabled,
  });
};

export const useMarkOwnerIncomingRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.patch<{
        counts?: OwnerRentalUnreadCounts;
        incomingUnreadCount?: number;
        terminationUnreadCount?: number;
        totalUnreadCount?: number;
      }>("/api/contracts/owner/mark-incoming-read");

      const data = response.data;

      if (data.counts) {
        return data.counts;
      }

      return {
        incomingUnreadCount: data.incomingUnreadCount ?? 0,
        terminationUnreadCount: data.terminationUnreadCount ?? 0,
        totalUnreadCount: data.totalUnreadCount ?? 0,
      };
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ownerRentalUnreadCountsQueryKey,
      });

      const previous = queryClient.getQueryData<OwnerRentalUnreadCounts>(
        ownerRentalUnreadCountsQueryKey,
      );

      if (previous) {
        queryClient.setQueryData<OwnerRentalUnreadCounts>(
          ownerRentalUnreadCountsQueryKey,
          {
            incomingUnreadCount: 0,
            terminationUnreadCount: previous.terminationUnreadCount,
            totalUnreadCount: previous.terminationUnreadCount,
          },
        );
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ownerRentalUnreadCountsQueryKey,
          context.previous,
        );
      }
    },
    onSuccess: (counts) => {
      if (counts) {
        queryClient.setQueryData(ownerRentalUnreadCountsQueryKey, counts);
      }
    },
  });
};

export const useMarkOwnerTerminationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.patch<{
        counts?: OwnerRentalUnreadCounts;
        incomingUnreadCount?: number;
        terminationUnreadCount?: number;
        totalUnreadCount?: number;
      }>("/api/contracts/owner/mark-termination-read");

      const data = response.data;

      if (data.counts) {
        return data.counts;
      }

      return {
        incomingUnreadCount: data.incomingUnreadCount ?? 0,
        terminationUnreadCount: data.terminationUnreadCount ?? 0,
        totalUnreadCount: data.totalUnreadCount ?? 0,
      };
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ownerRentalUnreadCountsQueryKey,
      });

      const previous = queryClient.getQueryData<OwnerRentalUnreadCounts>(
        ownerRentalUnreadCountsQueryKey,
      );

      if (previous) {
        queryClient.setQueryData<OwnerRentalUnreadCounts>(
          ownerRentalUnreadCountsQueryKey,
          {
            incomingUnreadCount: previous.incomingUnreadCount,
            terminationUnreadCount: 0,
            totalUnreadCount: previous.incomingUnreadCount,
          },
        );
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ownerRentalUnreadCountsQueryKey,
          context.previous,
        );
      }
    },
    onSuccess: (counts) => {
      if (counts) {
        queryClient.setQueryData(ownerRentalUnreadCountsQueryKey, counts);
      }
    },
  });
};

const toCount = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const normalizeOwnerRentalUnreadCounts = (
  value: unknown,
): OwnerRentalUnreadCounts | null => {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const incomingUnreadCount = toCount(raw.incomingUnreadCount);
  const terminationUnreadCount = toCount(raw.terminationUnreadCount);
  const totalUnreadCount = toCount(raw.totalUnreadCount);

  if (
    incomingUnreadCount === null ||
    terminationUnreadCount === null ||
    totalUnreadCount === null
  ) {
    return null;
  }

  return {
    incomingUnreadCount,
    terminationUnreadCount,
    totalUnreadCount,
  };
};

export const setOwnerRentalUnreadCounts = (
  queryClient: ReturnType<typeof useQueryClient>,
  counts: unknown,
) => {
  const normalized = normalizeOwnerRentalUnreadCounts(counts);
  if (!normalized) return;

  queryClient.setQueryData(ownerRentalUnreadCountsQueryKey, normalized);
};

export const bumpOwnerRentalUnreadCounts = (
  queryClient: ReturnType<typeof useQueryClient>,
  delta: { incoming?: number; termination?: number },
) => {
  queryClient.setQueryData<OwnerRentalUnreadCounts>(
    ownerRentalUnreadCountsQueryKey,
    (previous) => {
      const current = previous ?? {
        incomingUnreadCount: 0,
        terminationUnreadCount: 0,
        totalUnreadCount: 0,
      };
      const incomingUnreadCount =
        current.incomingUnreadCount + (delta.incoming ?? 0);
      const terminationUnreadCount =
        current.terminationUnreadCount + (delta.termination ?? 0);

      return {
        incomingUnreadCount,
        terminationUnreadCount,
        totalUnreadCount: incomingUnreadCount + terminationUnreadCount,
      };
    },
  );
};
