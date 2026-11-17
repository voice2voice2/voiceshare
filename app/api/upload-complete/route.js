import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { path, fileName, fileType, fileSize } = await request.json();
    if (!path || !fileName || !Number.isFinite(Number(fileSize)))
      return NextResponse.json({ error: "Missing upload details." }, { status: 400 });

    const admin = createAdminClient();
    const { data: object, error: objectError } = await admin.storage.from("uploads").list(path.split("/").slice(0,-1).join("/"), {
      search: path.split("/").pop(), limit: 10
    });
    if (objectError) throw objectError;
    if (!object?.some((entry) => entry.name === path.split("/").pop()))
      return NextResponse.json({ error: "Uploaded object was not found in private storage." }, { status: 400 });

    const { data, error } = await admin.from("uploads").insert({
      file_name: String(fileName).slice(0,180),
      file_path: path,
      file_type: String(fileType || "application/octet-stream").slice(0,120),
      file_size: Number(fileSize)
    }).select("id").single();
    if (error) throw error;

    if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
      const from = process.env.FROM_EMAIL || "FileDrop <onboarding@resend.dev>";
      const emailText = `A new file was uploaded to FileDrop.\\n\\nFile: ${fileName}\\nSize: ${(Number(fileSize)/1024/1024).toFixed(2)} MB\\nUploaded: ${new Date().toISOString()}\\n\\nSign in to your FileDrop admin dashboard to download it.`;
      const mailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [process.env.NOTIFY_EMAIL], subject: "New FileDrop upload", text: emailText })
      });
      if (!mailResponse.ok) console.error("Resend notification failed:", await mailResponse.text());
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("upload-complete error", error);
    return NextResponse.json({ error: "The file may have uploaded, but saving its record failed. Contact the administrator." }, { status: 500 });
  }
}
