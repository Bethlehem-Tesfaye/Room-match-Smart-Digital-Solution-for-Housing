import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  acceptRequest,
  cancelRequest,
  completePayment,
  fetchConversationRentRequest,
  fetchOwnerActiveRequests,
  fetchOwnerAcceptedRequests,
  fetchOwnerTerminationRequests,
  fetchOwnerRentalUnreadCounts,
  fetchOwnerPendingRequests,
  fetchTenantRentals,
  fetchTenantRentalUnreadCounts,
  markOwnerIncomingRead,
  markOwnerTerminationRead,
  markTenantRequestedRead,
  markTenantTerminationRead,
  rejectRequest,
  createTerminationNoticeHandler,
  completeEarlyTerminationHandler,
  withdrawTerminationNoticeHandler,
  requestToRent
} from "./contract.controller.js";
import {
  contractParamsSchema,
  conversationRentRequestParamsSchema,
  createRentRequestSchema
} from "./validation.js";

const contractRouter = Router();

contractRouter.post(
  "/request",
  authMiddleware,
  validate(createRentRequestSchema),
  requestToRent
);

contractRouter.get(
  "/conversation/:conversationId",
  authMiddleware,
  validate(conversationRentRequestParamsSchema, "params"),
  fetchConversationRentRequest
);

contractRouter.get(
  "/owner/unread-counts",
  authMiddleware,
  fetchOwnerRentalUnreadCounts
);

contractRouter.patch(
  "/owner/mark-incoming-read",
  authMiddleware,
  markOwnerIncomingRead
);

contractRouter.patch(
  "/owner/mark-termination-read",
  authMiddleware,
  markOwnerTerminationRead
);

contractRouter.get("/owner/pending", authMiddleware, fetchOwnerPendingRequests);

contractRouter.get(
  "/owner/accepted",
  authMiddleware,
  fetchOwnerAcceptedRequests
);

contractRouter.get("/owner/active", authMiddleware, fetchOwnerActiveRequests);

contractRouter.get(
  "/owner/termination-notices",
  authMiddleware,
  fetchOwnerTerminationRequests
);

contractRouter.get(
  "/tenant/unread-counts",
  authMiddleware,
  fetchTenantRentalUnreadCounts
);

contractRouter.patch(
  "/tenant/mark-requested-read",
  authMiddleware,
  markTenantRequestedRead
);

contractRouter.patch(
  "/tenant/mark-termination-read",
  authMiddleware,
  markTenantTerminationRead
);

contractRouter.get("/tenant/my-rentals", authMiddleware, fetchTenantRentals);

contractRouter.patch(
  "/:id/accept",
  authMiddleware,
  validate(contractParamsSchema, "params"),
  acceptRequest
);

contractRouter.patch(
  "/:id/reject",
  authMiddleware,
  validate(contractParamsSchema, "params"),
  rejectRequest
);

contractRouter.delete(
  "/:id",
  authMiddleware,
  validate(contractParamsSchema, "params"),
  cancelRequest
);

contractRouter.post(
  "/:id/terminate",
  authMiddleware,
  validate(contractParamsSchema, "params"),
  createTerminationNoticeHandler
);

contractRouter.post(
  "/:id/terminate-early",
  authMiddleware,
  validate(contractParamsSchema, "params"),
  completeEarlyTerminationHandler
);

contractRouter.post(
  "/:id/withdraw-termination",
  authMiddleware,
  validate(contractParamsSchema, "params"),
  withdrawTerminationNoticeHandler
);

contractRouter.patch(
  "/:id/complete-payment",
  authMiddleware,
  validate(contractParamsSchema, "params"),
  completePayment
);

export default contractRouter;
