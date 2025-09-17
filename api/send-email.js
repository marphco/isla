// api/send-email.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
      return res.status(500).json({ error: "Env SMTP non configurate" });
    }

    const { name, email, link, message, attachment } = req.body || {};
    if (!email) return res.status(400).json({ error: "Email destinatario mancante" });

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const html = `
      <p>Ciao ${name || "ospite"},</p>
      <p>Sei invitato! ${link ? `Ecco il link: <a href="${link}">${link}</a>` : ""}</p>
      ${message ? `<p>${message}</p>` : ""}
      <p>— Isla</p>
    `;

    const mail = {
      from: MAIL_FROM,
      to: email,
      subject: "Sei invitato!",
      html,
    };

    if (attachment?.contentBase64 && attachment?.filename && attachment?.contentType) {
      mail.attachments = [{
        filename: attachment.filename,
        content: Buffer.from(attachment.contentBase64, "base64"),
        contentType: attachment.contentType,
      }];
    }

    const info = await transporter.sendMail(mail);
    return res.status(200).json({ ok: true, id: info.messageId });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
