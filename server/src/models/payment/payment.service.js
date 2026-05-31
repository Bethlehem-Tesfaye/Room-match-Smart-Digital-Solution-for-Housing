import CustomError from "../../lib/errors.js";
import { env } from "../../config/evnironments.js";
import { User } from "../auth/schema.js";
import { Contract } from "../contract/schema.js";
import { Property } from "../property/schema.js";
import { UserProfile } from "../profile/schema.js";
import { Payment } from "./schema.js";

const getChapaSecretKey = () => {
  return process.env.CHAPA_SECRET_KEY || process.env.CHAPA_TEST_SECRET_KEY;
};

const buildUrl = (baseUrl, pathname) => {
  if (!baseUrl) {
    throw new CustomError("Missing server configuration", 500);
  }

  return new URL(pathname, baseUrl).toString();
};

const getServerBaseUrl = () => {
  return env.SERVER_URL || `http://localhost:${env.PORT || 8000}`;
};

const toReadableMessage = (value) => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const joined = value
      .map((item) => toReadableMessage(item))
      .filter(Boolean)
      .join(", ");

    return joined || null;
  }

  if (value && typeof value === "object") {
    return (
      toReadableMessage(value.message) ||
      toReadableMessage(value.error) ||
      toReadableMessage(value.detail) ||
      (() => {
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      })()
    );
  }

  return null;
};

const parseChapaResponse = async (response) => {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const readableMessage =
      toReadableMessage(payload?.message) ||
      toReadableMessage(payload?.error) ||
      toReadableMessage(payload?.detail) ||
      toReadableMessage(payload?.data?.message) ||
      toReadableMessage(payload?.data) ||
      "Failed to communicate with Chapa";

    throw new CustomError(readableMessage, response.status || 500);
  }

  return payload;
};

const getChapaStatus = (payload) => {
  return (
    payload?.data?.status ??
    payload?.status ??
    payload?.data?.payment_status ??
    payload?.payment_status ??
    null
  );
};

const getCheckoutUrl = (payload) => {
  return payload?.data?.checkout_url ?? payload?.checkout_url ?? null;
};

const applySuccessfulPayment = async (payment) => {
  if (!payment) {
    return;
  }

  await Contract.findByIdAndUpdate(payment.contractId, {
    $set: {
      status: "ACTIVE",
      startDate: new Date()
    }
  });

  await Property.findByIdAndUpdate(payment.listingId, {
    $set: {
      status: "Rented"
    }
  });
};

const toIdString = (value) => {
  if (!value) return null;

  if (typeof value === "string") return value;

  if (typeof value === "object" && value._id) {
    return String(value._id);
  }

  return String(value);
};

export const initializeContractPayment = async ({
  contractId,
  tenantUserId,
  tenantEmail,
  tenantName
}) => {
  if (!tenantEmail) {
    throw new CustomError("Tenant email is required", 400);
  }

  const contract = await Contract.findById(contractId).lean();

  if (!contract) {
    throw new CustomError("Rent request not found", 404);
  }

  if (String(contract.tenantId) !== String(tenantUserId)) {
    throw new CustomError("You are not allowed to pay for this contract", 403);
  }

  if (contract.status !== "RESERVED") {
    throw new CustomError(
      "Payment is only allowed for reserved contracts",
      400
    );
  }

  if (
    contract.paymentDueAt &&
    new Date(contract.paymentDueAt).getTime() <= Date.now()
  ) {
    throw new CustomError("Payment window has expired", 410);
  }

  const listing = await Property.findById(contract.listingId).lean();

  if (!listing) {
    throw new CustomError("Property not found", 404);
  }

  const ownerProfile = await UserProfile.findOne({
    $or: [{ userId: String(contract.ownerId) }, { userId: contract.ownerId }]
  }).lean();

  const ownerChapaSubaccountId = ownerProfile?.bankInfo?.chapaSubaccountId;

  // console.log(
  //   "DEBUG contract.ownerId:",
  //   contract.ownerId,
  //   "| type:",
  //   typeof contract.ownerId
  // );
  // console.log("DEBUG ownerProfile found:", ownerProfile);
  // console.log("DEBUG chapaSubaccountId:", ownerChapaSubaccountId);

  if (!ownerChapaSubaccountId) {
    throw new CustomError("Owner bank information is not configured", 400);
  }

  const amount = Number(listing.initialPayment ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new CustomError("Invalid payment amount", 400);
  }

  const platformFee = Number((amount * 0.05).toFixed(2));
  const ownerAmount = Number((amount * 0.95).toFixed(2));
  const txRef = `RENT-${contractId}-${Date.now()}`;

  const chapaSecretKey = getChapaSecretKey();

  if (!chapaSecretKey) {
    throw new CustomError("Missing Chapa secret key", 500);
  }

  const callbackUrl = buildUrl(getServerBaseUrl(), "/api/payments/webhook");
  const returnUrl = buildUrl(
    env.CLIENT_URL || "http://localhost:5173",
    "/my-rentals?payment=success"
  );

  const response = await fetch(
    "https://api.chapa.co/v1/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chapaSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: String(amount),
        currency: listing.currency || "ETB",
        email: tenantEmail,
        first_name: tenantName,
        tx_ref: txRef,
        callback_url: callbackUrl,
        return_url: returnUrl,
        subaccounts: {
          id: ownerChapaSubaccountId,
          split_type: "percentage",
          split_value: 0.95
        }
      })
    }
  );

  const responsePayload = await parseChapaResponse(response);
  const checkoutUrl = getCheckoutUrl(responsePayload);

  if (!checkoutUrl) {
    throw new CustomError("Missing checkout URL from Chapa", 500);
  }

  await Payment.create({
    contractId: contract._id,
    tenantId: String(contract.tenantId),
    ownerId: String(contract.ownerId),
    listingId: contract.listingId,
    txRef,
    amount,
    platformFee,
    ownerAmount,
    currency: listing.currency || "ETB",
    status: "pending",
    chapaCheckoutUrl: checkoutUrl
  });

  return { checkoutUrl };
};

