import { useState } from "react";

export default function App() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    sendEmail: true,
    sendSms: false,
  });
  const [result, setResult] = useState(null);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    setResult("Invio in corso…");

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      message: form.message,
    };

    const tasks = [];
    if (form.sendEmail && form.email) {
      tasks.push(fetch("/api/send-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(r => r.json().catch(()=>({}))));
    }
    if (form.sendSms && form.phone) {
      tasks.push(fetch("/api/send-sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(r => r.json().catch(()=>({}))));
    }
    if (!tasks.length) return setResult("Seleziona almeno un canale e compila email/telefono.");

    const results = await Promise.all(tasks);
    setResult(JSON.stringify(results, null, 2));
  }

  return (
    <main style={{ maxWidth: 560, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>🌴 Isla</h1>
      <p>Questo invito sarà inviato a tutti:</p>
      <code style={{ display: "block", marginBottom: 12 }}>{import.meta.env.VITE_INVITE_URL || "Configura VITE_INVITE_URL"}</code>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>Nome destinatario <input name="name" value={form.name} onChange={onChange} required /></label>
        <label>Email destinatario <input type="email" name="email" value={form.email} onChange={onChange} /></label>
        <label>Telefono (es. +39…) <input name="phone" value={form.phone} onChange={onChange} /></label>
        <label>Messaggio (opz.) <textarea name="message" rows={4} value={form.message} onChange={onChange} /></label>

        <div style={{ display: "flex", gap: 16 }}>
          <label><input type="checkbox" name="sendEmail" checked={form.sendEmail} onChange={onChange} /> Invia Email</label>
          <label><input type="checkbox" name="sendSms" checked={form.sendSms} onChange={onChange} /> Invia SMS</label>
        </div>

        <button type="submit">Invia</button>
      </form>

      <pre style={{ marginTop: 16, background: "#f6f6f6", padding: 12, overflow: "auto" }}>{result || "Output…"}</pre>
    </main>
  );
}
