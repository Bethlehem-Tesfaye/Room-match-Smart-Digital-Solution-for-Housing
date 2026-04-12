import type { ConversationSummary } from "../types/type";

interface ConversationListProps {
  conversations: ConversationSummary[];
  selectedConversationId?: string;
  getConversationLabel: (conversationId: string) => string;
  onSelectConversation: (conversationId: string) => void;
}

function ConversationList({
  conversations,
  selectedConversationId,
  getConversationLabel,
  onSelectConversation,
}: ConversationListProps) {
  if (!conversations.length) {
    return <p>No conversations yet.</p>;
  }

  return (
    <div>
      <h2>Conversations</h2>
      <ul>
        {conversations.map((conversation) => {
          const isSelected = selectedConversationId === conversation.conversationId;

          return (
            <li key={conversation.conversationId}>
              <button
                type="button"
                onClick={() => onSelectConversation(conversation.conversationId)}
              >
                {isSelected ? "→ " : ""}
                {getConversationLabel(conversation.conversationId)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ConversationList;
