import {
  acceptRentRequest,
  acceptTerminationRequest,
  getOwnerActiveRentRequests,
  getOwnerAcceptedRentRequests,
  getOwnerTerminationRequests,
  cancelRentRequest,
  completeContractPayment,
  createTerminationRequest,
  createRentRequest,
  getConversationRentRequest,
  getOwnerPendingRentRequests,
  getTenantRentalContracts,
  rejectTerminationRequest,
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

// DELETE /contracts/:id
export const cancelRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await cancelRentRequest({
      contractId: id,
      requesterUserId: req.userId
    });

    return res.status(200).json({ contract });
  } catch (err) {
    return next(err);
  }
};

// POST /contracts/:id/termination-request
export const requestTermination = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await createTerminationRequest({
      contractId: id,
      requesterUserId: req.userId
    });

    return res.status(200).json({ contract });
  } catch (err) {
    return next(err);
  }
};

// PATCH /contracts/:id/termination-request/accept
export const acceptTerminationRequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await acceptTerminationRequest({
      contractId: id,
      requesterUserId: req.userId
    });

    return res.status(200).json({ contract });
  } catch (err) {
    return next(err);
  }
};

// PATCH /contracts/:id/termination-request/reject
export const rejectTerminationRequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await rejectTerminationRequest({
      contractId: id,
      requesterUserId: req.userId
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

// GET /contracts/owner/accepted
export const fetchOwnerAcceptedRequests = async (req, res, next) => {
  try {
    const contracts = await getOwnerAcceptedRentRequests({
      ownerUserId: req.userId
    });

    return res.status(200).json({ contracts });
  } catch (err) {
    return next(err);
  }
};

// GET /contracts/owner/active
export const fetchOwnerActiveRequests = async (req, res, next) => {
  try {
    const contracts = await getOwnerActiveRentRequests({
      ownerUserId: req.userId
    });

    return res.status(200).json({ contracts });
  } catch (err) {
    return next(err);
  }
};

// GET /contracts/owner/termination-requests
export const fetchOwnerTerminationRequests = async (req, res, next) => {
  try {
    const contracts = await getOwnerTerminationRequests({
      ownerUserId: req.userId
    });

    return res.status(200).json({ contracts });
  } catch (err) {
    return next(err);
  }
};

// GET /contracts/tenant/my-rentals
export const fetchTenantRentals = async (req, res, next) => {
  try {
    const contracts = await getTenantRentalContracts({
      tenantUserId: req.userId
    });

    return res.status(200).json({ contracts });
  } catch (err) {
    return next(err);
  }
};
