import {
  createRoommateRequestService,
  getRoommateRequestsService,
  acceptRoommateRequestService,
  rejectRoommateRequestService
} from "./request.service.js";

export const createRoommateRequest = async (req, res, next) => {
  try {
    const request = await createRoommateRequestService({
      requesterId: req.userId,
      targetUserId: req.body.targetUserId,
      propertyId: req.body.propertyId
    });

    res.status(201).json({ success: true, request });
  } catch (err) {
    next(err);
  }
};

export const getRoommateRequests = async (req, res, next) => {
  try {
    const data = await getRoommateRequestsService(req.userId);

    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const acceptRoommateRequest = async (req, res, next) => {
  try {
    const request = await acceptRoommateRequestService({
      requestId: req.params.id,
      userId: req.userId
    });

    res.json({ success: true, request });
  } catch (err) {
    next(err);
  }
};

export const rejectRoommateRequest = async (req, res, next) => {
  try {
    const request = await rejectRoommateRequestService({
      requestId: req.params.id,
      userId: req.userId
    });

    res.json({ success: true, request });
  } catch (err) {
    next(err);
  }
};