export const handlePaymentWebhook = async (payload) => {
  const txRef =
    payload?.tx_ref ??
    payload?.trx_ref ??
    payload?.data?.tx_ref ??
    payload?.data?.trx_ref ??
    null;

  const webhookStatus =
    payload?.status ?? payload?.data?.status ?? payload?.payment_status ?? null;

  if (!txRef) {
    return;
  }

  const chapaSecretKey = getChapaSecretKey();

  if (!chapaSecretKey) {
    throw new CustomError("Missing Chapa secret key", 500);
  }

  const verifyResponse = await fetch(
    `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(txRef)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${chapaSecretKey}`
      }
    }
  );

  const verifiedPayload = await parseChapaResponse(verifyResponse);
  const verifiedStatus = getChapaStatus(verifiedPayload) || webhookStatus;

  if (verifiedStatus === "failed") {
    await Payment.findOneAndUpdate(
      { txRef },
      { $set: { status: "failed" } },
      { new: true }
    );

    return;
  }

  if (verifiedStatus !== "success") {
    return;
  }

  const payment = await Payment.findOneAndUpdate(
    { txRef },
    { $set: { status: "success" } },
    { new: true }
  );

  await applySuccessfulPayment(payment);
};

export const confirmContractPayment = async ({ contractId, tenantUserId }) => {
  const payment = await Payment.findOne({
    contractId,
    tenantId: String(tenantUserId),
    status: "pending"
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!payment) {
    throw new CustomError("No pending payment found for this contract", 404);
  }

  const chapaSecretKey = getChapaSecretKey();

  if (!chapaSecretKey) {
    throw new CustomError("Missing Chapa secret key", 500);
  }

  const verifyResponse = await fetch(
    `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(payment.txRef)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${chapaSecretKey}`
      }
    }
  );

  const verifiedPayload = await parseChapaResponse(verifyResponse);
  // console.log(
  //   "DEBUG Chapa verify full response:",
  //   JSON.stringify(verifiedPayload, null, 2)
  // );
  const verifiedStatus = getChapaStatus(verifiedPayload);

  if (verifiedStatus === "failed") {
    await Payment.findOneAndUpdate(
      { txRef: payment.txRef },
      { $set: { status: "failed" } },
      { new: true }
    );

    return { status: "failed" };
  }

  if (verifiedStatus !== "success") {
    throw new CustomError("Payment is not completed yet", 400);
  }

  const updatedPayment = await Payment.findOneAndUpdate(
    { txRef: payment.txRef },
    { $set: { status: "success" } },
    { new: true }
  );

  await applySuccessfulPayment(updatedPayment || payment);

  return { status: "success" };
};

export const getContractPaymentReceipt = async ({
  contractId,
  viewerUserId
}) => {
  const payment = await Payment.findOne({ contractId })
    .sort({ createdAt: -1 })
    .populate({
      path: "contractId",
      model: Contract,
      populate: [
        {
          path: "tenantId",
          model: User,
          select: "_id name email image"
        },
        {
          path: "ownerId",
          model: User,
          select: "_id name email image"
        },
        {
          path: "listingId",
          model: Property,
          select: "_id title city address price currency status"
        }
      ]
    })
    .lean();

  if (!payment) {
    throw new CustomError("Receipt not found", 404);
  }

  const contract = payment.contractId;

  if (!contract) {
    throw new CustomError("Receipt not found", 404);
  }

  const tenantId = toIdString(contract.tenantId);
  const ownerId = toIdString(contract.ownerId);
  const viewerId = String(viewerUserId);

  if (viewerId !== tenantId && viewerId !== ownerId) {
    throw new CustomError("You are not allowed to view this receipt", 403);
  }

  return {
    payment,
    contract,
    listing: contract.listingId,
    tenant: contract.tenantId,
    owner: contract.ownerId
  };
};
