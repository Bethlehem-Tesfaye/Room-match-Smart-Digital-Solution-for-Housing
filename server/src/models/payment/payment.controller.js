import { logger } from "../../config/logger.js";
import {
  confirmContractPayment,
  handlePaymentWebhook,
  initializeContractPayment
} from "./payment.service.js";

export const initializePayment = async (req, res, next) => {
  try {
    const checkout = await initializeContractPayment({
      contractId: req.body.contractId,
      tenantUserId: req.userId,
      tenantEmail: req.user?.email,
      tenantName: req.user?.name || req.user?.email?.split("@")[0] || "Tenant"
    });

    return res.status(200).json({ checkout_url: checkout.checkoutUrl });
  } catch (error) {
    return next(error);
  }
};

export const paymentWebhook = async (req, res) => {
  try {
    const payload =
      req.body && Object.keys(req.body).length > 0 ? req.body : req.query;

    await handlePaymentWebhook(payload);
  } catch (error) {
    logger.error({ error }, "Payment webhook processing failed");
  }

  return res.status(200).json({ ok: true });
};

export const confirmPayment = async (req, res, next) => {
  try {
    const result = await confirmContractPayment({
      contractId: req.body.contractId,
      tenantUserId: req.userId
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};
