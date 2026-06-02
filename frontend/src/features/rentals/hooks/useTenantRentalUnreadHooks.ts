import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api } from "../../../lib/axios";

export interface TenantRentalUnreadCounts {
  requestedUnreadCount: number;
  terminationUnreadCount: number;
  totalUnreadCount: number;
}

export const tenantRentalUnreadCountsQueryKey = [
  "contracts",
  "tenant",
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

export const normalizeTenantRentalUnreadCounts = (
  value: unknown,
): TenantRentalUnreadCounts | null => {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const requestedUnreadCount = toCount(raw.requestedUnreadCount);
  const terminationUnreadCount = toCount(raw.terminationUnreadCount);
  const totalUnreadCount = toCount(raw.totalUnreadCount);

  if (
    requestedUnreadCount === null ||
    terminationUnreadCount === null ||
    totalUnreadCount === null
  ) {
    return null;
  }

  return {
    requestedUnreadCount,
    terminationUnreadCount,
    totalUnreadCount,
  };
};

export const useTenantRentalUnreadCounts = (
  enabled = true,
): UseQueryResult<TenantRentalUnreadCounts, Error> => {
  return useQuery<TenantRentalUnreadCounts, Error>({
    queryKey: tenantRentalUnreadCountsQueryKey,
    enabled,
    queryFn: async () => {
      try {
        const response = await api.get<TenantRentalUnreadCounts>(
          "/api/contracts/tenant/unread-counts",
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

const parseMarkReadResponse = (data: {
  counts?: TenantRentalUnreadCounts;
  requestedUnreadCount?: number;
  terminationUnreadCount?: number;
  totalUnreadCount?: number;
}): TenantRentalUnreadCounts => {
  if (data.counts) {
    return data.counts;
  }

  return {
    requestedUnreadCount: data.requestedUnreadCount ?? 0,
    terminationUnreadCount: data.terminationUnreadCount ?? 0,
    totalUnreadCount: data.totalUnreadCount ?? 0,
  };
};

export const useMarkTenantRequestedRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.patch(
        "/api/contracts/tenant/mark-requested-read",
      );

      return parseMarkReadResponse(response.data);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: tenantRentalUnreadCountsQueryKey,
      });

      const previous = queryClient.getQueryData<TenantRentalUnreadCounts>(
        tenantRentalUnreadCountsQueryKey,
      );

      if (previous) {
        queryClient.setQueryData<TenantRentalUnreadCounts>(
          tenantRentalUnreadCountsQueryKey,
          {
            requestedUnreadCount: 0,
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
          tenantRentalUnreadCountsQueryKey,
          context.previous,
        );
      }
    },
    onSuccess: (counts) => {
      queryClient.setQueryData(tenantRentalUnreadCountsQueryKey, counts);
    },
  });
};

export const useMarkTenantTerminationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.patch(
        "/api/contracts/tenant/mark-termination-read",
      );

      return parseMarkReadResponse(response.data);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: tenantRentalUnreadCountsQueryKey,
      });

      const previous = queryClient.getQueryData<TenantRentalUnreadCounts>(
        tenantRentalUnreadCountsQueryKey,
      );

      if (previous) {
        queryClient.setQueryData<TenantRentalUnreadCounts>(
          tenantRentalUnreadCountsQueryKey,
          {
            requestedUnreadCount: previous.requestedUnreadCount,
            terminationUnreadCount: 0,
            totalUnreadCount: previous.requestedUnreadCount,
          },
        );
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          tenantRentalUnreadCountsQueryKey,
          context.previous,
        );
      }
    },
    onSuccess: (counts) => {
      queryClient.setQueryData(tenantRentalUnreadCountsQueryKey, counts);
    },
  });
};

export const setTenantRentalUnreadCounts = (
  queryClient: ReturnType<typeof useQueryClient>,
  counts: unknown,
) => {
  const normalized = normalizeTenantRentalUnreadCounts(counts);
  if (!normalized) return;

  queryClient.setQueryData(tenantRentalUnreadCountsQueryKey, normalized);
};
