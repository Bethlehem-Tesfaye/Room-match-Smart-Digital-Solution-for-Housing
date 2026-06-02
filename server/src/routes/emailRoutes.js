import express from "express";
import { logger } from "../config/logger.js";
import { sendMail } from "../lib/mailer.js";

const emailRouter = express.Router();

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToHtml(text) {
  return `<div style="white-space:pre-wrap">${escapeHtml(text)}</div>`;
}

emailRouter.post("/api/send-email", express.json(), async (req, res) => {
  const { to, subject, html, text, type } = req.body;

  const finalHtml = html ?? (text ? textToHtml(text) : undefined);

  const bodySize = Buffer.byteLength(JSON.stringify(req.body || {}));

  logger.info(
    {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      headers: req.headers,
      bodyKeys: Object.keys(req.body || {}),
      bodySize,
      snippet: (finalHtml || "").slice(0, 300),
      type
    },
    "Received /api/send-email request"
  );

  if (!to || !subject || !finalHtml) {
    logger.warn(
      { to, subject, bodySize },
      "Bad request to /api/send-email: missing fields"
    );
    return res
      .status(400)
      .json({ error: "to, subject and html/text are required" });
  }

  try {
    const sendResult = await sendMail({ to, subject, html: finalHtml });
    logger.info(
      {
        to,
        type,
        sendResult: {
          id: sendResult?.id,
          threadId: sendResult?.threadId,
          labelIds: sendResult?.labelIds
        }
      },
      "Email sent via /api/send-email"
    );
    return res.status(200).json({ ok: true });
  } catch (err) {
    logger.error(
      { err, to, subject },
      "Failed to send email from /api/send-email"
    );
    return res.status(500).json({ error: "Failed to send email" });
  }
});

export default emailRouter;
