import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  acceptRequest,
  completePayment,
  fetchConversationRentRequest,
  fetchOwnerPendingRequests,
  fetchTenantRentals,
  rejectRequest,
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

contractRouter.patch(
  "/:id/complete-payment",
  authMiddleware,
  validate(contractParamsSchema, "params"),
  completePayment
);

export default contractRouter;
