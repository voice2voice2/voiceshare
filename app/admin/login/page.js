"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError(loginError.message); setBusy(false); return;
    }
    const check = await fetch("/api/admin-check");
    const result = await check.json();
    if (!check.ok || !result.isAdmin) {
      await supabase.auth.signOut();
      setError("This account is not registered as a FileDrop administrator.");
      setBusy(false); return;
    }
    router.push("/admin");
    router.refresh();
  }

  return <main className="page"><div className="container">
    <header className="topbar"><a className="brand" href="/">File<span>Drop</span></a><a className="navlink" href="/">Back to upload</a></header>
    <section className="panel" style={{maxWidth:440,margin:"70px auto"}}>
      <div className="eyebrow">Private area</div><h1 style={{fontSize:32}}>Admin login</h1>
      <p className="sub" style={{margin:"0 0 20px"}}>Sign in with your authorized administrator account.</p>
      <form onSubmit={submit}>
        <label className="field"><span>Email</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username"/></label>
        <label className="field"><span>Password</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></label>
        <button className="btn" disabled={busy} style={{width:"100%"}}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      {error && <div className="notice error">{error}</div>}
    </section>
  </div></main>;
}
