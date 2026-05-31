import { useMemo, useState } from "react";
import { MessageSquare, Search } from "lucide-react";
import type { ConversationSummary } from "../types/type";

interface ConversationListProps {
  conversations: ConversationSummary[];
  selectedConversationId?: string;
  isLoading?: boolean;
  isPartnerLoading?: boolean;
  getConversationLabel: (conversationId: string) => string | undefined;
  onSelectConversation: (conversationId: string) => void;
  unreadByConversation?: Record<string, number>;
}

function ConversationList({
  conversations,
  selectedConversationId,
  isLoading = false,
  isPartnerLoading = false,
  getConversationLabel,
  onSelectConversation,
  unreadByConversation,
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
      <div className="flex h-full min-h-0 flex-col border-r border-(--palette-border) bg-(--palette-card-bg)">
        <div className="border-b border-(--palette-border) px-4 py-4">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--palette-deep)" }}
          >
            Messages
          </h2>
          <div
            className="skeleton mt-3 h-9 w-full rounded-full"
            style={{ backgroundColor: "var(--palette-skeleton)" }}
          />
        </div>
        <ul className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <div
                className="skeleton h-10 w-10 rounded-full"
                style={{ backgroundColor: "var(--palette-skeleton)" }}
              />
              <div className="flex-1 space-y-2">
                <div
                  className="skeleton h-4 w-2/3"
                  style={{ backgroundColor: "var(--palette-skeleton)" }}
                />
                <div
                  className="skeleton h-3 w-1/2"
                  style={{ backgroundColor: "var(--palette-skeleton)" }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="flex h-full min-h-0 flex-col border-r border-(--palette-border) bg-(--palette-card-bg) p-5">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--palette-deep)" }}
        >
          Messages
        </h2>
        <div className="flex flex-1 items-center justify-center text-center">
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: "var(--palette-chip-bg)",
                color: "var(--palette-purple)",
              }}
            >
              <MessageSquare size={20} />
            </div>
            <p
              className="text-sm"
              style={{ color: "var(--palette-soft-purple)" }}
            >
              No conversations yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-(--palette-border) bg-(--palette-card-bg)">
      <div className="border-b border-(--palette-border) px-4 py-4">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--palette-deep)" }}
        >
          Messages
        </h2>
        <label
          className="mt-3 flex h-9 items-center gap-2 rounded-full border px-3"
          style={{
            borderColor: "var(--palette-border)",
            backgroundColor: "var(--palette-input-bg)",
            color: "var(--app-text)",
          }}
        >
          <Search size={16} style={{ color: "var(--palette-soft-purple)" }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search conversations..."
            className="h-full w-full border-none bg-transparent text-sm outline-none placeholder:opacity-70"
            style={{ color: "var(--app-text)" }}
          />
        </label>
      </div>

      <ul className="max-h-[calc(100vh-240px)] overflow-y-auto">
        {filteredConversations.map((conversation) => {
          const isSelected =
            selectedConversationId === conversation.conversationId;
          const title = getConversationLabel(conversation.conversationId);
          const avatarLabel = (title || "?").charAt(0).toUpperCase();
          const listingTitle = conversation.listing?.title;
          const listingLocation =
            conversation.listing?.city || conversation.listing?.address;
          const unreadCount =
            unreadByConversation?.[conversation.conversationId] ?? 0;

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
                className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-(--palette-card-muted-alt-bg)"
                style={{
                  borderLeft: isSelected
                    ? "2px solid var(--palette-purple)"
                    : "2px solid transparent",
                  borderTopRightRadius: "8px",
                  borderBottomRightRadius: "8px",
                  backgroundColor: isSelected
                    ? "var(--palette-chip-bg)"
                    : "var(--palette-card-bg)",
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: "var(--palette-chip-bg)",
                    color: "var(--palette-deep)",
                  }}
                >
                  {avatarLabel}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    {title ? (
                      <p
                        className="truncate text-[13px] font-medium"
                        style={{ color: "var(--palette-deep)" }}
                      >
                        {title}
                      </p>
                    ) : isPartnerLoading ? (
                      <div
                        className="skeleton h-4 w-28"
                        style={{ backgroundColor: "var(--palette-skeleton)" }}
                      />
                    ) : (
                      <p
                        className="truncate text-[13px] font-medium"
                        style={{ color: "var(--palette-deep)" }}
                      >
                        Unknown user
                      </p>
                    )}
                    <span
                      className="shrink-0 text-[11px]"
                      style={{ color: "var(--palette-soft-purple)" }}
                    >
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
                    <p
                      className="min-w-0 flex-1 truncate text-[12px]"
                      style={{ color: "var(--palette-soft-purple)" }}
                    >
                      {listingTitle
                        ? `${listingTitle}${listingLocation ? ` • ${listingLocation}` : ""}`
                        : conversation.lastMessageAt
                          ? "Tap to open conversation"
                          : "No messages yet"}
                    </p>
                    {unreadCount > 0 && !isSelected ? (
                      <span
                        className="ml-auto flex items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                        style={{
                          minWidth: "18px",
                          backgroundColor: "var(--palette-purple)",
                          color: "#ffffff",
                        }}
                      >
                        {unreadCount}
                      </span>
                    ) : isSelected ? (
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: "var(--palette-soft-purple)",
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              </button>
            </li>
          );
        })}

        {!filteredConversations.length ? (
          <li className="px-4 py-10 text-center">
            <div className="flex flex-col items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{
                  backgroundColor: "var(--palette-chip-bg)",
                  color: "var(--palette-purple)",
                }}
              >
                <MessageSquare size={20} />
              </div>
              <p
                className="text-sm"
                style={{ color: "var(--palette-soft-purple)" }}
              >
                No matching chats.
              </p>
            </div>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export default ConversationList;
