import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import ConversationList from "../../features/message/components/ConversationList";
import MessageInbox, {
  ContextPanel,
} from "../../features/message/components/MessageInbox";
import {
  useAcceptRentRequest,
  useCompleteRentPayment,
  useConversationRentRequest,
  useCreateRentRequest,
  useConversationMessages,
  useConversationPartnersMap,
  useConversations,
  useMarkConversationRead,
  useMessageSocket,
  useRejectRentRequest,
  useSendHttpMessage,
  useUnreadMessageCounts,
} from "../../features/message/hooks/useMessageHooks";
import type { Message } from "../../features/message/types/type";
import type { ConversationSummary } from "../../features/message/types/type";
import LandingNavbar from "../../features/landing/components/LandingNavbar";
import ReportModal from "../../features/reports/components/ReportModal";
import BlockUserConfirmModal from "../../features/reports/components/BlockUserConfirmModal";
import {
  useBlockUser,
  useReportUser,
  useUnblockUser,
  useUserBlockStatus,
  useUserBlockSync,
} from "../../features/reports/hooks/useReportHooks";
import type { ReportReason } from "../../features/reports/constants";

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

function MessagePage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useCurrentUser();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(() => searchParams.get("conversationId") || undefined);
  const [isConversationListOpen, setIsConversationListOpen] = useState(false);
  const [isReportUserOpen, setIsReportUserOpen] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const reportUser = useReportUser();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  const conversationsQuery = useConversations();
  const unreadCountsQuery = useUnreadMessageCounts();
  const markConversationRead = useMarkConversationRead();
  const messagesState = useConversationMessages(selectedConversationId);
  const rentRequestQuery = useConversationRentRequest(selectedConversationId);
  const createRentRequest = useCreateRentRequest();
  const acceptRentRequest = useAcceptRentRequest();
  const completeRentPayment = useCompleteRentPayment();
  const rejectRentRequest = useRejectRentRequest();
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

  const partnerUserId = selectedPartner?._id;
  const partnerLabel =
    selectedPartner?.name || selectedPartner?.email || "this user";
  const blockStatusQuery = useUserBlockStatus(partnerUserId);
  useUserBlockSync(partnerUserId);
  const blockedByMe = blockStatusQuery.data?.blockedByMe ?? false;
  const blockedByThem = blockStatusQuery.data?.blockedByThem ?? false;

  const handleSubmitUserReport = async (payload: {
    reason: ReportReason;
    description?: string;
  }) => {
    if (!partnerUserId) return;

    try {
      await reportUser.mutateAsync({ userId: partnerUserId, ...payload });
      toast.success("Report submitted. Our team will review it.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit report",
      );
      throw error;
    }
  };

  const handleBlockPartner = async () => {
    if (!partnerUserId) return;

    try {
      await blockUser.mutateAsync({ userId: partnerUserId });
      toast.success("User blocked.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to block user",
      );
      throw error;
    }
  };

  const handleUnblockPartner = async () => {
    if (!partnerUserId) return;

    try {
      await unblockUser.mutateAsync({ userId: partnerUserId });
      toast.success("User unblocked.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unblock user",
      );
    }
  };

  const safetyProps = partnerUserId
    ? {
        partnerUserId,
        partnerLabel,
        onReportUser: () => setIsReportUserOpen(true),
        onBlockUser: () => setIsBlockConfirmOpen(true),
        onUnblockUser: () => void handleUnblockPartner(),
        blockedByMe,
        blockedByThem,
        isSafetyActionPending:
          reportUser.isPending ||
          blockUser.isPending ||
          unblockUser.isPending,
      }
    : {};

  // REPLACE the selectedConversation block + isOwnerView derivations with:
  const selectedConversation = selectedConversationId
    ? conversations.find(
        (conversation) =>
          conversation.conversationId === selectedConversationId,
      )
    : undefined;

  const isRoommateChat = selectedConversation?.isRoommateChat ?? false; // NEW

  const isOwnerView =
    !isRoommateChat && // NEW — owners don't get rent UI in roommate chats
    !!selectedConversation?.listing?.ownerId &&
    selectedConversation.listing.ownerId === user?.id;

  const isSelectedListingRented =
    !isRoommateChat && // NEW — irrelevant for roommate chats
    selectedConversation?.listing?.status === "Rented";
  const setConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSearchParams({ conversationId });
    markConversationRead.mutate(conversationId);
  };

  const getConversationLabel = (conversationId: string) => {
    const partner = partnerByConversationId[conversationId];
    if (!partner) return undefined;
    return partner.name || partner.email || undefined;
  };

  const handleSelectConversation = (conversationId: string) => {
    setConversation(conversationId);
    setIsConversationListOpen(false);
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
      markConversationRead.mutate(incomingConversationId);
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
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-counts"],
      });
      conversationsQuery.refetch();
    },
  });

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;

    if (isSelectedListingRented) {
      toast.error("This property is no longer available.");
      return;
    }

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

  const handleRequestToRent = async () => {
    if (!selectedConversationId) return;

    if (isSelectedListingRented) {
      toast.error("This property is no longer available.");
      return;
    }

    try {
      await createRentRequest.mutateAsync({
        conversationId: selectedConversationId,
      });
      toast.success("Rent request sent");
      rentRequestQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create request";
      toast.error(message);
    }
  };

  const handleAcceptRentRequest = async () => {
    const contractId = rentRequestQuery.data?._id;
    if (!contractId) return;

    try {
      await acceptRentRequest.mutateAsync({ contractId });
      toast.success("Rent request accepted");
      rentRequestQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept request";
      toast.error(message);
    }
  };

  const handleRejectRentRequest = async () => {
    const contractId = rentRequestQuery.data?._id;
    if (!contractId) return;

    try {
      await rejectRentRequest.mutateAsync({ contractId });
      toast.success("Rent request rejected");
      rentRequestQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reject request";
      toast.error(message);
    }
  };

  const handleCompletePayment = async () => {
    const contractId = rentRequestQuery.data?._id;
    if (!contractId) return;

    if (isSelectedListingRented) {
      toast.error("This property is no longer available.");
      return;
    }

    try {
      await completeRentPayment.mutateAsync({ contractId });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to complete payment";
      toast.error(message);
    }
  };

  return (
    <main className="min-h-screen pt-17">
      <LandingNavbar />
      <div className="relative mx-auto flex h-[calc(100vh-96px)] max-w-7xl flex-col overflow-hidden rounded-2xl border border-(--palette-border) bg-(--palette-card-bg)">
        <div className="relative grid flex-1 min-h-0 grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr_300px]">
          {isConversationListOpen ? (
            <button
              type="button"
              className="absolute inset-0 z-30 bg-black/40 md:hidden"
              onClick={() => setIsConversationListOpen(false)}
              aria-label="Close conversations"
            />
          ) : null}

          <aside
            className={`absolute inset-y-0 left-0 z-40 h-full w-[min(88vw,20rem)] min-h-0 border-r border-(--palette-border) bg-(--palette-card-bg) shadow-2xl transition-transform duration-200 md:static md:z-auto md:w-auto md:translate-x-0 md:shadow-none ${
              isConversationListOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }`}
          >
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              isLoading={conversationsQuery.isLoading}
              isPartnerLoading={isPartnersLoading}
              getConversationLabel={getConversationLabel}
              onSelectConversation={handleSelectConversation}
              unreadByConversation={unreadCountsQuery.data?.byConversation}
            />
          </aside>

          <section className="relative z-10 h-full min-h-0">
            <MessageInbox
              conversationId={selectedConversationId}
              isRoommateChat={isRoommateChat}
              conversationLabel={
                selectedPartner?.name || selectedPartner?.email || "Inbox"
              }
              conversationListing={selectedConversation?.listing}
              isListingUnavailable={isSelectedListingRented}
              currentUserId={user?.id}
              isOwnerView={isOwnerView}
              rentRequest={rentRequestQuery.data}
              isRentRequestLoading={rentRequestQuery.isLoading}
              isRentActionPending={
                createRentRequest.isPending ||
                acceptRentRequest.isPending ||
                completeRentPayment.isPending ||
                rejectRentRequest.isPending
              }
              onRequestToRent={handleRequestToRent}
              onCompletePayment={handleCompletePayment}
              onAcceptRentRequest={handleAcceptRentRequest}
              onRejectRentRequest={handleRejectRentRequest}
              resolveSenderName={resolveSenderName}
              isPartnerLoading={isPartnersLoading}
              onOpenConversationList={() => setIsConversationListOpen(true)}
              messages={messagesState.messages}
              isLoading={messagesState.isLoading || messagesState.isFetching}
              isSending={sendHttpMessage.isPending}
              hasMore={messagesState.hasMore}
              onLoadOlder={messagesState.loadOlder}
              onSendMessage={handleSendMessage}
              {...safetyProps}
            />
          </section>

          <section className="hidden h-full min-h-0 lg:block">
            <ContextPanel
              conversationListing={selectedConversation?.listing}
              rentRequest={rentRequestQuery.data}
              isListingUnavailable={isSelectedListingRented}
              isOwnerView={isOwnerView}
              isRentRequestLoading={rentRequestQuery.isLoading}
              isRentActionPending={
                createRentRequest.isPending ||
                acceptRentRequest.isPending ||
                completeRentPayment.isPending ||
                rejectRentRequest.isPending
              }
              onRequestToRent={handleRequestToRent}
              onCompletePayment={handleCompletePayment}
              onAcceptRentRequest={handleAcceptRentRequest}
              onRejectRentRequest={handleRejectRentRequest}
              isRoommateChat={isRoommateChat}
              {...safetyProps}
            />
          </section>
        </div>
      </div>

      <ReportModal
        isOpen={isReportUserOpen}
        title="Report user"
        subtitle="Describe why this conversation or user seems suspicious."
        onClose={() => setIsReportUserOpen(false)}
        onSubmit={handleSubmitUserReport}
        isSubmitting={reportUser.isPending}
      />

      <BlockUserConfirmModal
        isOpen={isBlockConfirmOpen}
        userName={partnerLabel}
        onClose={() => setIsBlockConfirmOpen(false)}
        onConfirm={handleBlockPartner}
        isSubmitting={blockUser.isPending}
      />
    </main>
  );
}

export default MessagePage;
