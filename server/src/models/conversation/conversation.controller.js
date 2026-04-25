import * as conversationService from "./conversation.service.js";

/**
 * POST /conversations/initiate
 */
export const initiateConversation = async (req, res, next) => {
  try {
    const userA = req.userId;
    const { userId: userB, listingId, propertyId } = req.body;

    const conversation = await conversationService.getOrCreateConversation({
      userA,
      userB,
      listingId: listingId || propertyId,
      propertyId
    });

    return res.status(200).json({ conversation });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /conversations
 */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.userId;

    const conversations =
      await conversationService.getUserConversations(userId);

    return res.status(200).json({ conversations });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /conversations/:id/participants
 */
export const getParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;

    const participants = await conversationService.getConversationParticipants({
      conversationId: id,
      requesterUserId: req.userId
    });

    return res.status(200).json({ participants });
  } catch (err) {
    return next(err);
  }
};
