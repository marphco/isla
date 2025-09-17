// api/send-email.js
import nodemailer from "nodemailer";

function guessContentType(url) {
    const u = url.split("?")[0].toLowerCase();
    if (u.endsWith(".pdf")) return "application/pdf";
    if (u.endsWith(".png")) return "image/png";
    if (u.endsWith(".jpg") || u.endsWith(".jpeg")) return "image/jpeg";
    if (u.endsWith(".webp")) return "image/webp";
    if (u.endsWith(".gif")) return "image/gif";
    return "application/octet-stream";
}

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    try {
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, INVITE_URL } = process.env;
        if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !INVITE_URL) {
            return res.status(500).json({ error: "Missing SMTP or INVITE_URL env vars" });
        }

        const { name, email, message } = req.body || {};
        if (!email) return res.status(400).json({ error: "Recipient email is required" });

        // Fetch the static invite file
        const resp = await fetch(INVITE_URL);
        if (!resp.ok) return res.status(500).json({ error: "Failed to download INVITE_URL" });
        const arrayBuf = await resp.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        const contentType = guessContentType(INVITE_URL);
        const filename = (INVITE_URL.split("/").pop() || "invite");

        // SMTP transporter
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: false, // STARTTLS
            auth: { user: SMTP_USER, pass: SMTP_PASS },
        });

        const isImage = contentType.startsWith("image/");
        const cid = "isla-invite@cid";

        // Email body (English)
        const html = `
    <p>Hello ${name || "guest"},</p>
    <p>You are invited! Please find the invitation attached below.</p>
    ${isImage ? `<p><img src="cid:${cid}" alt="Invitation" style="max-width:100%;height:auto;border:0" /></p>` : ""}
    ${message ? `<p style="margin-top:12px;font-style:italic;">${message}</p>` : ""}
    <p>— Isla</p>
  `;


        const attachments = [
            {
                filename,
                content: buf,
                contentType,
                ...(isImage ? { cid } : {}), // embed inline if it's an image
            },
        ];

        const info = await transporter.sendMail({
            from: MAIL_FROM,
            to: email,
            subject: "You are invited!",
            html,
            attachments,
        });

        return res.status(200).json({ ok: true, id: info.messageId });
    } catch (e) {
        return res.status(500).json({ error: String(e) });
    }
}
