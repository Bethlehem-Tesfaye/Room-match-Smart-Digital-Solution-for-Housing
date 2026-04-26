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
  rentRequestByConversation: (conversationId: string) =>
    ["contracts", "conversation", conversationId] as const,
  ownerPendingRentRequests: ["contracts", "owner", "pending"] as const,
};

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
    const existing = byConversation.get(conversationId);

    if (!existing) {
      byConversation.set(conversationId, {
        conversationId,
        lastMessageAt,
        listingId,
        listing,
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
      });
      return;
    }

    if (!existing.listing && listing) {
      byConversation.set(conversationId, {
        ...existing,
        listing,
        listingId: existing.listingId || listingId,
      });
    }
  });

  return [...byConversation.values()].sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
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

interface UseMessageSocketOptions {
  enabled: boolean;
  onReceiveMessage?: (message: Message) => void;
  onReceiveNotification?: (notification: Notification) => void;
}

export const useMessageSocket = ({
  enabled,
  onReceiveMessage,
  onReceiveNotification,
}: UseMessageSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);
  const onReceiveMessageRef = useRef<typeof onReceiveMessage>(onReceiveMessage);
  const onReceiveNotificationRef = useRef<typeof onReceiveNotification>(
    onReceiveNotification,
  );
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    onReceiveMessageRef.current = onReceiveMessage;
  }, [onReceiveMessage]);

  useEffect(() => {
    onReceiveNotificationRef.current = onReceiveNotification;
  }, [onReceiveNotification]);

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
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("message:receive", (message: Message) => {
      onReceiveMessageRef.current?.(message);
    });

    socket.on("notification:receive", (notification: Notification) => {
      onReceiveNotificationRef.current?.(notification);
    });

    socketRef.current = socket;

    return () => {
      setIsConnected(false);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

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
        queryKey: messageQueryKeys.ownerPendingRentRequests,
      });
    },
  });
};

const useUpdateRentRequestStatus = (
  status: Extract<ContractStatus, "APPROVED" | "ENDED">,
) => {
  const queryClient = useQueryClient();
  const endpoint = status === "APPROVED" ? "accept" : "reject";

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
        queryKey: messageQueryKeys.ownerPendingRentRequests,
      });
    },
  });
};

export const useAcceptRentRequest = () =>
  useUpdateRentRequestStatus("APPROVED");

export const useRejectRentRequest = () => useUpdateRentRequestStatus("ENDED");

export const useCompleteRentPayment = (): UseMutationResult<
  RentRequest,
  Error,
  { contractId: string }
> => {
  const queryClient = useQueryClient();

  return useMutation<RentRequest, Error, { contractId: string }>({
    mutationFn: async ({ contractId }) => {
      try {
        const response = await api.patch<{ contract: RentRequest }>(
          `/api/contracts/${contractId}/complete-payment`,
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
        queryKey: messageQueryKeys.ownerPendingRentRequests,
      });
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.conversationList,
      });
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
