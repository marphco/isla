// api/send-mms.js
export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();
    try {
      const { CLICKSEND_USERNAME, CLICKSEND_API_KEY, INVITE_URL, CLICKSEND_FROM_US } = process.env;
      const { phone, name, message } = req.body || {};
  
      if (!CLICKSEND_USERNAME || !CLICKSEND_API_KEY || !INVITE_URL) {
        return res.status(500).json({ error: "Missing ClickSend or INVITE_URL env vars" });
      }
      if (!phone) return res.status(400).json({ error: "Recipient phone is required" });
      if (!phone.startsWith("+1")) {
        return res.status(400).json({ error: "MMS supported only for US numbers (+1)" });
      }
  
      const body = `Hello ${name || "there"}! You're invited.${message ? ` ${message}` : ""}`;
  
      const payload = {
        messages: [
          {
            source: "api",
            to: phone,
            body,
            subject: "Invitation",       // necessario per MMS
            media: [INVITE_URL],         // link https pubblico
            ...(CLICKSEND_FROM_US ? { from: CLICKSEND_FROM_US } : {}),
          },
        ],
      };
  
      const auth = Buffer.from(`${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}`).toString("base64");
      const r = await fetch("https://rest.clicksend.com/v3/mms/send", {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        console.error("ClickSend MMS error", data); // log per debug
        return res.status(r.status).json({ error: data });
      }
      return res.status(200).json({ ok: true, data });
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }
  