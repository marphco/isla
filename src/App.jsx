import { useState } from "react";

export default function App() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [onePhone, setOnePhone] = useState("");
  const [bulk, setBulk] = useState("");
  const [status, setStatus] = useState("");

  async function sendSingle(e){
    e.preventDefault();
    setStatus("Sending MMS…");
    const r = await fetch("/api/send-mms", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ phone: onePhone.trim(), name, message })
    });
    const j = await r.json().catch(()=>({}));
    setStatus(r.ok ? "MMS sent ✅" : `Error: ${JSON.stringify(j)}`);
  }

  async function sendBatch(e){
    e.preventDefault();
    setStatus("Sending batch…");
    const phones = bulk.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const r = await fetch("/api/send-mms-batch", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ phones, name, message })
    });
    const j = await r.json().catch(()=>({}));
    setStatus(r.ok ? `Batch done: ${j.count} numbers` : `Error: ${JSON.stringify(j)}`);
  }

  return (
    <main style={{ maxWidth: 680, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>🌴 Isla — MMS (US only)</h1>
      <p>Invite media: {import.meta.env.VITE_INVITE_URL || "(set VITE_INVITE_URL)"}</p>

      <section style={{display:"grid", gap:12, marginBottom:24}}>
        <label>Default name <input value={name} onChange={e=>setName(e.target.value)} placeholder="Guest" /></label>
        <label>Message (optional) <input value={message} onChange={e=>setMessage(e.target.value)} placeholder="See you there!" /></label>
      </section>

      <form onSubmit={sendSingle} style={{display:"grid", gap:12, marginBottom:24}}>
        <h3>Send one MMS</h3>
        <label>US phone (+1…) <input value={onePhone} onChange={e=>setOnePhone(e.target.value)} placeholder="+1..." required /></label>
        <button type="submit">Send MMS</button>
      </form>

      <form onSubmit={sendBatch} style={{display:"grid", gap:12}}>
        <h3>Send batch (one +1 number per line)</h3>
        <textarea rows={6} value={bulk} onChange={e=>setBulk(e.target.value)} placeholder="+12025550123\n+13015551234" />
        <button type="submit">Send MMS to list</button>
      </form>

      {status && <div style={{marginTop:16, padding:12, background:"#111", color:"#eaeaea", borderRadius:8}}>{status}</div>}
    </main>
  );
}
