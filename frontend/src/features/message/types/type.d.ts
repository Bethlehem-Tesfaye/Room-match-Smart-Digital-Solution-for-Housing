export type MessageType = "Text" | "Image" | "Document";

export interface ConversationListing {
  _id: string;
  ownerId?: string;
  title: string;
  city?: string;
  address?: string;
  price?: number;
  currency?: string;
  allowRoommates?: boolean;
  status?: "Active" | "Reserved" | "Rented" | "Inactive";
}

export type ContractStatus =
  | "PENDING"
  | "RESERVED"
  | "ACTIVE"
  | "REJECTED"
  | "CANCELLED"
  | "TERMINATION_PENDING"
  | "TERMINATED"
  | "ENDED";

export interface RentRequestParty {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
}

export interface RentRequest {
  _id: string;
  tenantId: string | RentRequestParty;
  ownerId: string | RentRequestParty;
  terminationRequestedBy?: string | RentRequestParty | null;
  listingId: string | ConversationListing;
  conversationId: string;
  status: ContractStatus;
  createdAt?: string;
  updatedAt?: string;
  acceptedAt?: string | null;
  paymentDueAt?: string | null;
  terminationRequestedAt?: string | null;
  terminationResolvedAt?: string | null;
}

export interface Conversation {
  _id: string;
  participantsKey?: string;
  listingId?: string | null;
  listing?: ConversationListing | null;
  propertyId?: string | null;
  isRoommateChat?: boolean;
  lastMessageAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConversationSummaryApiItem {
  _id: string;
  conversationId: string;
  userId: string;
  conversation: Conversation;
}

export interface ConversationSummary {
  conversationId: string;
  lastMessageAt: string | null;
  listingId?: string | null;
  listing?: ConversationListing | null;
  isRoommateChat?: boolean;
}

export interface ConversationParticipantUser {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
}

export interface ConversationParticipant {
  _id: string;
  conversationId: string;
  userId: ConversationParticipantUser;
  joinedAt?: string;
  lastReadAt?: string | null;
}

export interface MessageSender {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string | MessageSender;
  content: string;
  messageType: MessageType;
  createdAt: string;
  updatedAt?: string;
}

export interface MessageSendInput {
  conversationId?: string;
  receiverId?: string;
  listingId?: string;
  propertyId?: string;
  content: string;
  messageType?: MessageType;
}

export interface InitiateConversationInput {
  userId: string;
  listingId?: string;
  propertyId?: string;
  isRoommateChat?: boolean;
}

export interface Notification {
  _id: string;
  userId: string;
  type: "Message" | "Match" | "Payment" | "ListingUpdate";
  title: string;
  content: string;
  relatedEntityId?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MessageSendAck {
  ok: boolean;
  conversationId?: string;
  message?: Message;
  receiverOnline?: boolean;
  error?: string;
}

export interface SendPropertyMessageInput {
  ownerId: string;
  listingId: string;
  content: string;
}

export interface SendPropertyMessageResult {
  conversationId: string;
  message: Message;
}
