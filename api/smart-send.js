// api/smart-send.js
export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();
  
    try {
      const { contacts = [], message = "", sendBothIfAvailable = false } = req.body || {};
      if (!Array.isArray(contacts) || contacts.length === 0) {
        return res.status(400).json({ error: "contacts[] required" });
      }
  
      // helper: call our existing endpoints
      const callApi = (path, payload) =>
        fetch(new URL(path, `https://${req.headers.host}`).toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then(async r => ({ ok: r.ok, json: await r.json().catch(()=>({})) }));
  
      const results = [];
      for (const c of contacts) {
        const name = c.name || "guest";
        const email = (c.email || "").trim();
        const phone = (c.phone || "").trim();
  
        // choose channel(s)
        const tasks = [];
        const canEmail = !!email;
        const canMms = phone.startsWith("+1");
  
        if (canEmail) tasks.push(callApi("/api/send-email", { name, email, message }));
        if (!canEmail && canMms) tasks.push(callApi("/api/send-mms", { name, phone, message }));
        if (sendBothIfAvailable && canEmail && canMms) tasks.push(callApi("/api/send-mms", { name, phone, message }));
  
        if (tasks.length === 0) {
          results.push({ name, email, phone, ok: false, reason: "no_valid_channel" });
          continue;
        }
  
        const settled = await Promise.allSettled(tasks);
        const ok = settled.some(s => s.status === "fulfilled" && s.value.ok);
        results.push({ name, email, phone, ok, details: settled.map(s => (s.value || s.reason)) });
        await new Promise(r => setTimeout(r, 200)); // soft rate-limit
      }
  
      const sent = results.filter(r => r.ok).length;
      return res.status(200).json({ ok: true, total: results.length, sent, results });
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }
  