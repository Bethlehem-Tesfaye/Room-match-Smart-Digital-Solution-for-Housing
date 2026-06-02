import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUp,
  Building2,
  ExternalLink,
  Info,
  MapPin,
  MessageSquare,
  X,
  Users,
} from "lucide-react";
import type { ConversationListing, Message, RentRequest } from "../types/type";

interface MessageInboxProps {
  conversationId?: string;
  conversationLabel: string;
  conversationListing?: ConversationListing | null;
  isListingUnavailable?: boolean;
  currentUserId?: string;
  isOwnerView?: boolean;
  rentRequest?: RentRequest | null;
  isRentRequestLoading?: boolean;
  isRentActionPending?: boolean;
  onRequestToRent?: () => Promise<void>;
  onCompletePayment?: () => Promise<void>;
  onAcceptRentRequest?: () => Promise<void>;
  onRejectRentRequest?: () => Promise<void>;
  resolveSenderName?: (sender: Message["senderId"]) => string | undefined;
  isPartnerLoading?: boolean;
  onOpenConversationList?: () => void;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  hasMore: boolean;
  onLoadOlder: () => void;
  onSendMessage: (content: string) => Promise<void>;
  isRoommateChat?: boolean;
}

const getSenderId = (sender: Message["senderId"]) =>
  typeof sender === "string" ? sender : sender._id;

interface ContextPanelProps {
  conversationListing?: ConversationListing | null;
  rentRequest?: RentRequest | null;
  isListingUnavailable?: boolean;
  isOwnerView?: boolean;
  isRentRequestLoading?: boolean;
  isRentActionPending?: boolean;
  onRequestToRent?: () => Promise<void>;
  onCompletePayment?: () => Promise<void>;
  onAcceptRentRequest?: () => Promise<void>;
  onRejectRentRequest?: () => Promise<void>;
  isRoommateChat?: boolean;
}

