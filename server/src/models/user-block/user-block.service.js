import mongoose from "mongoose";
import CustomError from "../../lib/errors.js";
import { emitToUser } from "../../config/socket.js";
import { UserBlock } from "./schema.js";

const { Types } = mongoose;

export const normalizeUserId = (value) => {
  if (value == null || value === "") {
    return "";
  }

  const raw =
    typeof value === "object" && typeof value.toString === "function"
      ? value.toString()
      : String(value);

  const trimmed = raw.trim();

  if (Types.ObjectId.isValid(trimmed)) {
    return new Types.ObjectId(trimmed).toString();
  }

  return trimmed;
};

const blockMatchesPair = (block, userA, userB) => {
  const blocker = normalizeUserId(block.blockerUserId);
  const blocked = normalizeUserId(block.blockedUserId);

  return (
    (blocker === userA && blocked === userB) ||
    (blocker === userB && blocked === userA)
  );
};

const findBlocksBetweenUsers = async (userA, userB) => {
  const normalizedA = normalizeUserId(userA);
  const normalizedB = normalizeUserId(userB);

  if (!normalizedA || !normalizedB || normalizedA === normalizedB) {
    return [];
  }

  const candidates = await UserBlock.find({
    $or: [
      { blockerUserId: { $in: [normalizedA, normalizedB] } },
      { blockedUserId: { $in: [normalizedA, normalizedB] } }
    ]
  }).lean();

  return candidates.filter((block) =>
    blockMatchesPair(block, normalizedA, normalizedB)
  );
};

export const emitBlockStatusToUsers = async (userA, userB) => {
  const normalizedA = normalizeUserId(userA);
  const normalizedB = normalizeUserId(userB);

  if (!normalizedA || !normalizedB || normalizedA === normalizedB) {
    return;
  }

  const [statusForA, statusForB] = await Promise.all([
    getBlockStatus({ viewerUserId: normalizedA, otherUserId: normalizedB }),
    getBlockStatus({ viewerUserId: normalizedB, otherUserId: normalizedA })
  ]);

  emitToUser(normalizedA, "user-block:updated", {
    otherUserId: normalizedB,
    ...statusForA
  });
  emitToUser(normalizedB, "user-block:updated", {
    otherUserId: normalizedA,
    ...statusForB
  });
};

export const isBlockedBetweenUsers = async (userA, userB) => {
  const blocks = await findBlocksBetweenUsers(userA, userB);
  return blocks.length > 0;
};

export const assertUsersCanCommunicate = async (userA, userB) => {
  const blocked = await isBlockedBetweenUsers(userA, userB);

  if (blocked) {
    throw new CustomError(
      "You cannot message this user. One of you has blocked the other.",
      403
    );
  }
};

export const blockUser = async ({ blockerUserId, blockedUserId }) => {
  const normalizedBlocker = normalizeUserId(blockerUserId);
  const normalizedBlocked = normalizeUserId(blockedUserId);

  if (!normalizedBlocker || !normalizedBlocked) {
    throw new CustomError("Invalid user id.", 400);
  }

  if (normalizedBlocker === normalizedBlocked) {
    throw new CustomError("You cannot block yourself.", 400);
  }

  await UserBlock.findOneAndUpdate(
    { blockerUserId: normalizedBlocker, blockedUserId: normalizedBlocked },
    {
      $setOnInsert: {
        blockerUserId: normalizedBlocker,
        blockedUserId: normalizedBlocked
      }
    },
    { upsert: true, new: true }
  );

  await emitBlockStatusToUsers(normalizedBlocker, normalizedBlocked);

  return { blockedUserId: normalizedBlocked };
};

export const unblockUser = async ({ blockerUserId, blockedUserId }) => {
  const normalizedBlocker = normalizeUserId(blockerUserId);
  const normalizedBlocked = normalizeUserId(blockedUserId);

  if (!normalizedBlocker || !normalizedBlocked) {
    throw new CustomError("Invalid user id.", 400);
  }

  let deletedCount = 0;

  const directDelete = await UserBlock.deleteOne({
    blockerUserId: normalizedBlocker,
    blockedUserId: normalizedBlocked
  });
  deletedCount += directDelete.deletedCount ?? 0;

  if (deletedCount === 0) {
    const legacyBlocks = await UserBlock.find({
      blockerUserId: normalizedBlocker
    }).lean();

    const legacyIds = legacyBlocks
      .filter(
        (block) => normalizeUserId(block.blockedUserId) === normalizedBlocked
      )
      .map((block) => block._id);

    if (legacyIds.length) {
      const legacyDelete = await UserBlock.deleteMany({
        _id: { $in: legacyIds }
      });
      deletedCount += legacyDelete.deletedCount ?? 0;
    }
  }

  if (deletedCount === 0) {
    throw new CustomError("Block record not found.", 404);
  }

  await emitBlockStatusToUsers(normalizedBlocker, normalizedBlocked);

  return { blockedUserId: normalizedBlocked };
};

export const listBlockedUserIds = async (blockerUserId) => {
  const normalizedBlocker = normalizeUserId(blockerUserId);

  const rows = await UserBlock.find({ blockerUserId: normalizedBlocker })
    .select({ blockedUserId: 1 })
    .lean();

  return rows.map((row) => normalizeUserId(row.blockedUserId)).filter(Boolean);
};

export const getBlockStatus = async ({ viewerUserId, otherUserId }) => {
  const normalizedViewer = normalizeUserId(viewerUserId);
  const normalizedOther = normalizeUserId(otherUserId);

  if (
    !normalizedViewer ||
    !normalizedOther ||
    normalizedViewer === normalizedOther
  ) {
    return { blockedByMe: false, blockedByThem: false };
  }

  const blocks = await findBlocksBetweenUsers(
    normalizedViewer,
    normalizedOther
  );

  let blockedByMe = false;
  let blockedByThem = false;

  for (const block of blocks) {
    const blocker = normalizeUserId(block.blockerUserId);
    const blocked = normalizeUserId(block.blockedUserId);

    if (blocker === normalizedViewer && blocked === normalizedOther) {
      blockedByMe = true;
    }

    if (blocker === normalizedOther && blocked === normalizedViewer) {
      blockedByThem = true;
    }
  }

  return { blockedByMe, blockedByThem };
};
