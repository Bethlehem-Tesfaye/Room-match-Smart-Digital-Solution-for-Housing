import { useMemo, useState } from "react";
import type { ConversationSummary } from "../types/type";

interface ConversationListProps {
  conversations: ConversationSummary[];
  selectedConversationId?: string;
  isLoading?: boolean;
  isPartnerLoading?: boolean;
  getConversationLabel: (conversationId: string) => string | undefined;
  onSelectConversation: (conversationId: string) => void;
}

function ConversationList({
  conversations,
  selectedConversationId,
  isLoading = false,
  isPartnerLoading = false,
  getConversationLabel,
  onSelectConversation,
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConversations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return conversations;

    return conversations.filter((conversation) => {
      const label = getConversationLabel(conversation.conversationId);
      return label ? label.toLowerCase().includes(normalizedSearch) : false;
    });
  }, [conversations, getConversationLabel, searchTerm]);

  if (isLoading) {
    return (
      <div className="h-full border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-2xl font-semibold">Messages</h2>
          <div className="skeleton mt-3 h-10 w-full" />
        </div>
        <ul className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <div className="skeleton h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="p-4">
        <h2 className="mb-3 text-xl font-semibold">Messages</h2>
        <p className="text-sm text-gray-500">No conversations yet.</p>
      </div>
    );
  }

  return (
    <div className="h-full border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-2xl font-semibold">Messages</h2>
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search conversations..."
          className="mt-3 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none"
        />
      </div>

      <ul className="max-h-[calc(100vh-220px)] overflow-y-auto">
        {filteredConversations.map((conversation) => {
          const isSelected =
            selectedConversationId === conversation.conversationId;
          const title = getConversationLabel(conversation.conversationId);

          return (
            <li
              key={conversation.conversationId}
              className="border-b border-gray-100"
            >
              <button
                type="button"
                onClick={() =>
                  onSelectConversation(conversation.conversationId)
                }
                className={`flex w-full items-center gap-3 px-4 py-3 text-left ${
                  isSelected ? "bg-gray-100" : "bg-white"
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-violet-500" />
                <div className="min-w-0 flex-1">
                  {title ? (
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {title}
                    </p>
                  ) : isPartnerLoading ? (
                    <div className="skeleton h-4 w-28" />
                  ) : (
                    <p className="truncate text-sm font-semibold text-gray-900">
                      Unknown user
                    </p>
                  )}
                  <p className="truncate text-xs text-gray-500">
                    {conversation.lastMessageAt
                      ? new Date(conversation.lastMessageAt).toLocaleString()
                      : "No messages yet"}
                  </p>
                </div>
              </button>
            </li>
          );
        })}

        {!filteredConversations.length ? (
          <li className="px-4 py-4 text-sm text-gray-500">
            No matching chats.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export default ConversationList;