export function ContextPanel({
  conversationListing,
  rentRequest,
  isListingUnavailable = false,
  isOwnerView = false,
  isRentRequestLoading = false,
  isRentActionPending = false,
  onRequestToRent,
  onCompletePayment,
  onAcceptRentRequest,
  onRejectRentRequest,
  isRoommateChat = false,
}: ContextPanelProps) {
  return (
    <aside
      className="flex h-full min-h-0 flex-col overflow-y-auto border-l border-(--palette-border) bg-(--palette-card-bg) p-4"
      style={{ color: "var(--app-text)" }}
    >
      {isRoommateChat ? (
        <div
          className="flex items-center gap-2 text-[13px]"
          style={{ color: "var(--palette-soft-purple)" }}
        >
          <Users size={16} />
          <span>Roommate conversation</span>
        </div>
      ) : null}

      {!isRoommateChat && conversationListing ? (
        <section className="space-y-3 rounded-xl border border-(--palette-border) p-4">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.22em]"
            style={{ color: "var(--palette-soft-purple)" }}
          >
            Listing
          </p>
          <div className="space-y-1">
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--palette-deep)" }}
            >
              {conversationListing.title}
            </h3>
            <div
              className="flex items-start gap-2 text-[12px]"
              style={{ color: "var(--palette-soft-purple)" }}
            >
              <MapPin size={14} className="mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1 wrap-break-word">
                {conversationListing.city || conversationListing.address || ""}
              </span>
            </div>
          </div>
          <Link
            to={`/properties/${conversationListing._id}`}
            className="inline-flex items-center gap-1 text-[12px] font-medium"
            style={{ color: "var(--palette-purple)" }}
          >
            View listing
            <ExternalLink size={14} />
          </Link>
        </section>
      ) : null}

      {!isRoommateChat && conversationListing ? (
        <section className="space-y-3 rounded-xl border border-(--palette-border) p-4">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.22em]"
            style={{ color: "var(--palette-soft-purple)" }}
          >
            Rent request
          </p>

          {!isOwnerView && isListingUnavailable ? (
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center rounded-full border px-3 py-2 text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: "var(--palette-light-purple)",
                backgroundColor: "var(--palette-card-muted-alt-bg)",
                color: "var(--palette-soft-purple)",
              }}
            >
              Unavailable
            </button>
          ) : !isOwnerView &&
            (!rentRequest ||
              ["REJECTED", "CANCELLED", "TERMINATED"].includes(
                rentRequest.status,
              )) ? (
            <button
              type="button"
              onClick={() => {
                void onRequestToRent?.();
              }}
              disabled={isRentRequestLoading || isRentActionPending}
              className="inline-flex w-full items-center justify-center rounded-full px-3 py-2 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "var(--palette-purple)" }}
            >
              Request to Rent
            </button>
          ) : !isOwnerView && rentRequest?.status === "PENDING" ? (
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center rounded-full px-3 py-2 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "var(--palette-purple)" }}
            >
              Request Pending
            </button>
          ) : !isOwnerView && rentRequest?.status === "RESERVED" ? (
            <button
              type="button"
              onClick={() => {
                void onCompletePayment?.();
              }}
              disabled={isRentActionPending}
              className="inline-flex w-full items-center justify-center rounded-full px-3 py-2 text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "#dcfce7", color: "#166534" }}
            >
              Complete Payment
            </button>
          ) : !isOwnerView && rentRequest?.status === "ACTIVE" ? (
            <div
              className="flex items-center gap-2 text-[13px]"
              style={{ color: "#166534" }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: "#22c55e" }}
              />
              <span>Active rental</span>
            </div>
          ) : !isOwnerView ? (
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center rounded-full border px-3 py-2 text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: "var(--palette-light-purple)",
                backgroundColor: "var(--palette-card-muted-alt-bg)",
                color: "var(--palette-soft-purple)",
              }}
            >
              Request Ended
            </button>
          ) : null}

          {isOwnerView &&
          !isListingUnavailable &&
          rentRequest?.status === "PENDING" ? (
            <div className="space-y-2">
              <p
                className="text-[12px]"
                style={{ color: "var(--palette-soft-purple)" }}
              >
                User requested to rent this property
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void onAcceptRentRequest?.();
                  }}
                  disabled={isRentActionPending}
                  className="inline-flex flex-1 items-center justify-center rounded-full px-3 py-2 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: "#16a34a" }}
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void onRejectRentRequest?.();
                  }}
                  disabled={isRentActionPending}
                  className="inline-flex flex-1 items-center justify-center rounded-full border px-3 py-2 text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ borderColor: "#fca5a5", color: "#b91c1c" }}
                >
                  Reject
                </button>
              </div>
            </div>
          ) : null}

          {isOwnerView &&
          !isListingUnavailable &&
          rentRequest?.status === "RESERVED" ? (
            <p
              className="text-[12px]"
              style={{ color: "var(--palette-soft-purple)" }}
            >
              Awaiting tenant payment
            </p>
          ) : null}

          {isOwnerView && rentRequest?.status === "ACTIVE" ? (
            <div
              className="flex items-center gap-2 text-[13px]"
              style={{ color: "#166534" }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: "#22c55e" }}
              />
              <span>Rented</span>
            </div>
          ) : null}

          {isOwnerView && isListingUnavailable ? (
            <p className="text-[12px] font-medium" style={{ color: "#b91c1c" }}>
              Property no longer available
            </p>
          ) : null}
        </section>
      ) : null}
    </aside>
  );
}

