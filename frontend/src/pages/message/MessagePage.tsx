import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import ConversationList from "../../features/message/components/ConversationList";
import MessageInbox from "../../features/message/components/MessageInbox";
import {
  useConversationMessages,
  useConversationPartner,
  useConversations,
  useMessageSocket,
  useSendHttpMessage,
} from "../../features/message/hooks/useMessageHooks";
import type { Message } from "../../features/message/types/type";

function MessagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useCurrentUser();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(() => searchParams.get("conversationId") || undefined);

  const conversationsQuery = useConversations();
  const messagesState = useConversationMessages(selectedConversationId);
  const sendHttpMessage = useSendHttpMessage();
  const { partner } = useConversationPartner(selectedConversationId, user?.id);

  const setConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSearchParams({ conversationId });
  };

  const getConversationLabel = (conversationId: string) => {
    if (selectedConversationId === conversationId && partner) {
      return partner.name || partner.email || partner._id;
    }

    return `Conversation ${conversationId.slice(-6)}`;
  };

  const upsertIncomingMessage = (incomingMessage: Message) => {
    const incomingConversationId = incomingMessage.conversationId;

    if (incomingConversationId === selectedConversationId) {
      messagesState.appendMessage(incomingMessage);
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

  const conversations = useMemo(() => {
    return conversationsQuery.data || [];
  }, [conversationsQuery.data]);

  return (
    <div>
      <h1>Messages</h1>
      <p>Realtime: {socketState.isConnected ? "connected" : "disconnected"}</p>

      <div>
        <div>
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            getConversationLabel={getConversationLabel}
            onSelectConversation={setConversation}
          />
        </div>

        <div>
          <MessageInbox
            conversationId={selectedConversationId}
            conversationLabel={
              partner?.name ||
              partner?.email ||
              (selectedConversationId
                ? `Conversation ${selectedConversationId.slice(-6)}`
                : "Inbox")
            }
            messages={messagesState.messages}
            isLoading={messagesState.isLoading || messagesState.isFetching}
            isSending={sendHttpMessage.isPending}
            hasMore={messagesState.hasMore}
            onLoadOlder={messagesState.loadOlder}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
}

export default MessagePage;
