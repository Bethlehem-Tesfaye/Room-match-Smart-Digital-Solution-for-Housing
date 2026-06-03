import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { api } from "../../../lib/axios";
import type { ReportReason } from "../constants";

const reportQueryKeys = {
  blockedUsers: ["reports", "blocked-users"] as const,
  blockStatus: (userId: string) => ["reports", "block-status", userId] as const,
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

type ReportPayload = {
  reason: ReportReason;
  description?: string;
};

export const useReportListing = () =>
  useMutation({
    mutationFn: async ({
      propertyId,
      ...payload
    }: ReportPayload & { propertyId: string }) => {
      try {
        const res = await api.post<{ message: string }>(
          `/api/reports/listings/${propertyId}`,
          payload,
        );
        return res.data;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });

export const useReportUser = () =>
  useMutation({
    mutationFn: async ({
      userId,
      ...payload
    }: ReportPayload & { userId: string }) => {
      try {
        const res = await api.post<{ message: string }>(
          `/api/reports/users/${userId}`,
          payload,
        );
        return res.data;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });

export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      try {
        const res = await api.post<{ message: string }>(
          `/api/reports/blocks/${userId}`,
        );
        return res.data;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<UserBlockStatus>(
        reportQueryKeys.blockStatus(variables.userId),
        (current) => ({
          blockedByMe: true,
          blockedByThem: current?.blockedByThem ?? false,
        }),
      );
      queryClient.invalidateQueries({
        queryKey: reportQueryKeys.blockStatus(variables.userId),
      });
      queryClient.invalidateQueries({ queryKey: reportQueryKeys.blockedUsers });
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      try {
        const res = await api.delete<{ message: string }>(
          `/api/reports/blocks/${userId}`,
        );
        return res.data;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<UserBlockStatus>(
        reportQueryKeys.blockStatus(variables.userId),
        (current) => ({
          blockedByMe: false,
          blockedByThem: current?.blockedByThem ?? false,
        }),
      );
      queryClient.invalidateQueries({
        queryKey: reportQueryKeys.blockStatus(variables.userId),
      });
      queryClient.invalidateQueries({ queryKey: reportQueryKeys.blockedUsers });
    },
  });
};

export type UserBlockStatus = {
  blockedByMe: boolean;
  blockedByThem: boolean;
};

export const useUserBlockStatus = (userId?: string) =>
  useQuery({
    queryKey: reportQueryKeys.blockStatus(userId ?? ""),
    queryFn: async () => {
      const res = await api.get<UserBlockStatus>(
        `/api/reports/blocks/${userId}/status`,
      );
      return res.data;
    },
    enabled: Boolean(userId),
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  });

export const useUserBlockSync = (partnerUserId?: string) => {
  const queryClient = useQueryClient();
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    if (!partnerUserId) return;

    const socket: Socket = io(apiUrl, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.on(
      "user-block:updated",
      (payload: UserBlockStatus & { otherUserId?: string }) => {
        if (payload.otherUserId !== partnerUserId) return;

        queryClient.setQueryData<UserBlockStatus>(
          reportQueryKeys.blockStatus(partnerUserId),
          {
            blockedByMe: payload.blockedByMe ?? false,
            blockedByThem: payload.blockedByThem ?? false,
          },
        );
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [partnerUserId, queryClient]);
};

export type BlockedUserSummary = {
  userId: string;
  name: string;
  email: string;
};

export const useBlockedUsers = () =>
  useQuery({
    queryKey: reportQueryKeys.blockedUsers,
    queryFn: async () => {
      const res = await api.get<{ users: BlockedUserSummary[] }>(
        "/api/reports/blocks",
      );
      return res.data.users ?? [];
    },
  });
