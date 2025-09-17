const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { CLICKSEND_USERNAME, CLICKSEND_API_KEY, INVITE_URL, CLICKSEND_FROM_US } = process.env;
    const { phones, name, message } = req.body || {};
    if (!Array.isArray(phones) || phones.length === 0) return res.status(400).json({ error: "phones[] required" });

    const auth = Buffer.from(`${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}`).toString("base64");
    const results = [];
    for (const raw of phones) {
      const phone = String(raw).trim();
      if (!phone.startsWith("+1")) { results.push({ phone, ok:false, error:"not_us" }); continue; }

      const body = `Hello ${name || "there"}! You're invited.${message ? ` ${message}` : ""}`;
      const payload = {
        messages: [{ source:"api", to: phone, body, media:[INVITE_URL], ...(CLICKSEND_FROM_US ? { from: CLICKSEND_FROM_US } : {}) }],
      };

      const r = await fetch("https://rest.clicksend.com/v3/mms/send", {
        method: "POST",
        headers: { Authorization:`Basic ${auth}`, "Content-Type":"application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      results.push({ phone, ok: r.ok, data: r.ok ? data : undefined, error: r.ok ? undefined : data });
      await sleep(300); // piccola pausa per non saturare rate limit
    }
    return res.status(200).json({ ok:true, count: results.length, results });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
