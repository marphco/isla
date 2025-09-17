import { useState } from "react";

export default function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sendBothIfAvailable, setSendBothIfAvailable] = useState(false);
  const [bulk, setBulk] = useState(""); // lines: Name,Email,Phone
  const [status, setStatus] = useState("");

  const inviteUrl = import.meta.env.VITE_INVITE_URL || "(set VITE_INVITE_URL)";

  async function smartSendOne(e) {
    e.preventDefault();
    setStatus("Sending…");
    const r = await fetch("/api/smart-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contacts: [{ name, email, phone }],
        message,
        sendBothIfAvailable
      }),
    });
    const j = await r.json().catch(() => ({}));
    setStatus(r.ok ? `Done: ${JSON.stringify(j)}` : `Error: ${JSON.stringify(j)}`);
  }

  async function smartSendBatch(e) {
    e.preventDefault();
    setStatus("Sending batch…");
    const contacts = bulk
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        // CSV-ish: Name,Email,Phone  (Email/Phone can be empty)
        const [n = "", em = "", ph = ""] = line.split(",").map(s => s.trim());
        return { name: n, email: em, phone: ph };
      });

    const r = await fetch("/api/smart-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacts, message, sendBothIfAvailable }),
    });
    const j = await r.json().catch(() => ({}));
    setStatus(r.ok ? `Batch done: ${j.sent} sent / ${j.total} total` : `Error: ${JSON.stringify(j)}`);
  }

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>🌴 Isla — Smart Send (Email + MMS)</h1>
      <p>Invite media: {inviteUrl}</p>

      <label style={{ display: "inline-flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <input type="checkbox" checked={sendBothIfAvailable} onChange={e=>setSendBothIfAvailable(e.target.checked)} />
        Send both if email and US phone are provided
      </label>

      <section style={{ display: "grid", gap: 12, marginBottom: 28 }}>
        <h3>Send to one recipient</h3>
        <label> Name <input value={name} onChange={e=>setName(e.target.value)} placeholder="Guest" /></label>
        <label> Email <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="guest@example.com" /></label>
        <label> US Phone (+1…) <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+1..." /></label>
        <label> Message (optional) <input value={message} onChange={e=>setMessage(e.target.value)} placeholder="See you there!" /></label>
        <button onClick={smartSendOne}>Send</button>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h3>Batch (paste one contact per line: Name,Email,Phone)</h3>
        <textarea rows={6} value={bulk} onChange={e=>setBulk(e.target.value)}
          placeholder={`Alice,alice@mail.com,\nBob,,+12025550123`} />
        <button onClick={smartSendBatch}>Send batch</button>
      </section>

      {status && (
        <div style={{ marginTop: 16, padding: 12, background: "#111", color: "#eee", borderRadius: 8 }}>
          {status}
        </div>
      )}
    </main>
  );
}
