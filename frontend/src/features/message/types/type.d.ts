export type MessageType = "Text" | "Image" | "Document";

export interface Conversation {
	_id: string;
	participantsKey?: string;
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
	propertyId?: string;
	content: string;
	messageType?: MessageType;
}

export interface InitiateConversationInput {
	userId: string;
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
	propertyId: string;
	content: string;
}

export interface SendPropertyMessageResult {
	conversationId: string;
	message: Message;
}
