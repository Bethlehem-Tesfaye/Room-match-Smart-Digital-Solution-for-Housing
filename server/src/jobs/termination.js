import { logger } from "../config/logger.js";
import { sweepExpiredTerminationNotices } from "../models/contract/contract.service.js";

export const runTerminationNoticeSweep = async () => {
  try {
    const processed = await sweepExpiredTerminationNotices();
    logger.info({ processed }, "Termination notice sweep completed");
    return processed;
  } catch (error) {
    logger.error({ error }, "Termination notice sweep failed");
    throw error;
  }
};
