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

  if (!to || !subject || !finalHtml) {
    return res
      .status(400)
      .json({ error: "to, subject and html/text are required" });
  }

  try {
    await sendMail({ to, subject, html: finalHtml });
    logger.info({ to, type }, "Email sent via /api/send-email");
    return res.status(200).json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Failed to send email from /api/send-email");
    return res.status(500).json({ error: "Failed to send email" });
  }
});

export default emailRouter;
