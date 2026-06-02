import { Client } from "@upstash/qstash";
import { logger } from "../config/logger.js";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN
});

export async function publishEmailJob(payload) {
  try {
    const preview = {
      to: payload.to,
      subject: payload.subject,
      htmlSnippet:
        typeof payload.html === "string"
          ? payload.html.slice(0, 200)
          : undefined,
      type: payload.type
    };

    logger.info(
      { target: process.env.EMAIL_API_URL, preview },
      "Publishing QStash job"
    );

    const res = await qstash.publishJSON({
      url: process.env.EMAIL_API_URL,
      body: payload
    });

    logger.info(
      { messageId: res.messageId, res },
      "QStash email job published"
    );

    return res;
  } catch (err) {
    const message =
      typeof err === "string"
        ? err
        : err instanceof Error
          ? err.message
          : String(err);

    logger.error({ message }, "QStash email publish failed");

    throw err;
  }
}
