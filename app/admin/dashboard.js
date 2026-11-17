"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboard({ email }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function load() {
    setLoading(true); setError("");
    const response = await fetch("/api/admin-files");
    const data = await response.json();
    if (!response.ok) setError(data.error || "Could not load files.");
    else setItems(data.files || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function download(id) {
    const response = await fetch("/api/download", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({id})
    });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Download failed."); return; }
    window.location.href = data.url;
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return <main className="page"><div className="container">
    <header className="topbar"><a className="brand" href="/">File<span>Drop</span></a><button className="smallbtn" onClick={logout}>Sign out</button></header>
    <div className="eyebrow">Administrator dashboard</div>
    <h1 style={{fontSize:36}}>Uploaded files</h1>
    <p className="sub" style={{margin:0}}>Signed in as {email}. Files remain private; downloads use temporary signed links.</p>
    <section className="panel" style={{marginTop:24}}>
      <div className="row" style={{justifyContent:"space-between"}}><strong>{items.length} file(s)</strong><button className="smallbtn" onClick={load}>Refresh</button></div>
      {loading ? <p className="muted">Loading files…</p> : error ? <div className="notice error">{error}</div> : items.length === 0 ? <p className="muted">No files uploaded yet.</p> :
      <div className="tablewrap"><table><thead><tr><th>File</th><th>Size</th><th>Uploaded</th><th></th></tr></thead><tbody>
        {items.map(item=><tr key={item.id}><td>{item.file_name}</td><td>{(item.file_size/1024/1024).toFixed(2)} MB</td><td>{new Date(item.created_at).toLocaleString()}</td><td><button className="smallbtn" onClick={()=>download(item.id)}>Download</button></td></tr>)}
      </tbody></table></div>}
    </section>
  </div></main>;
}
