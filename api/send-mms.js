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
  
      // Quick media sanity check (public + small)
      try {
        const head = await fetch(INVITE_URL, { method: "HEAD" });
        const ct = head.headers.get("content-type") || "";
        const cl = Number(head.headers.get("content-length") || "0");
        if (!head.ok) throw new Error(`HEAD ${INVITE_URL} failed`);
        if (!ct.startsWith("image/") && !ct.includes("pdf")) {
          throw new Error(`Unsupported content-type: ${ct}`);
        }
        // molti carrier MMS limitano ~600KB–1.5MB; stiamo larghi a 2.5MB
        if (cl && cl > 2.5 * 1024 * 1024) throw new Error(`File too large: ${cl} bytes`);
      } catch (e) {
        return res.status(400).json({ error: `Media check failed: ${e.message}` });
      }
  
      const body = `Hello ${name || "there"}! You're invited.${message ? ` ${message}` : ""}`;
  
      const payload = {
        messages: [
          {
            source: "api",
            to: phone,
            body,
            subject: "Invitation",             // aggiunto subject per MMS
            media: [INVITE_URL],
            ...(CLICKSEND_FROM_US ? { from: CLICKSEND_FROM_US } : {}), // usa SOLO se hai un numero US dedicato
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
      if (!r.ok) return res.status(r.status).json({ error: data });
      return res.status(200).json({ ok: true, data });
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }
  