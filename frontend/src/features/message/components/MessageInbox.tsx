import { useMemo, useState, type FormEvent } from "react";
import type { Message } from "../types/type";

interface MessageInboxProps {
  conversationId?: string;
  conversationLabel: string;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  hasMore: boolean;
  onLoadOlder: () => void;
  onSendMessage: (content: string) => Promise<void>;
}

const getSenderLabel = (sender: Message["senderId"]) => {
  if (typeof sender === "string") return sender;
  return sender.name || sender.email || sender._id;
};

function MessageInbox({
  conversationId,
  conversationLabel,
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
    return <p>Select a conversation to view messages.</p>;
  }

  return (
    <div>
      <h2>{conversationLabel}</h2>

      <div>
        <button type="button" onClick={onLoadOlder} disabled={!hasMore || isLoading}>
          {isLoading ? "Loading..." : "Load older messages"}
        </button>
      </div>

      <ul>
        {messages.map((message) => (
          <li key={message._id}>
            <strong>{getSenderLabel(message.senderId)}:</strong> {message.content}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type a message"
        />
        <button type="submit" disabled={!canSend}>
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default MessageInbox;
