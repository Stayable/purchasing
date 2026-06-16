import { useState } from "react";
import { login } from "../api.js";

export default function LoginScreen({ onAuthed }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await login(email, pw);
      onAuthed();
    } catch {
      setErr("Invalid email or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="login-brand-mark">S8</div>
        <div className="login-brand-text">
          <div className="login-brand-name">Stayable</div>
          <div className="login-brand-sub">Procurement Review</div>
        </div>
      </div>
      <form className="login-card" onSubmit={submit}>
        <h1 className="login-title">Sign in</h1>
        <p className="login-lede">Access the procurement review portal</p>
        <label className="field-label">Email</label>
        <input
          type="email"
          className="field-input"
          placeholder="you@rise8companies.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
        />
        <label className="field-label">Password</label>
        <input
          type="password"
          className="field-input"
          placeholder="Password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          required
        />
        {err && <p className="err">{err}</p>}
        <button className="btn-primary login-submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
