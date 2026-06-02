import {
  acceptRentRequest,
  cancelRentRequest,
  completeContractPayment,
  createRentRequest,
  createTerminationNotice,
  getConversationRentRequest,
  getOwnerActiveRentRequests,
  getOwnerAcceptedRentRequests,
  getOwnerPendingRentRequests,
  getOwnerTerminationRequests,
  getOwnerRentalUnreadCounts,
  getTenantRentalContracts,
  markOwnerIncomingAsRead,
  markOwnerTerminationAsRead,
  emitOwnerRentalUnreadUpdate,
  emitTenantRentalUnreadUpdate,
  getTenantRentalUnreadCounts,
  markTenantRequestedAsRead,
  markTenantTerminationAsRead,
  rejectRentRequest,
  sweepExpiredTerminationNotices,
  withdrawTerminationNotice
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

// POST /contracts/:id/terminate
export const createTerminationNoticeHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await createTerminationNotice({
      contractId: id,
      requesterUserId: req.userId
    });

    return res.status(200).json({ contract });
  } catch (err) {
    return next(err);
  }
};

// POST /contracts/:id/withdraw-termination
export const withdrawTerminationNoticeHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await withdrawTerminationNotice({
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

// GET /contracts/owner/unread-counts
export const fetchOwnerRentalUnreadCounts = async (req, res, next) => {
  try {
    const counts = await getOwnerRentalUnreadCounts({
      ownerUserId: req.userId
    });

    return res.status(200).json(counts);
  } catch (err) {
    return next(err);
  }
};

// PATCH /contracts/owner/mark-incoming-read
export const markOwnerIncomingRead = async (req, res, next) => {
  try {
    const result = await markOwnerIncomingAsRead({
      ownerUserId: req.userId
    });

    const counts = await getOwnerRentalUnreadCounts({
      ownerUserId: req.userId
    });

    void emitOwnerRentalUnreadUpdate(req.userId).catch(() => undefined);

    return res.status(200).json({
      message: "Incoming rental requests marked as read",
      ...result,
      counts
    });
  } catch (err) {
    return next(err);
  }
};

// PATCH /contracts/owner/mark-termination-read
export const markOwnerTerminationRead = async (req, res, next) => {
  try {
    const result = await markOwnerTerminationAsRead({
      ownerUserId: req.userId
    });

    const counts = await getOwnerRentalUnreadCounts({
      ownerUserId: req.userId
    });

    void emitOwnerRentalUnreadUpdate(req.userId).catch(() => undefined);

    return res.status(200).json({
      message: "Termination notices marked as read",
      ...result,
      counts
    });
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

// GET /contracts/tenant/unread-counts
export const fetchTenantRentalUnreadCounts = async (req, res, next) => {
  try {
    const counts = await getTenantRentalUnreadCounts({
      tenantUserId: req.userId
    });

    return res.status(200).json(counts);
  } catch (err) {
    return next(err);
  }
};

// PATCH /contracts/tenant/mark-requested-read
export const markTenantRequestedRead = async (req, res, next) => {
  try {
    const result = await markTenantRequestedAsRead({
      tenantUserId: req.userId
    });

    const counts = await getTenantRentalUnreadCounts({
      tenantUserId: req.userId
    });

    void emitTenantRentalUnreadUpdate(req.userId).catch(() => undefined);

    return res.status(200).json({
      message: "Requested rental updates marked as read",
      ...result,
      counts
    });
  } catch (err) {
    return next(err);
  }
};

// PATCH /contracts/tenant/mark-termination-read
export const markTenantTerminationRead = async (req, res, next) => {
  try {
    const result = await markTenantTerminationAsRead({
      tenantUserId: req.userId
    });

    const counts = await getTenantRentalUnreadCounts({
      tenantUserId: req.userId
    });

    void emitTenantRentalUnreadUpdate(req.userId).catch(() => undefined);

    return res.status(200).json({
      message: "Termination notices marked as read",
      ...result,
      counts
    });
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

export const runTerminationNoticeSweep = async () => {
  return sweepExpiredTerminationNotices();
};
