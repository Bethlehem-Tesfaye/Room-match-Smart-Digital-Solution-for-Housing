import { google } from "googleapis";
import { logger } from "../config/logger.js";
import { env } from "../config/evnironments.js";

const oAuth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
);

oAuth2Client.setCredentials({
  refresh_token: env.GOOGLE_REFRESH_TOKEN,
});

const base64UrlEncode = (input) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

function buildRawMessage({ from, to, subject, html, attachments = [] }) {
  const boundary = `----=_Boundary_${Date.now()}`;
  const lines = [];

  lines.push(`From: ${from}`);
  lines.push(`To: ${to}`);
  lines.push(`Subject: ${subject}`);
  lines.push(`MIME-Version: 1.0`);
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  lines.push("");

  // HTML part
  lines.push(`--${boundary}`);
  lines.push(`Content-Type: text/html; charset="UTF-8"`);
  lines.push(`Content-Transfer-Encoding: 7bit`);
  lines.push("");
  lines.push(html);
  lines.push("");

  // Attachments
  for (const att of attachments) {
    let buffer;

    if (Buffer.isBuffer(att.content)) {
      buffer = att.content;
    } else if (
      typeof att.content === "string" &&
      att.content.startsWith("data:")
    ) {
      buffer = Buffer.from(att.content.split(",")[1] ?? "", "base64");
    } else {
      buffer = Buffer.from(att.content, "base64");
    }

    lines.push(`--${boundary}`);
    lines.push(
      `Content-Type: ${att.mimeType ?? "application/octet-stream"}; name="${att.filename}"`,
    );

    if (att.cid) {
      lines.push(`Content-Disposition: inline; filename="${att.filename}"`);
      lines.push(`Content-ID: <${att.cid}>`);
    } else {
      lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
    }

    lines.push(`Content-Transfer-Encoding: base64`);
    lines.push("");
    lines.push(buffer.toString("base64"));
    lines.push("");
  }

  lines.push(`--${boundary}--`);

  return base64UrlEncode(lines.join("\r\n"));
}

export async function sendMail({ to, subject, html, attachments = [] }) {
  try {
    const raw = buildRawMessage({
      from:
        env.SENDER_EMAIL ?? process.env.SENDER_EMAIL ?? "no-reply@example.com",
      to,
      subject,
      html,
      attachments,
    });

    const { token } = await oAuth2Client.getAccessToken();
    if (!token) throw new Error("Failed to obtain Gmail access token");

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    logger.info({ to, subject, id: res.data?.id }, "Email sent");
    return res.data;
  } catch (err) {
    function extractErrorInfo(e) {
      if (typeof e === "string") return { message: e };

      if (e instanceof Error) {
        const response =
          typeof e === "object" && e !== null && "response" in e
            ? e.response
            : undefined;

        return {
          message: e.message || "Error",
          response,
        };
      }

      return { message: String(e) };
    }

    const { message, response } = extractErrorInfo(err);

    logger.error(
      {
        message,
        response,
      },
      "Gmail API send failed",
    );

    throw err;
  }
}