function MessageInbox({
  conversationId,
  isRoommateChat = false,
  conversationLabel,
  conversationListing,
  isListingUnavailable = false,
  currentUserId,
  isOwnerView = false,
  rentRequest,
  isRentRequestLoading = false,
  isRentActionPending = false,
  onRequestToRent,
  onCompletePayment,
  onAcceptRentRequest,
  onRejectRentRequest,
  resolveSenderName,
  isPartnerLoading = false,
  onOpenConversationList,
  messages,
  isLoading,
  isSending,
  hasMore,
  onLoadOlder,
  onSendMessage,
}: MessageInboxProps) {
  const [content, setContent] = useState("");
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLUListElement | null>(null);
  const pendingScrollToBottomRef = useRef(false);
  const previousConversationIdRef = useRef<string | undefined>(undefined);
  const previousLastMessageIdRef = useRef<string | undefined>(undefined);
  const isLoadingOlderRef = useRef(false);

  const canSend = useMemo(() => {
    return !!conversationId && content.trim().length > 0 && !isSending;
  }, [content, conversationId, isSending]);

  const scrollToBottom = useCallback(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    pendingScrollToBottomRef.current = true;
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !pendingScrollToBottomRef.current || isLoading)
      return;

    requestAnimationFrame(() => {
      scrollToBottom();
      pendingScrollToBottomRef.current = false;
    });
  }, [conversationId, isLoading, messages.length, scrollToBottom]);

  useEffect(() => {
    if (!isLoading && isLoadingOlderRef.current) {
      isLoadingOlderRef.current = false;
    }
  }, [isLoading]);

  useEffect(() => {
    const lastMessageId = messages[messages.length - 1]?._id;
    const isSameConversation =
      previousConversationIdRef.current === conversationId;
    const hasNewTailMessage =
      !!conversationId &&
      !!lastMessageId &&
      lastMessageId !== previousLastMessageIdRef.current;

    if (isSameConversation && hasNewTailMessage && !isLoadingOlderRef.current) {
      if (isLoading) {
        pendingScrollToBottomRef.current = true;
      } else {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }
    }

    previousConversationIdRef.current = conversationId;
    previousLastMessageIdRef.current = lastMessageId;
  }, [conversationId, isLoading, messages, scrollToBottom]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = content.trim();
    if (!trimmed) return;

    pendingScrollToBottomRef.current = true;
    await onSendMessage(trimmed);
    setContent("");
  };

  const handleLoadOlder = () => {
    isLoadingOlderRef.current = true;
    onLoadOlder();
  };

  const mobileHeader = onOpenConversationList ? (
    <div
      className="flex items-center gap-3 border-b px-4 py-3 md:hidden"
      style={{ borderColor: "var(--palette-border)" }}
    >
      <button
        type="button"
        onClick={onOpenConversationList}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border"
        style={{
          borderColor: "var(--palette-border)",
          backgroundColor: "var(--palette-chip-bg)",
          color: "var(--palette-deep)",
        }}
        aria-label="Open conversations"
      >
        <ArrowLeft size={18} />
      </button>
      <div className="min-w-0">
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--palette-soft-purple)" }}
        >
          Conversations
        </p>
        <p
          className="truncate text-sm"
          style={{ color: "var(--palette-deep)" }}
        >
          Tap the menu to switch chats
        </p>
      </div>
    </div>
  ) : null;

  if (!conversationId) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-(--palette-card-muted-alt-bg)">
        {mobileHeader}
        <div
          className="flex flex-1 flex-col items-center justify-center px-6 text-center"
          style={{ color: "var(--palette-soft-purple)" }}
        >
          <div
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              backgroundColor: "var(--palette-chip-bg)",
              color: "var(--palette-purple)",
            }}
          >
            <MessageSquare size={36} />
          </div>
          <h3
            className="text-4xl font-semibold"
            style={{ color: "var(--palette-deep)" }}
          >
            Select a conversation
          </h3>
          <p
            className="mt-3 text-xl"
            style={{ color: "var(--palette-soft-purple)" }}
          >
            Choose a conversation from the list to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-(--palette-card-bg)">
      {mobileHeader}
      <div
        className="flex h-14 items-center justify-between gap-3 border-b px-4"
        style={{ borderColor: "var(--palette-border)" }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2
              className="truncate text-sm font-semibold"
              style={{ color: "var(--palette-deep)" }}
            >
              {conversationLabel}
            </h2>
            {isRoommateChat ? (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{
                  backgroundColor: "var(--palette-chip-bg)",
                  color: "var(--palette-purple)",
                }}
              >
                Roommate
              </span>
            ) : null}
          </div>

          {!isRoommateChat && conversationListing ? (
            <div
              className="mt-1 flex min-w-0 items-center gap-1.5 text-[12px]"
              style={{ color: "var(--palette-soft-purple)" }}
            >
              <Building2 size={14} className="shrink-0" />
              <Link
                to={`/properties/${conversationListing._id}`}
                className="inline-flex min-w-0 items-center gap-1 truncate"
                style={{ color: "var(--palette-soft-purple)" }}
              >
                <span className="truncate underline-offset-2 hover:underline">
                  {conversationListing.title}
                  {conversationListing.city
                    ? ` • ${conversationListing.city}`
                    : ""}
                </span>
                <ExternalLink size={12} className="shrink-0" />
              </Link>
              {isListingUnavailable ? (
                <span
                  className="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: "var(--palette-chip-bg)",
                    color: "var(--palette-purple)",
                  }}
                >
                  RENTED
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setIsContextPanelOpen((current) => !current)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border lg:hidden"
          style={{
            borderColor: "var(--palette-border)",
            backgroundColor: "var(--palette-chip-bg)",
            color: "var(--palette-deep)",
          }}
          aria-label="Toggle context panel"
          aria-expanded={isContextPanelOpen}
        >
          <Info size={16} />
        </button>
      </div>

      <div className="px-4 py-2 text-center">
        <button
          type="button"
          onClick={handleLoadOlder}
          disabled={!hasMore || isLoading}
          className="text-[12px] font-medium disabled:opacity-50"
          style={{ color: "var(--palette-soft-purple)" }}
        >
          {isLoading ? "Loading..." : "Load older messages"}
        </button>
      </div>

      <ul
        ref={messagesContainerRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
      >
        {messages.map((message) => {
          const senderId = getSenderId(message.senderId);
          const isMine = senderId === currentUserId;
          const senderName = resolveSenderName?.(message.senderId);

          return (
            <li
              key={message._id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[72%] px-3 py-2 text-sm"
                style={{
                  backgroundColor: isMine
                    ? "var(--palette-purple)"
                    : "var(--palette-card-muted-bg)",
                  color: isMine ? "#ffffff" : "var(--app-text)",
                  borderRadius: isMine
                    ? "16px 16px 4px 16px"
                    : "16px 16px 16px 4px",
                }}
              >
                {!isMine ? (
                  senderName ? (
                    <p
                      className="mb-1 text-[11px]"
                      style={{ color: "var(--palette-soft-purple)" }}
                    >
                      {senderName}
                    </p>
                  ) : isPartnerLoading ? (
                    <div
                      className="skeleton mb-1 h-3 w-24"
                      style={{ backgroundColor: "var(--palette-skeleton)" }}
                    />
                  ) : (
                    <p
                      className="mb-1 text-[11px]"
                      style={{ color: "var(--palette-soft-purple)" }}
                    >
                      Unknown user
                    </p>
                  )
                ) : null}
                <p>{message.content}</p>
              </div>
            </li>
          );
        })}

        {!messages.length ? (
          <li
            className="flex justify-center py-10 text-sm"
            style={{ color: "var(--palette-soft-purple)" }}
          >
            No messages yet.
          </li>
        ) : null}
      </ul>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 flex items-center gap-3 border-t px-4 py-3"
        style={{ borderColor: "var(--palette-border)" }}
      >
        <input
          type="text"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type a message"
          disabled={isListingUnavailable}
          className="min-h-11 flex-1 rounded-full border px-4 py-2 text-sm outline-none"
          style={{
            borderColor: "var(--palette-border)",
            backgroundColor: "var(--palette-input-bg)",
            color: "var(--app-text)",
          }}
        />
        <button
          type="submit"
          disabled={!canSend || isListingUnavailable}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--palette-purple)" }}
        >
          {isListingUnavailable ? (
            "Unavailable"
          ) : isSending ? (
            "Sending..."
          ) : (
            <ArrowUp size={16} />
          )}
        </button>
      </form>

      {isContextPanelOpen ? (
        <div
          className="absolute inset-y-0 right-0 z-20 w-full border-l lg:hidden"
          style={{ borderColor: "var(--palette-border)", maxWidth: "300px" }}
        >
          <button
            type="button"
            aria-label="Close context panel"
            className="absolute inset-0 z-0"
            onClick={() => setIsContextPanelOpen(false)}
          />
          <button
            type="button"
            aria-label="Close context panel"
            onClick={() => setIsContextPanelOpen(false)}
            className="absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border"
            style={{
              borderColor: "var(--palette-border)",
              backgroundColor: "var(--palette-chip-bg)",
              color: "var(--palette-deep)",
            }}
          >
            <X size={16} />
          </button>
          <div className="relative z-10 h-full">
            <ContextPanel
              conversationListing={conversationListing}
              rentRequest={rentRequest}
              isListingUnavailable={isListingUnavailable}
              isOwnerView={isOwnerView}
              isRentRequestLoading={isRentRequestLoading}
              isRentActionPending={isRentActionPending}
              onRequestToRent={onRequestToRent}
              onCompletePayment={onCompletePayment}
              onAcceptRentRequest={onAcceptRentRequest}
              onRejectRentRequest={onRejectRentRequest}
              isRoommateChat={isRoommateChat}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MessageInbox;
