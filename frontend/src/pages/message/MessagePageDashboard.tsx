import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import ConversationList from "../../features/message/components/ConversationList";
import MessageInbox from "../../features/message/components/MessageInbox";
import {
  useConversationMessages,
  useConversationPartnersMap,
  useConversations,
  useMessageSocket,
  useSendHttpMessage,
} from "../../features/message/hooks/useMessageHooks";
import type { Message } from "../../features/message/types/type";
import type { ConversationSummary } from "../../features/message/types/type";
import DashboardNavbar from "../../features/dashbord/componets/DashboardNavbar";

const normalizeConversationId = (value: unknown): string => {
  if (typeof value === "string") return value;

  if (
    typeof value === "object" &&
    value !== null &&
    "_id" in value &&
    typeof (value as { _id?: unknown })._id === "string"
  ) {
    return (value as { _id: string })._id;
  }

  return String(value ?? "");
};

function MessagePageDashboard() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useCurrentUser();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(() => searchParams.get("conversationId") || undefined);

  const conversationsQuery = useConversations();
  const messagesState = useConversationMessages(selectedConversationId);
  const sendHttpMessage = useSendHttpMessage();

  const conversations = useMemo(() => {
    return conversationsQuery.data || [];
  }, [conversationsQuery.data]);

  const { partnerByConversationId, isLoading: isPartnersLoading } =
    useConversationPartnersMap(
      conversations.map((conversation) => conversation.conversationId),
      user?.id,
    );

  const selectedPartner = selectedConversationId
    ? partnerByConversationId[selectedConversationId]
    : null;

  const setConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSearchParams({ conversationId });
  };

  const getConversationLabel = (conversationId: string) => {
    const partner = partnerByConversationId[conversationId];
    if (!partner) return undefined;
    return partner.name || partner.email || undefined;
  };

  const resolveSenderName = (sender: Message["senderId"]) => {
    if (typeof sender !== "string") {
      return sender.name || sender.email || sender._id;
    }

    if (sender === user?.id) {
      return "You";
    }

    if (selectedPartner && sender === selectedPartner._id) {
      return selectedPartner.name || selectedPartner.email || undefined;
    }

    return undefined;
  };

  const upsertIncomingMessage = (incomingMessage: Message) => {
    const incomingConversationId = normalizeConversationId(
      incomingMessage.conversationId,
    );
    const currentConversationId = normalizeConversationId(
      selectedConversationId,
    );

    if (
      incomingConversationId &&
      incomingConversationId === currentConversationId
    ) {
      messagesState.appendMessage(incomingMessage);
      messagesState.refetch();
    } else if (!selectedConversationId && incomingConversationId) {
      setConversation(incomingConversationId);
    }

    if (incomingConversationId) {
      queryClient.setQueryData<ConversationSummary[]>(
        ["messages", "conversations"],
        (previous) => {
          const previousList = previous || [];
          const now = new Date().toISOString();

          const existing = previousList.find(
            (item) => item.conversationId === incomingConversationId,
          );


          const updatedList = existing
            ? previousList.map((item) =>
                item.conversationId === incomingConversationId
                  ? { ...item, lastMessageAt: now }
                  : item,
              )
            : [
                {
                  conversationId: incomingConversationId,
                  lastMessageAt: now,
                },
                ...previousList,
              ];

          return [...updatedList].sort((a, b) => {
            const aTime = a.lastMessageAt
              ? new Date(a.lastMessageAt).getTime()
              : 0;
            const bTime = b.lastMessageAt
              ? new Date(b.lastMessageAt).getTime()
              : 0;
            return bTime - aTime;
          });
        },
      );
    }

    conversationsQuery.refetch();
  };

  const socketState = useMessageSocket({
    enabled: !!user,
    onReceiveMessage: upsertIncomingMessage,
    onReceiveNotification: () => {
      conversationsQuery.refetch();
    },
  });

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;

    const socketAck = await socketState.sendRealtimeMessage({
      conversationId: selectedConversationId,
      content,
      messageType: "Text",
    });

    if (socketAck.ok && socketAck.message) {
      messagesState.appendMessage(socketAck.message);
      conversationsQuery.refetch();
      return;
    }

    try {
      const message = await sendHttpMessage.mutateAsync({
        conversationId: selectedConversationId,
        content,
      });

      messagesState.appendMessage(message);
      conversationsQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send message";
      toast.error(message);
    }
  };

  return (
    <main className="min-h-screen pt-18 ">
      <DashboardNavbar activeTab={null} />
      <div className="mx-auto flex h-[calc(100vh-96px)] max-w-7xl flex-col overflow-hidden rounded-2xl border border-(--palette-border) bg-(--palette-card-bg)">
        <div className="grid flex-1 min-h-0 grid-cols-1 md:grid-cols-[320px_1fr]">
          <aside className="h-full min-h-0">
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              isLoading={conversationsQuery.isLoading}
              isPartnerLoading={isPartnersLoading}
              getConversationLabel={getConversationLabel}
              onSelectConversation={setConversation}
            />
          </aside>

          <section className="h-full min-h-0">
            <MessageInbox
              conversationId={selectedConversationId}
              conversationLabel={
                selectedPartner?.name || selectedPartner?.email || "Inbox"
              }
              currentUserId={user?.id}
              resolveSenderName={resolveSenderName}
              isPartnerLoading={isPartnersLoading}
              messages={messagesState.messages}
              isLoading={messagesState.isLoading || messagesState.isFetching}
              isSending={sendHttpMessage.isPending}
              hasMore={messagesState.hasMore}
              onLoadOlder={messagesState.loadOlder}
              onSendMessage={handleSendMessage}
            />
          </section>
        </div>
      </div>
    </main>
  );
}

export default MessagePageDashboard;
