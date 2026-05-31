import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { api } from "../../../lib/axios";
import {
  ownerRentalUnreadCountsQueryKey,
  setOwnerRentalUnreadCounts,
} from "../../dashbord/hooks/useRentalUnreadHooks";
import {
  setTenantRentalUnreadCounts,
  tenantRentalUnreadCountsQueryKey,
} from "../../rentals/hooks/useTenantRentalUnreadHooks";
import type {
  Conversation,
  ConversationParticipant,
  ContractStatus,
  ConversationSummary,
  ConversationSummaryApiItem,
  InitiateConversationInput,
  Message,
  MessageSendAck,
  MessageSendInput,
  Notification,
  RentRequest,
  SendPropertyMessageInput,
  SendPropertyMessageResult,
} from "../types/type";

const messageQueryKeys = {
  conversationList: ["messages", "conversations"] as const,
  participants: (conversationId: string) =>
    ["messages", "participants", conversationId] as const,
  messages: (conversationId: string, cursor: string | null) =>
    ["messages", "thread", conversationId, cursor] as const,
  unreadNotificationCounts: ["notifications", "unread-counts"] as const,
  ownerActiveRentRequests: ["contracts", "owner", "active"] as const,
  rentRequestByConversation: (conversationId: string) =>
    ["contracts", "conversation", conversationId] as const,
  ownerPendingRentRequests: ["contracts", "owner", "pending"] as const,
  ownerAcceptedRentRequests: ["contracts", "owner", "accepted"] as const,
  ownerTerminationRequests: ["contracts", "owner", "termination"] as const,
  tenantRentalContracts: ["contracts", "tenant", "my-rentals"] as const,
};

const pendingPaymentStorageKey = "pending_rental_payment_contract_id";

const getErrorMessage = (error: unknown): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
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

// Add isRoommateChat to every byConversation.set call in normalizeConversationSummaries

// REPLACE the entire normalizeConversationSummaries function:
const normalizeConversationSummaries = (
  rows: ConversationSummaryApiItem[],
): ConversationSummary[] => {
  const byConversation = new Map<string, ConversationSummary>();

  rows.forEach((row) => {
    const conversationId = row.conversation?._id || row.conversationId;
    if (!conversationId) return;

    const lastMessageAt = row.conversation?.lastMessageAt || null;
    const listingId =
      row.conversation?.listingId || row.conversation?.propertyId || null;
    const listing = row.conversation?.listing || null;
    const isRoommateChat = row.conversation?.isRoommateChat ?? false; // NEW
    const existing = byConversation.get(conversationId);

    if (!existing) {
      byConversation.set(conversationId, {
        conversationId,
        lastMessageAt,
        listingId,
        listing,
        isRoommateChat, // NEW
      });
      return;
    }

    if (
      lastMessageAt &&
      (!existing.lastMessageAt ||
        new Date(lastMessageAt).getTime() >
          new Date(existing.lastMessageAt).getTime())
    ) {
      byConversation.set(conversationId, {
        conversationId,
        lastMessageAt,
        listingId: existing.listingId || listingId,
        listing: existing.listing || listing,
        isRoommateChat: existing.isRoommateChat || isRoommateChat, // NEW
      });
      return;
    }

    if (!existing.listing && listing) {
      byConversation.set(conversationId, {
        ...existing,
        listing,
        listingId: existing.listingId || listingId,
        // isRoommateChat already on existing via spread
      });
    }
  });

  return [...byConversation.values()].sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
};

export interface UnreadMessageCounts {
  total: number;
  byConversation: Record<string, number>;
  byType: Record<string, number>;
}

