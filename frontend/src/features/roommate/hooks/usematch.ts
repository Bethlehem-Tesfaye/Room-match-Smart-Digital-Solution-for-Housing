import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";

import { api } from "../../../lib/axios";

export type RoommateMatch = {
  _id: string;
  userId: string;
  targetUserId: string;
  score: number;
  propertyId?: string | null;
  leaseEndDate?: string | null;
  remainingDays?: number | null;
  snapshot?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

export type GetMatchesResponse = {
  matches: RoommateMatch[];
};

export type GenerateMatchesResponse = {
  message: string;
  count: number;
};

const matchQueryKeys = {
  all: ["match"] as const,
  myMatches: ["match", "me"] as const,
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

// get matches
export const useMyMatches = (): UseQueryResult<RoommateMatch[], Error> => {
  return useQuery<RoommateMatch[], Error>({
    queryKey: matchQueryKeys.myMatches,
    queryFn: async () => {
      try {
        const res = await api.get<GetMatchesResponse>("/api/match");

        return res.data.matches ?? [];
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};

export const useGenerateMatches = (): UseMutationResult<
  GenerateMatchesResponse,
  Error,
  void
> => {
  const queryClient = useQueryClient();

  return useMutation<GenerateMatchesResponse, Error, void>({
    mutationFn: async () => {
      try {
        const res = await api.post<GenerateMatchesResponse>(
          "/api/match/generate",
        );

        return res.data;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },

    onSuccess: () => {
      // refresh match list after recompute
      queryClient.invalidateQueries({
        queryKey: matchQueryKeys.myMatches,
      });
    },
  });
};
