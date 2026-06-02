import CustomError from "../../lib/errors.js";
import { env } from "../../config/evnironments.js";
import { UserProfile } from "./schema.js";

const normalizePhoneNumber = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return value;
};

const normalizeBankField = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const INVALID_ACCOUNT_MESSAGE = "Please enter a correct account number";

const extractChapaSubaccountId = (payload) => {
  return (
    payload?.data?.id ??
    payload?.data?.subaccount_id ??
    payload?.data?.subaccountId ??
    payload?.data?.reference ??
    payload?.id ??
    payload?.subaccount_id ??
    payload?.subaccountId ??
    null
  );
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
      null
    );
  }

  return null;
};

const resolveChapaBankErrorMessage = (responsePayload, status) => {
  if (status === 400) {
    return INVALID_ACCOUNT_MESSAGE;
  }

  return (
    toReadableMessage(responsePayload?.message) ||
    toReadableMessage(responsePayload?.error) ||
    toReadableMessage(responsePayload?.data?.message) ||
    "Failed to set up bank information"
  );
};

const requestChapaSubaccount = async ({
  accountName,
  accountNumber,
  bankCode,
  businessName
}) => {
  if (!env.CHAPA_SECRET_KEY) {
    throw new CustomError("Missing Chapa secret key", 500);
  }

  const payload = {
    account_name: accountName,
    account_number: accountNumber,
    bank_code: bankCode,
    business_name: businessName,
    split_type: "percentage",
    split_value: 0.95
  };

  const response = await fetch("https://api.chapa.co/v1/subaccount", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const responsePayload = await response.json().catch(() => ({}));

  // console.log(
  //   "DEBUG Chapa POST response:",
  //   JSON.stringify(responsePayload, null, 2)
  // );

  if (
    !response.ok &&
    typeof responsePayload?.message === "string" &&
    responsePayload.message.toLowerCase().includes("does exist")
  ) {
    return null;
  }

  if (!response.ok) {
    throw new CustomError(
      resolveChapaBankErrorMessage(
        responsePayload,
        response.status || 500
      ),
      response.status || 500
    );
  }

  return extractChapaSubaccountId(responsePayload) ?? null;
};

export const getProfileByUserId = async (userId) => {
  const profile = await UserProfile.findOne({ userId }).lean();

  if (!profile) {
    throw new CustomError("Profile not found", 404);
  }

  return profile;
};

export const updateProfileByUserId = async ({ userId, name, payload }) => {
  const updateSet = {};
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);

  if (payload.fullName !== undefined) {
    updateSet.fullName = payload.fullName;
  }

  if (payload.phoneNumber !== undefined) {
    updateSet.phoneNumber = normalizedPhoneNumber;
  }

  if (payload.imageUrl) {
    updateSet.profilePictureUrl = payload.imageUrl;
  }

  if (payload.removeProfilePicture === true) {
    updateSet.profilePictureUrl = null;
  }

  const insertOnlySet = {
    userId,
    role: "user",
    deletedAt: null
  };

  if (updateSet.fullName === undefined) {
    insertOnlySet.fullName = payload.fullName ?? name ?? "";
  }

  if (updateSet.phoneNumber === undefined) {
    insertOnlySet.phoneNumber = normalizedPhoneNumber;
  }

  if (updateSet.profilePictureUrl === undefined) {
    insertOnlySet.profilePictureUrl = null;
  }

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    {
      $set: updateSet,
      $setOnInsert: insertOnlySet
    },
    {
      upsert: true,
      new: true,
      runValidators: true
    }
  ).lean();

  if (!profile) {
    throw new CustomError("Unable to update profile", 500);
  }

  return profile;
};

export const setupBankInfoByUserId = async ({ userId, name, payload }) => {
  const accountName = normalizeBankField(payload.accountName);
  const accountNumber = normalizeBankField(payload.accountNumber);
  const bankCode = normalizeBankField(payload.bankCode);
  const bankName = normalizeBankField(payload.bankName);

  const existingProfile = await UserProfile.findOne({ userId }).lean();

  if (!existingProfile) {
    throw new CustomError("Profile not found", 404);
  }

  const existingSubaccountId =
    existingProfile.bankInfo?.chapaSubaccountId ?? null;

  const chapaSubaccountId =
    (await requestChapaSubaccount({
      accountName,
      accountNumber,
      bankCode,
      businessName: existingProfile.fullName || name || accountName
    })) ?? existingSubaccountId;

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        bankInfo: {
          accountName,
          accountNumber,
          bankCode,
          bankName,
          chapaSubaccountId
        }
      },
      $setOnInsert: {
        userId,
        role: "user",
        deletedAt: null,
        fullName: existingProfile.fullName || name || "",
        phoneNumber: existingProfile.phoneNumber ?? null,
        hasCompletedOnboarding: existingProfile.hasCompletedOnboarding ?? false,
        profilePictureUrl: existingProfile.profilePictureUrl ?? null
      }
    },
    {
      upsert: true,
      new: true,
      runValidators: true
    }
  ).lean();

  if (!profile) {
    throw new CustomError("Unable to save bank information", 500);
  }

  return profile;
};
