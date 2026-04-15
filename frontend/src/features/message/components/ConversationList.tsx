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
      <div className="h-full border-r border-(--palette-border) bg-(--palette-card-bg)">
        <div className="border-b border-(--palette-border) p-5">
          <h2 className="text-3xl font-semibold text-(--palette-deep)">
            Messages
          </h2>
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
      <div className="h-full border-r border-(--palette-border) bg-(--palette-card-bg) p-5">
        <h2 className="mb-3 text-2xl font-semibold text-(--palette-deep)">
          Messages
        </h2>
        <p className="text-sm text-(--palette-soft-purple)">
          No conversations yet.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full border-r border-(--palette-border) bg-(--palette-card-bg)">
      <div className="border-b border-(--palette-border) p-5">
        <h2 className="text-3xl font-semibold text-(--palette-deep)">
          Messages
        </h2>
        <label className="mt-4 flex items-center gap-2 rounded-lg border border-(--palette-border) bg-(--palette-input-bg) px-3 py-2 text-(--app-text)">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
            stroke="currentColor"
            className="h-4 w-4 text-(--palette-soft-purple)"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-4.35-4.35m1.6-5.15a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
            />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search conversations..."
            className="w-full border-none bg-transparent text-sm outline-none placeholder:text-(--palette-soft-purple)"
          />
        </label>
      </div>

      <ul className="max-h-[calc(100vh-240px)] overflow-y-auto">
        {filteredConversations.map((conversation) => {
          const isSelected =
            selectedConversationId === conversation.conversationId;
          const title = getConversationLabel(conversation.conversationId);
          const avatarLabel = (title || "?").charAt(0).toUpperCase();

          return (
            <li
              key={conversation.conversationId}
              className="border-b border-(--palette-border)"
            >
              <button
                type="button"
                onClick={() =>
                  onSelectConversation(conversation.conversationId)
                }
                className={`flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-(--palette-card-muted-alt-bg) ${
                  isSelected
                    ? "bg-(--palette-card-muted-bg)"
                    : "bg-(--palette-card-bg)"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--palette-soft-purple) text-sm font-semibold text-white">
                  {avatarLabel}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    {title ? (
                      <p className="truncate text-[1.05rem] font-semibold text-(--palette-deep)">
                        {title}
                      </p>
                    ) : isPartnerLoading ? (
                      <div className="skeleton h-4 w-28" />
                    ) : (
                      <p className="truncate text-[1.05rem] font-semibold text-(--palette-deep)">
                        Unknown user
                      </p>
                    )}
                    <span className="shrink-0 text-xs text-(--palette-soft-purple)">
                      {conversation.lastMessageAt
                        ? new Date(
                            conversation.lastMessageAt,
                          ).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : ""}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-(--palette-soft-purple)">
                      {conversation.lastMessageAt
                        ? "Tap to open conversation"
                        : "No messages yet"}
                    </p>
                    {isSelected ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-(--palette-soft-purple)" />
                    ) : null}
                  </div>
                </div>
              </button>
            </li>
          );
        })}

        {!filteredConversations.length ? (
          <li className="px-4 py-4 text-sm text-(--palette-soft-purple)">
            No matching chats.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export default ConversationList;