export const useUnreadMessageCounts = (enabled = true) => {
  return useQuery<UnreadMessageCounts, Error>({
    queryKey: messageQueryKeys.unreadNotificationCounts,
    enabled,
    queryFn: async () => {
      try {
        const response = await api.get<UnreadMessageCounts>(
          "/api/notifications/unread-counts",
        );

        return response.data;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    refetchInterval: enabled ? 30000 : false,
  });
};

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      api.patch(`/api/notifications/read-by-conversation/${conversationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.unreadNotificationCounts,
      });
    },
  });
};

export const useMarkRentalNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.patch("/api/notifications/read-rentals"),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.unreadNotificationCounts,
      });
    },
  });
};
export const useConversations = (): UseQueryResult<
  ConversationSummary[],
  Error
> => {
  return useQuery<ConversationSummary[], Error>({
    queryKey: messageQueryKeys.conversationList,
    queryFn: async () => {
      try {
        const response = await api.get<{
          conversations: ConversationSummaryApiItem[];
        }>("/api/conversations");

        return normalizeConversationSummaries(
          response.data.conversations || [],
        );
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};

export const useConversationParticipants = (
  conversationId?: string,
): UseQueryResult<ConversationParticipant[], Error> => {
  return useQuery<ConversationParticipant[], Error>({
    queryKey: messageQueryKeys.participants(conversationId ?? ""),
    enabled: !!conversationId,
    queryFn: async () => {
      try {
        const response = await api.get<{
          participants: ConversationParticipant[];
        }>(`/api/conversations/${conversationId}/participants`);

        return response.data.participants || [];
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};

export const useConversationMessages = (conversationId?: string) => {
  const [cursor, setCursor] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const query = useQuery<Message[], Error>({
    queryKey: messageQueryKeys.messages(conversationId ?? "", cursor),
    enabled: !!conversationId,
    queryFn: async () => {
      try {
        const response = await api.get<{ messages: Message[] }>(
          `/api/messages/${conversationId}`,
          {
            params: {
              limit: 20,
              ...(cursor ? { cursor } : {}),
            },
          },
        );

        return response.data.messages || [];
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });

  useEffect(() => {
    setCursor(null);
    setMessages([]);
    setHasMore(true);
  }, [conversationId]);

  useEffect(() => {
    const fetchedMessages = query.data;

    if (!fetchedMessages) return;

    if (!cursor) {
      setMessages((prev) => {
        const byId = new Map<string, Message>();

        [...fetchedMessages, ...prev].forEach((message) => {
          byId.set(message._id, message);
        });

        return [...byId.values()].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
      setHasMore(fetchedMessages.length >= 20);
      return;
    }

    setMessages((prev) => {
      const byId = new Map<string, Message>();

      [...fetchedMessages, ...prev].forEach((message) => {
        byId.set(message._id, message);
      });

      return [...byId.values()].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });

    setHasMore(fetchedMessages.length >= 20);
  }, [query.data, cursor]);

  const loadOlder = useCallback(() => {
    if (!messages.length || query.isFetching || !hasMore) return;

    setCursor(messages[0].createdAt);
  }, [hasMore, messages, query.isFetching]);

  const appendMessage = useCallback((incomingMessage: Message) => {
    setMessages((prev) => {
      if (prev.some((existing) => existing._id === incomingMessage._id)) {
        return prev;
      }

      return [...prev, incomingMessage].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });
  }, []);

  return {
    ...query,
    messages,
    hasMore,
    loadOlder,
    appendMessage,
  };
};

export const useInitiateConversation = (): UseMutationResult<
  Conversation,
  Error,
  InitiateConversationInput
> => {
  const queryClient = useQueryClient();

  return useMutation<Conversation, Error, InitiateConversationInput>({
    mutationFn: async (payload) => {
      try {
        const response = await api.post<{ conversation: Conversation }>(
          "/api/conversations/initiate",
          payload,
        );

        return response.data.conversation;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.conversationList,
      });
    },
  });
};

export const useSendHttpMessage = (): UseMutationResult<
  Message,
  Error,
  MessageSendInput
> => {
  return useMutation<Message, Error, MessageSendInput>({
    mutationFn: async ({ conversationId, content, messageType = "Text" }) => {
      if (!conversationId) {
        throw new Error("Conversation id is required");
      }

      try {
        const response = await api.post<{ message: Message }>("/api/messages", {
          conversationId,
          content,
          messageType,
        });

        return response.data.message;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};

export const useSendPropertyMessage = (): UseMutationResult<
  SendPropertyMessageResult,
  Error,
  SendPropertyMessageInput
> => {
  const initiateConversation = useInitiateConversation();
  const sendHttpMessage = useSendHttpMessage();

  return useMutation<
    SendPropertyMessageResult,
    Error,
    SendPropertyMessageInput
  >({
    mutationFn: async ({ ownerId, listingId, content }) => {
      const conversation = await initiateConversation.mutateAsync({
        userId: ownerId,
        listingId,
      });

      const message = await sendHttpMessage.mutateAsync({
        conversationId: conversation._id,
        content,
      });

      return {
        conversationId: conversation._id,
        message,
      };
    },
  });
};

export interface RentalUnreadUpdatePayload {
  incomingUnreadCount: number;
  terminationUnreadCount: number;
  totalUnreadCount: number;
}

export interface TenantRentalUnreadUpdatePayload {
  requestedUnreadCount: number;
  terminationUnreadCount: number;
  totalUnreadCount: number;
}

interface UseMessageSocketOptions {
  enabled: boolean;
  onReceiveMessage?: (message: Message) => void;
  onReceiveNotification?: (notification: Notification) => void;
  onRentalUnreadUpdate?: (counts: RentalUnreadUpdatePayload) => void;
  onTenantRentalUnreadUpdate?: (counts: TenantRentalUnreadUpdatePayload) => void;
}

export const useMessageSocket = ({
  enabled,
  onReceiveMessage,
  onReceiveNotification,
  onRentalUnreadUpdate,
  onTenantRentalUnreadUpdate,
}: UseMessageSocketOptions) => {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const onReceiveMessageRef = useRef<typeof onReceiveMessage>(onReceiveMessage);
  const onReceiveNotificationRef = useRef<typeof onReceiveNotification>(
    onReceiveNotification,
  );
  const onRentalUnreadUpdateRef = useRef<typeof onRentalUnreadUpdate>(
    onRentalUnreadUpdate,
  );
  const onTenantRentalUnreadUpdateRef = useRef<
    typeof onTenantRentalUnreadUpdate
  >(onTenantRentalUnreadUpdate);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    onReceiveMessageRef.current = onReceiveMessage;
  }, [onReceiveMessage]);

  useEffect(() => {
    onReceiveNotificationRef.current = onReceiveNotification;
  }, [onReceiveNotification]);

  useEffect(() => {
    onRentalUnreadUpdateRef.current = onRentalUnreadUpdate;
  }, [onRentalUnreadUpdate]);

  useEffect(() => {
    onTenantRentalUnreadUpdateRef.current = onTenantRentalUnreadUpdate;
  }, [onTenantRentalUnreadUpdate]);

  useEffect(() => {
    if (!enabled) return;

    const socketUrl = import.meta.env.VITE_API_URL;
    if (!socketUrl) return;

    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      setIsConnected(true);
      void queryClient.invalidateQueries({
        queryKey: ownerRentalUnreadCountsQueryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: tenantRentalUnreadCountsQueryKey,
      });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("message:receive", (message: Message) => {
      onReceiveMessageRef.current?.(message);
    });

    socket.on("notification:receive", (notification: Notification) => {
      if (notification.type === "ListingUpdate") {
        void queryClient.invalidateQueries({
          queryKey: ownerRentalUnreadCountsQueryKey,
        });
        void queryClient.invalidateQueries({
          queryKey: tenantRentalUnreadCountsQueryKey,
        });
      }

      onReceiveNotificationRef.current?.(notification);
    });

    socket.on(
      "rental:unread-update",
      (counts: RentalUnreadUpdatePayload) => {
        setOwnerRentalUnreadCounts(queryClient, counts);
        onRentalUnreadUpdateRef.current?.(counts);
      },
    );

    socket.on(
      "tenant-rental:unread-update",
      (counts: TenantRentalUnreadUpdatePayload) => {
        setTenantRentalUnreadCounts(queryClient, counts);
        onTenantRentalUnreadUpdateRef.current?.(counts);
      },
    );

    socketRef.current = socket;

    return () => {
      setIsConnected(false);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, queryClient]);

  const sendRealtimeMessage = useCallback(
    (payload: MessageSendInput): Promise<MessageSendAck> => {
      return new Promise((resolve) => {
        const socket = socketRef.current;

        if (!socket || !socket.connected) {
          resolve({ ok: false, error: "Realtime socket is not connected" });
          return;
        }

        socket.emit("message:send", payload, (ack: MessageSendAck) => {
          resolve(ack);
        });
      });
    },
    [],
  );

  return {
    socket: socketRef.current,
    isConnected,
    sendRealtimeMessage,
  };
};

export const useConversationPartner = (
  conversationId: string | undefined,
  currentUserId: string | undefined,
) => {
  const participantsQuery = useConversationParticipants(conversationId);
  const participants = participantsQuery.data || [];
  const partner =
    participants.find(
      (participant) => participant.userId?._id !== currentUserId,
    )?.userId || null;

  return {
    ...participantsQuery,
    partner,
  };
};

export const useConversationPartnersMap = (
  conversationIds: string[],
  currentUserId: string | undefined,
) => {
  const uniqueConversationIds = [...new Set(conversationIds)].filter(Boolean);

  const participantQueries = useQueries({
    queries: uniqueConversationIds.map((conversationId) => ({
      queryKey: messageQueryKeys.participants(conversationId),
      queryFn: async () => {
        const response = await api.get<{
          participants: ConversationParticipant[];
        }>(`/api/conversations/${conversationId}/participants`);

        return response.data.participants || [];
      },
      staleTime: 60_000,
    })),
  });

  const partnerByConversationId: Record<
    string,
    ConversationParticipant["userId"]
  > = {};

  uniqueConversationIds.forEach((conversationId, index) => {
    const query = participantQueries[index];
    const participants = query.data || [];

    const partner = participants.find(
      (participant) => participant.userId?._id !== currentUserId,
    )?.userId;

    if (partner) {
      partnerByConversationId[conversationId] = partner;
    }
  });

  const isLoading = participantQueries.some((query) => query.isLoading);

  return {
    partnerByConversationId,
    isLoading,
  };
};

export const useConversationRentRequest = (
  conversationId?: string,
): UseQueryResult<RentRequest | null, Error> => {
  return useQuery<RentRequest | null, Error>({
    queryKey: messageQueryKeys.rentRequestByConversation(conversationId ?? ""),
    enabled: !!conversationId,
    queryFn: async () => {
      try {
        const response = await api.get<{ contract: RentRequest | null }>(
          `/api/contracts/conversation/${conversationId}`,
        );

        return response.data.contract ?? null;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};

export const useCreateRentRequest = (): UseMutationResult<
  RentRequest,
  Error,
  { conversationId: string }
> => {
  const queryClient = useQueryClient();

  return useMutation<RentRequest, Error, { conversationId: string }>({
    mutationFn: async ({ conversationId }) => {
      try {
        const response = await api.post<{ contract: RentRequest }>(
          "/api/contracts/request",
          { conversationId },
        );

        return response.data.contract;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: (contract) => {
      queryClient.setQueryData(
        messageQueryKeys.rentRequestByConversation(contract.conversationId),
        contract,
      );
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.tenantRentalContracts,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerPendingRentRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerAcceptedRentRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerActiveRentRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerTerminationRequests,
      });
      queryClient.invalidateQueries({
        queryKey: ownerRentalUnreadCountsQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: tenantRentalUnreadCountsQueryKey,
      });
    },
  });
};

const useUpdateRentRequestStatus = (
  status: Extract<ContractStatus, "RESERVED" | "REJECTED">,
) => {
  const queryClient = useQueryClient();
  const endpoint = status === "RESERVED" ? "accept" : "reject";

  return useMutation<RentRequest, Error, { contractId: string }>({
    mutationFn: async ({ contractId }) => {
      try {
        const response = await api.patch<{ contract: RentRequest }>(
          `/api/contracts/${contractId}/${endpoint}`,
        );

        return response.data.contract;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: (contract) => {
      queryClient.setQueryData(
        messageQueryKeys.rentRequestByConversation(contract.conversationId),
        contract,
      );
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.tenantRentalContracts,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerPendingRentRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerAcceptedRentRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerActiveRentRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerTerminationRequests,
      });
      queryClient.invalidateQueries({
        queryKey: ownerRentalUnreadCountsQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: tenantRentalUnreadCountsQueryKey,
      });
    },
  });
};

export const useAcceptRentRequest = () =>
  useUpdateRentRequestStatus("RESERVED");

export const useRejectRentRequest = () =>
  useUpdateRentRequestStatus("REJECTED");

export const useCancelRentRequest = (): UseMutationResult<
  RentRequest,
  Error,
  { contractId: string }
> => {
  const queryClient = useQueryClient();

  return useMutation<RentRequest, Error, { contractId: string }>({
    mutationFn: async ({ contractId }) => {
      try {
        const response = await api.delete<{ contract: RentRequest }>(
          `/api/contracts/${contractId}`,
        );

        return response.data.contract;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: (contract) => {
      queryClient.setQueryData(
        messageQueryKeys.rentRequestByConversation(contract.conversationId),
        contract,
      );
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.tenantRentalContracts,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerPendingRentRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerAcceptedRentRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerActiveRentRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerTerminationRequests,
      });
      queryClient.invalidateQueries({
        queryKey: ownerRentalUnreadCountsQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: tenantRentalUnreadCountsQueryKey,
      });
    },
  });
};

export const useCreateTerminationNotice = (): UseMutationResult<
  RentRequest,
  Error,
  { contractId: string }
> => {
  const queryClient = useQueryClient();

  return useMutation<RentRequest, Error, { contractId: string }>({
    mutationFn: async ({ contractId }) => {
      try {
        const response = await api.post<{ contract: RentRequest }>(
          `/api/contracts/${contractId}/terminate`,
        );

        return response.data.contract;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: (contract) => {
      queryClient.setQueryData(
        messageQueryKeys.rentRequestByConversation(contract.conversationId),
        contract,
      );
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.tenantRentalContracts,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerPendingRentRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerAcceptedRentRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerActiveRentRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerTerminationRequests,
      });
      queryClient.invalidateQueries({
        queryKey: ownerRentalUnreadCountsQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: tenantRentalUnreadCountsQueryKey,
      });
    },
  });
};

export const useWithdrawTerminationNotice = (): UseMutationResult<
  RentRequest,
  Error,
  { contractId: string }
> => {
  const queryClient = useQueryClient();

  return useMutation<RentRequest, Error, { contractId: string }>({
    mutationFn: async ({ contractId }) => {
      try {
        const response = await api.post<{ contract: RentRequest }>(
          `/api/contracts/${contractId}/withdraw-termination`,
        );

        return response.data.contract;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: (contract) => {
      queryClient.setQueryData(
        messageQueryKeys.rentRequestByConversation(contract.conversationId),
        contract,
      );
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.tenantRentalContracts,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerPendingRentRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerAcceptedRentRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.ownerTerminationRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.conversationList,
      });
      queryClient.invalidateQueries({
        queryKey: ownerRentalUnreadCountsQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: tenantRentalUnreadCountsQueryKey,
      });
    },
  });
};

export const useCreateTerminationRequest = useCreateTerminationNotice;
export const useAcceptTerminationRequest = useWithdrawTerminationNotice;
export const useRejectTerminationRequest = useWithdrawTerminationNotice;

export const useCompleteRentPayment = (): UseMutationResult<
  void,
  Error,
  { contractId: string }
> => {
  return useMutation<void, Error, { contractId: string }>({
    mutationFn: async ({ contractId }) => {
      try {
        const response = await api.post<{ checkout_url: string }>(
          "/api/payments/initialize",
          { contractId },
        );

        const checkoutUrl = response.data.checkout_url;

        if (!checkoutUrl) {
          throw new Error("Missing checkout URL");
        }

        window.localStorage.setItem(pendingPaymentStorageKey, contractId);
        window.location.href = checkoutUrl;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};

export const useOwnerPendingRentRequests = (): UseQueryResult<
  RentRequest[],
  Error
> => {
  return useQuery<RentRequest[], Error>({
    queryKey: messageQueryKeys.ownerPendingRentRequests,
    queryFn: async () => {
      try {
        const response = await api.get<{ contracts: RentRequest[] }>(
          "/api/contracts/owner/pending",
        );

        return response.data.contracts ?? [];
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
  });
};

export const useOwnerAcceptedRentRequests = (): UseQueryResult<
  RentRequest[],
  Error
> => {
  return useQuery<RentRequest[], Error>({
    queryKey: messageQueryKeys.ownerAcceptedRentRequests,
    queryFn: async () => {
      try {
        const response = await api.get<{ contracts: RentRequest[] }>(
          "/api/contracts/owner/accepted",
        );

        return response.data.contracts ?? [];
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
};

export const useOwnerActiveRentRequests = (): UseQueryResult<
  RentRequest[],
  Error
> => {
  return useQuery<RentRequest[], Error>({
    queryKey: messageQueryKeys.ownerActiveRentRequests,
    queryFn: async () => {
      try {
        const response = await api.get<{ contracts: RentRequest[] }>(
          "/api/contracts/owner/active",
        );

        return response.data.contracts ?? [];
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
};

export const useOwnerTerminationRequests = (): UseQueryResult<
  RentRequest[],
  Error
> => {
  return useQuery<RentRequest[], Error>({
    queryKey: messageQueryKeys.ownerTerminationRequests,
    queryFn: async () => {
      try {
        const response = await api.get<{ contracts: RentRequest[] }>(
          "/api/contracts/owner/termination-notices",
        );

        return response.data.contracts ?? [];
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
};

export const useTenantRentalContracts = (): UseQueryResult<
  RentRequest[],
  Error
> => {
  return useQuery<RentRequest[], Error>({
    queryKey: messageQueryKeys.tenantRentalContracts,
    queryFn: async () => {
      try {
        const response = await api.get<{ contracts: RentRequest[] }>(
          "/api/contracts/tenant/my-rentals",
        );

        return response.data.contracts ?? [];
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
};
