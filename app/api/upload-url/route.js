import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const allowed = new Set([
  "application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif",
  "text/plain", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
]);
const extAllowed = /\.(pdf|jpe?g|png|webp|gif|txt|docx?|xlsx?|pptx?)$/i;

export async function POST(request) {
  try {
    const body = await request.json();
    const fileName = String(body.fileName || "").replace(/[\\\\/]/g, "_").slice(0, 180);
    const fileType = String(body.fileType || "application/octet-stream");
    const fileSize = Number(body.fileSize);
    const maxBytes = (Number(process.env.MAX_FILE_SIZE_MB) || 20) * 1024 * 1024;

    if (!fileName || !Number.isFinite(fileSize) || fileSize <= 0)
      return NextResponse.json({ error: "Invalid file details." }, { status: 400 });
    if (fileSize > maxBytes)
      return NextResponse.json({ error: `File is larger than the ${Math.round(maxBytes/1024/1024)} MB limit.` }, { status: 413 });
    if (!allowed.has(fileType) && !extAllowed.test(fileName))
      return NextResponse.json({ error: "This file type is not allowed." }, { status: 415 });

    const safeName = fileName.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${safeName}`;
    const admin = createAdminClient();
    const { data, error } = await admin.storage.from("uploads").createSignedUploadUrl(path);
    if (error) throw error;
    return NextResponse.json({ path, signedUrl: data.signedUrl, token: data.token });
  } catch (error) {
    console.error("upload-url error", error);
    return NextResponse.json({ error: "Could not prepare upload. Check server configuration." }, { status: 500 });
  }
}
