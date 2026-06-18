import mongoose from "mongoose";

const { Types } = mongoose;

export const toUserIdString = (id) => (id == null ? "" : String(id));

export const buildUserIdVariants = (userId) => {
  const str = toUserIdString(userId);
  if (!str) return [];

  const variants = [str];
  if (Types.ObjectId.isValid(str)) {
    variants.push(new Types.ObjectId(str));
  }

  return variants;
};

export const userIdInFilter = (userId) => ({
  userId: { $in: buildUserIdVariants(userId) }
});

export const userOrTargetInFilter = (userId) => {
  const variants = buildUserIdVariants(userId);
  return {
    $or: [{ userId: { $in: variants } }, { targetUserId: { $in: variants } }]
  };
};

export const normalizePropertyId = (propertyId) => {
  if (propertyId == null) return null;
  const str = String(propertyId);
  if (!Types.ObjectId.isValid(str)) return str;
  return str;
};

export const propertyIdEquals = (left, right) => {
  const a = normalizePropertyId(left);
  const b = normalizePropertyId(right);
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return a === b;
};
