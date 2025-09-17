// api/send-sms.js
export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();
  
    try {
      const { CLICKSEND_USERNAME, CLICKSEND_API_KEY, CLICKSEND_FROM, INVITE_URL } = process.env;
      if (!CLICKSEND_USERNAME || !CLICKSEND_API_KEY || !INVITE_URL) {
        return res.status(500).json({ error: "Missing ClickSend or INVITE_URL env vars" });
      }
  
      const { phone, name, message } = req.body || {};
      if (!phone) return res.status(400).json({ error: "Recipient phone is required" });
  
      const body = `Hello ${name || "there"}! You're invited. Check the invitation: ${INVITE_URL}${message ? ` — ${message}` : ""}`;
  
      const auth = Buffer.from(`${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}`).toString("base64");
      const r = await fetch("https://rest.clicksend.com/v3/sms/send", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { source: "api", to: phone, body, from: CLICKSEND_FROM || undefined },
          ],
        }),
      });
  
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data });
      return res.status(200).json({ ok: true, data });
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }
  