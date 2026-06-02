import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { api } from "../../../lib/axios";
import type {
  DashboardListingCounts,
  DashboardMyPropertiesResponse,
  GetMyListingCountsResponse,
} from "../types/types";
import type {
  BrowsePropertiesQuery,
  Property,
} from "../../property/types/type";

const dashboardQueryKeys = {
  listingCounts: ["dashboard", "listing-counts"] as const,
  myPropertiesOverview: (query: BrowsePropertiesQuery) =>
    ["dashboard", "my-properties-overview", query] as const,
};

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

export const useMyListingCounts = (): UseQueryResult<
  DashboardListingCounts,
  Error
> => {
  return useQuery<DashboardListingCounts, Error>({
    queryKey: dashboardQueryKeys.listingCounts,
    queryFn: async () => {
      try {
        const res = await api.get<GetMyListingCountsResponse>(
          "/api/properties/my-properties/counts",
        );

        return res.data.counts;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};

export const useMyPropertiesOverview = (
  query: BrowsePropertiesQuery = {},
): UseQueryResult<DashboardMyPropertiesResponse, Error> => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 4;
  const search = query.search ?? "";

  return useQuery<DashboardMyPropertiesResponse, Error>({
    queryKey: dashboardQueryKeys.myPropertiesOverview({ page, limit, search }),
    queryFn: async () => {
      try {
        const res = await api.get<DashboardMyPropertiesResponse>(
          "/api/properties/my-properties",
          {
            params: {
              page,
              limit,
              ...(search ? { search } : {}),
            },
          },
        );

        return {
          properties: (res.data.properties ?? []) as Property[],
          pagination: res.data.pagination,
        };
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};
