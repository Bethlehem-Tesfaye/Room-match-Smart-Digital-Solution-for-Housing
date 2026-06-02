import multer from "multer";
import CustomError from "../lib/errors.js";
import { cloudinary } from "../lib/cloudinary.js";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return undefined;
};

const normalizeNullableNumber = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "number") return Number.isNaN(value) ? undefined : value;

  const normalized = String(value).trim();
  if (normalized === "") return null;

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const normalizeNumber = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === "number") return Number.isNaN(value) ? undefined : value;

  const normalized = String(value).trim();
  if (!normalized) return undefined;

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseAmenityIds = (value) => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
  } catch (_error) {
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return undefined;
};

const parseStringArray = (value) => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item)).filter(Boolean);
    }
  } catch (_error) {
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return undefined;
};

export const makeUploader = () => {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new CustomError("Only JPG, PNG, and WEBP images are allowed", 400));
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024
    }
  });
};

export const uploadImageToCloudinary = (file, folder, userId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${Date.now()}-${userId || "anonymous"}`,
        transformation: [
          { width: 1200, height: 800, crop: "limit" },
          { quality: "auto", fetch_format: "auto" }
        ]
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          return reject(error || new Error("Cloudinary upload failed"));
        }

        return resolve(result.secure_url);
      }
    );

    uploadStream.end(file.buffer);
  });
};

export const uploadMultipleImages = async (files, folder, userId) => {
  if (!files || files.length === 0) return [];

  const uploads = files.map((file) =>
    uploadImageToCloudinary(file, folder, userId)
  );
  return Promise.all(uploads);
};

export const normalizePropertyMultipartBody = (req, _res, next) => {
  if (!req.is("multipart/form-data")) {
    return next();
  }

  const { body } = req;

  const normalized = {
    ...body
  };

  const numericKeys = [
    "price",
    "numberOfBedrooms",
    "numberOfBathrooms",
    "leasePeriod",
    "initialPayment"
  ];

  numericKeys.forEach((key) => {
    const parsed = normalizeNumber(body[key]);
    if (parsed !== undefined) {
      normalized[key] = parsed;
    }
  });

  const nullableNumericKeys = ["floorNumber", "totalFloors", "areaSqFt"];

  nullableNumericKeys.forEach((key) => {
    const parsed = normalizeNullableNumber(body[key]);
    if (parsed !== undefined) {
      normalized[key] = parsed;
    }
  });

  const furnished = normalizeBoolean(body.isFurnished);
  if (furnished !== undefined) {
    normalized.isFurnished = furnished;
  }

  const allowRoommates = normalizeBoolean(body.allowRoommates);
  if (allowRoommates !== undefined) {
    normalized.allowRoommates = allowRoommates;
  }

  if (body.availableFrom === "") {
    normalized.availableFrom = null;
  }

  const amenityIds = parseAmenityIds(body.amenityIds);
  if (amenityIds !== undefined) {
    normalized.amenityIds = amenityIds;
  }

  const existingImageUrls = parseStringArray(body.existingImageUrls);
  if (existingImageUrls !== undefined) {
    normalized.existingImageUrls = existingImageUrls;
  }

  if (body.images && typeof body.images === "string") {
    try {
      const parsed = JSON.parse(body.images);
      if (Array.isArray(parsed)) {
        normalized.images = parsed;
      }
    } catch (_error) {
      normalized.images = [];
    }
  }

  req.body = normalized;
  return next();
};

export const attachUploadedPropertyImages = async (req, _res, next) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    const existingImageUrls = Array.isArray(req.body.existingImageUrls)
      ? req.body.existingImageUrls
      : [];

    // Only process images if there are files or existingImageUrls provided
    // This prevents accidentally deleting all images during a non-image update
    if (!files.length && !existingImageUrls.length) {
      return next();
    }

    const uploadedUrls = files.length
      ? await uploadMultipleImages(files, "roomMatch/property", req.userId)
      : [];

    const mergedImageUrls = [...existingImageUrls, ...uploadedUrls].filter(
      Boolean
    );

    req.body.images = [];

    if (!mergedImageUrls.length) {
      return next();
    }

    const requestedPrimaryIndex = Number.parseInt(
      String(req.body.primaryImageIndex ?? "0"),
      10
    );

    const primaryIndex = Number.isNaN(requestedPrimaryIndex)
      ? 0
      : Math.max(
          0,
          Math.min(requestedPrimaryIndex, mergedImageUrls.length - 1)
        );

    req.body.images = mergedImageUrls.map((imageUrl, index) => ({
      imageUrl,
      isPrimary: index === primaryIndex
    }));

    return next();
  } catch (_error) {
    return next(new CustomError("Failed to upload property images", 400));
  }
};

export const normalizeProfileMultipartBody = (req, _res, next) => {
  if (!req.is("multipart/form-data")) {
    return next();
  }

  const normalized = {
    ...req.body
  };

  const removeProfilePicture = normalizeBoolean(req.body.removeProfilePicture);
  if (removeProfilePicture !== undefined) {
    normalized.removeProfilePicture = removeProfilePicture;
  }

  req.body = normalized;
  return next();
};

export const attachUploadedProfileImage = async (req, _res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const imageUrl = await uploadImageToCloudinary(
      req.file,
      "roomMatch/profile",
      req.userId
    );

    req.body.imageUrl = imageUrl;
    return next();
  } catch (_error) {
    return next(new CustomError("Failed to upload profile image", 400));
  }
};
