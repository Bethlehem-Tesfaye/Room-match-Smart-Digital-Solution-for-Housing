import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  acceptRequest,
  acceptTerminationRequestHandler,
  cancelRequest,
  completePayment,
  fetchConversationRentRequest,
  fetchOwnerActiveRequests,
  fetchOwnerAcceptedRequests,
  fetchOwnerTerminationRequests,
  fetchOwnerPendingRequests,
  fetchTenantRentals,
  rejectTerminationRequestHandler,
  rejectRequest,
  requestTermination,
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

contractRouter.get("/owner/pending", authMiddleware, fetchOwnerPendingRequests);

contractRouter.get(
  "/owner/accepted",
  authMiddleware,
  fetchOwnerAcceptedRequests
);

contractRouter.get("/owner/active", authMiddleware, fetchOwnerActiveRequests);

contractRouter.get(
  "/owner/termination-requests",
  authMiddleware,
  fetchOwnerTerminationRequests
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
  "/:id/termination-request",
  authMiddleware,
  validate(contractParamsSchema, "params"),
  requestTermination
);

contractRouter.patch(
  "/:id/termination-request/accept",
  authMiddleware,
  validate(contractParamsSchema, "params"),
  acceptTerminationRequestHandler
);

contractRouter.patch(
  "/:id/termination-request/reject",
  authMiddleware,
  validate(contractParamsSchema, "params"),
  rejectTerminationRequestHandler
);

contractRouter.patch(
  "/:id/complete-payment",
  authMiddleware,
  validate(contractParamsSchema, "params"),
  completePayment
);

export default contractRouter;
