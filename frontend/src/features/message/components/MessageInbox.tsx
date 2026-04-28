import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import type { ConversationListing, Message, RentRequest } from "../types/type";
import { Building2 } from "lucide-react";

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
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  hasMore: boolean;
  onLoadOlder: () => void;
  onSendMessage: (content: string) => Promise<void>;
}

const getSenderId = (sender: Message["senderId"]) =>
  typeof sender === "string" ? sender : sender._id;

function MessageInbox({
  conversationId,
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
  messages,
  isLoading,
  isSending,
  hasMore,
  onLoadOlder,
  onSendMessage,
}: MessageInboxProps) {
  const [content, setContent] = useState("");
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

  if (!conversationId) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-(--palette-card-muted-alt-bg) px-6 text-center text-(--palette-soft-purple)">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-(--palette-chip-bg) text-(--palette-soft-purple)">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
            stroke="currentColor"
            className="h-9 w-9"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 9.75a3.375 3.375 0 0 1 6.75 0c0 1.585-1.023 2.768-2.313 3.42-.54.273-.937.806-.937 1.41v.17M12 17.25h.008v.008H12v-.008Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12c0 4.97-4.03 9-9 9a8.96 8.96 0 0 1-4.93-1.47L3 20.25l.72-3.6A8.96 8.96 0 0 1 3 12c0-4.97 4.03-9 9-9s9 4.03 9 9Z"
            />
          </svg>
        </div>
        <h3 className="text-4xl font-semibold text-(--palette-deep)">
          Select a conversation
        </h3>
        <p className="mt-3 text-xl text-(--palette-soft-purple)">
          Choose a conversation from the list to start chatting
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-(--palette-card-bg)">
      <div className="border-b border-(--palette-border) px-5 py-3">
        <h2 className="text-sm font-semibold text-(--palette-deep)">
          {conversationLabel}
        </h2>
        {conversationListing ? (
          <p className="mt-1 truncate text-xs text-(--palette-soft-purple) underline flex gap-2">
            <Building2 size={19} />{" "}
            <div className="flex item-center justify-center text-blue-500">
              <Link
                to={`/properties/${conversationListing._id}`}
                className="font-semibold hover:underline flex  items-center text-sm"
              >
                {conversationListing.title}
                {conversationListing.city
                  ? ` • ${conversationListing.city}`
                  : ""}
              </Link>
            </div>
            {isListingUnavailable ? (
              <span className="ml-2 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white no-underline">
                RENTED
              </span>
            ) : null}
          </p>
        ) : null}

        {conversationListing && !isOwnerView && isListingUnavailable ? (
          <div className="mt-2">
            <button
              type="button"
              disabled
              className="rounded-md bg-zinc-500 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Unavailable
            </button>
          </div>
        ) : null}

        {conversationListing && !isOwnerView && !isListingUnavailable ? (
          <div className="mt-2">
            {!rentRequest ||
            (rentRequest &&
              ["REJECTED", "CANCELLED", "TERMINATED"].includes(
                rentRequest.status,
              )) ? (
              <button
                type="button"
                onClick={() => {
                  void onRequestToRent?.();
                }}
                disabled={isRentRequestLoading || isRentActionPending}
                className="rounded-md bg-(--palette-purple) px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Request to Rent
              </button>
            ) : rentRequest.status === "PENDING" ? (
              <button
                type="button"
                disabled
                className="rounded-md bg-(--palette-purple) px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Request Pending
              </button>
            ) : rentRequest.status === "RESERVED" ? (
              <button
                type="button"
                onClick={() => {
                  void onCompletePayment?.();
                }}
                disabled={isRentActionPending}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Complete Payment
              </button>
            ) : rentRequest.status === "ACTIVE" ? (
              <button
                type="button"
                disabled
                className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Rented
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="rounded-md bg-zinc-500 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Request Ended
              </button>
            )}
          </div>
        ) : null}

        {conversationListing &&
        isOwnerView &&
        !isListingUnavailable &&
        rentRequest?.status === "PENDING" ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-xs text-(--palette-soft-purple)">
              User requested to rent this property
            </p>
            <button
              type="button"
              onClick={() => {
                void onAcceptRentRequest?.();
              }}
              disabled={isRentActionPending}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => {
                void onRejectRentRequest?.();
              }}
              disabled={isRentActionPending}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        ) : null}

        {conversationListing &&
        isOwnerView &&
        !isListingUnavailable &&
        rentRequest?.status === "RESERVED" ? (
          <p className="mt-2 text-xs text-(--palette-soft-purple)">
            Awaiting tenant payment
          </p>
        ) : null}

        {conversationListing &&
        isOwnerView &&
        rentRequest?.status === "ACTIVE" ? (
          <p className="mt-2 text-xs font-semibold text-emerald-700">Rented</p>
        ) : null}

        {conversationListing && isOwnerView && isListingUnavailable ? (
          <p className="mt-2 text-xs font-semibold text-rose-700">
            This property is no longer available.
          </p>
        ) : null}
      </div>

      <div className="px-5 py-2">
        <button
          type="button"
          onClick={handleLoadOlder}
          disabled={!hasMore || isLoading}
          className="text-xs text-(--palette-soft-purple) disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Load older messages"}
        </button>
      </div>

      <ul
        ref={messagesContainerRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-3"
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
                className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
                  isMine
                    ? "bg-(--palette-purple) text-white"
                    : "bg-(--palette-card-muted-bg) text-(--app-text)"
                }`}
              >
                {!isMine ? (
                  senderName ? (
                    <p className="mb-1 text-xs text-(--palette-soft-purple)">
                      {senderName}
                    </p>
                  ) : isPartnerLoading ? (
                    <div className="skeleton mb-1 h-3 w-24" />
                  ) : (
                    <p className="mb-1 text-xs text-(--palette-soft-purple)">
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
          <li className="text-sm text-(--palette-soft-purple)">
            No messages yet.
          </li>
        ) : null}
      </ul>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 flex items-center gap-2 border-t border-(--palette-border) p-3"
      >
        <input
          type="text"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type a message"
          disabled={isListingUnavailable}
          className="flex-1 rounded-lg border border-(--palette-border) bg-(--palette-input-bg) px-3 py-2 text-sm text-(--app-text) outline-none"
        />
        <button
          type="submit"
          disabled={!canSend || isListingUnavailable}
          className="rounded-lg bg-(--palette-purple) px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isListingUnavailable
            ? "Unavailable"
            : isSending
              ? "Sending..."
              : "Send"}
        </button>
      </form>
    </div>
  );
}

export default MessageInbox;
