import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  confirmPayment,
  initializePayment,
  paymentWebhook
} from "./payment.controller.js";
import { initializePaymentSchema } from "./validation.js";

const paymentRouter = Router();

paymentRouter.post(
  "/initialize",
  authMiddleware,
  validate(initializePaymentSchema),
  initializePayment
);

paymentRouter.post(
  "/confirm",
  authMiddleware,
  validate(initializePaymentSchema),
  confirmPayment
);

paymentRouter.get("/webhook", paymentWebhook);
paymentRouter.post("/webhook", paymentWebhook);

export default paymentRouter;
