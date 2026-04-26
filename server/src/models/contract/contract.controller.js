import {
  acceptRentRequest,
  completeContractPayment,
  createRentRequest,
  getConversationRentRequest,
  getOwnerPendingRentRequests,
  rejectRentRequest
} from "./contract.service.js";

// POST /contracts/request
export const requestToRent = async (req, res, next) => {
  try {
    const { conversationId } = req.body;

    const contract = await createRentRequest({
      conversationId,
      requesterUserId: req.userId
    });

    return res.status(201).json({ contract });
  } catch (err) {
    return next(err);
  }
};

// GET /contracts/conversation/:conversationId
export const fetchConversationRentRequest = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const contract = await getConversationRentRequest({
      conversationId,
      requesterUserId: req.userId
    });

    return res.status(200).json({ contract });
  } catch (err) {
    return next(err);
  }
};

// PATCH /contracts/:id/accept
export const acceptRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await acceptRentRequest({
      contractId: id,
      ownerUserId: req.userId
    });

    return res.status(200).json({ contract });
  } catch (err) {
    return next(err);
  }
};

// PATCH /contracts/:id/reject
export const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await rejectRentRequest({
      contractId: id,
      ownerUserId: req.userId
    });

    return res.status(200).json({ contract });
  } catch (err) {
    return next(err);
  }
};

// PATCH /contracts/:id/complete-payment
export const completePayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await completeContractPayment({
      contractId: id,
      tenantUserId: req.userId
    });

    return res.status(200).json({ contract });
  } catch (err) {
    return next(err);
  }
};

// GET /contracts/owner/pending
export const fetchOwnerPendingRequests = async (req, res, next) => {
  try {
    const contracts = await getOwnerPendingRentRequests({
      ownerUserId: req.userId
    });

    return res.status(200).json({ contracts });
  } catch (err) {
    return next(err);
  }
};
