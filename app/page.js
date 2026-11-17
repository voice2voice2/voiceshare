"use client";

import { useRef, useState } from "react";

const MAX_MB = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || 20);
const ALLOWED = new Set([
  "application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif",
  "text/plain", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
]);

function uploadWithProgress(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300
      ? resolve()
      : reject(new Error(`Upload failed (${xhr.status}). Check your Supabase bucket and signed URL settings.`));
    xhr.onerror = () => reject(new Error("Network error while uploading. Please try again."));
    xhr.send(file);
  });
}

export default function Home() {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function chooseFiles(list) {
    const selected = Array.from(list || []);
    const valid = [];
    const problems = [];
    for (const file of selected) {
      if (file.size > MAX_MB * 1024 * 1024) {
        problems.push(`${file.name}: larger than ${MAX_MB} MB`);
      } else if (!ALLOWED.has(file.type) && !/\.(pdf|jpe?g|png|webp|gif|txt|docx?|xlsx?|pptx?)$/i.test(file.name)) {
        problems.push(`${file.name}: file type not allowed`);
      } else valid.push(file);
    }
    setFiles(valid);
    setMessage(problems.join(" • "));
    setIsError(problems.length > 0);
    setProgress({});
  }

  async function handleUpload() {
    if (!files.length || busy) return;
    setBusy(true);
    setMessage("");
    setIsError(false);
    let completed = 0;
    try {
      for (const file of files) {
        const response = await fetch("/api/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size })
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not start upload.");

        const signedUrl = payload.signedUrl.startsWith("http")
          ? payload.signedUrl
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1${payload.signedUrl}`;

        await uploadWithProgress(signedUrl, file, (value) =>
          setProgress((old) => ({ ...old, [file.name]: value }))
        );

        const saved = await fetch("/api/upload-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: payload.path,
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            fileSize: file.size
          })
        });
        const savedData = await saved.json();
        if (!saved.ok) throw new Error(savedData.error || "File uploaded but could not save its record.");
        completed += 1;
      }
      setMessage(`${completed} file(s) uploaded successfully. Thank you!`);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
      setIsError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <div className="container">
        <header className="topbar">
          <div className="brand">File<span>Drop</span></div>
          <a className="navlink" href="/admin/login">Admin login ↗</a>
        </header>
        <section className="hero">
          <div className="eyebrow">Simple · Secure · Private</div>
          <h1>Send your files.<br/>We'll take it from here.</h1>
          <p className="sub">Upload documents, PDFs, and images securely. Your files are sent to a private storage area and are only available to the administrator.</p>
        </section>
        <section className="panel">
          <div className="dropzone">
            <div style={{fontSize:34}}>↥</div>
            <h2 style={{margin:"10px 0 5px"}}>Choose files to upload</h2>
            <p className="muted">PDF, images, Word, Excel, PowerPoint, and text files · Up to {MAX_MB} MB each</p>
            <input ref={inputRef} className="fileinput" type="file" multiple onChange={(e) => chooseFiles(e.target.files)} />
            <div className="muted">Select one or more files from your device.</div>
          </div>
          {files.length > 0 && <ul className="files">{files.map((file) => (
            <li key={`${file.name}-${file.lastModified}`}>
              <span>{file.name}<br/><span className="muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span></span>
              <span className="muted">{progress[file.name] ?? 0}%</span>
            </li>
          ))}</ul>}
          {busy && <div className="progress"><div style={{width:`${files.length ? Object.values(progress).reduce((a,b)=>a+b,0)/files.length : 0}%`}} /></div>}
          <button className="btn" disabled={!files.length || busy} onClick={handleUpload} style={{width:"100%"}}>
            {busy ? "Uploading…" : "Upload files"}
          </button>
          {message && <div className={`notice ${isError ? "error" : ""}`} role="status">{message}</div>}
        </section>
        <div className="footer">FileDrop · Your files are stored privately.</div>
      </div>
    </main>
  );
}
