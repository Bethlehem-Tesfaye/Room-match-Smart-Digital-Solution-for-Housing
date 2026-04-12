import { useMemo, useState, type FormEvent } from "react";
import type { Message } from "../types/type";

interface MessageInboxProps {
  conversationId?: string;
  conversationLabel: string;
  currentUserId?: string;
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
  currentUserId,
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

  const canSend = useMemo(() => {
    return !!conversationId && content.trim().length > 0 && !isSending;
  }, [content, conversationId, isSending]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = content.trim();
    if (!trimmed) return;

    await onSendMessage(trimmed);
    setContent("");
  };

  if (!conversationId) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 text-sm text-gray-500">
        Select a conversation to view messages.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">
          {conversationLabel}
        </h2>
      </div>

      <div className="px-4 py-2">
        <button
          type="button"
          onClick={onLoadOlder}
          disabled={!hasMore || isLoading}
          className="text-xs text-gray-500 disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Load older messages"}
        </button>
      </div>

      <ul className="flex-1 space-y-3 overflow-y-auto px-4 py-2">
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
                    ? "bg-violet-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {!isMine ? (
                  senderName ? (
                    <p className="mb-1 text-xs text-gray-500">{senderName}</p>
                  ) : isPartnerLoading ? (
                    <div className="skeleton mb-1 h-3 w-24" />
                  ) : (
                    <p className="mb-1 text-xs text-gray-500">Unknown user</p>
                  )
                ) : null}
                <p>{message.content}</p>
              </div>
            </li>
          );
        })}

        {!messages.length ? (
          <li className="text-sm text-gray-500">No messages yet.</li>
        ) : null}
      </ul>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-gray-200 p-3"
      >
        <input
          type="text"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type a message"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-md bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default MessageInbox;
