import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request) {
  const { user, isAdmin } = await getAdminUser();
  if (!user || !isAdmin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Missing file ID." }, { status: 400 });
    const admin = createAdminClient();
    const { data: item, error: lookupError } = await admin.from("uploads")
      .select("file_path,file_name").eq("id", id).single();
    if (lookupError || !item) return NextResponse.json({ error: "File not found." }, { status: 404 });

    const { data, error } = await admin.storage.from("uploads").createSignedUrl(item.file_path, 60, {
      download: item.file_name
    });
    if (error) throw error;
    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    console.error("download error", error);
    return NextResponse.json({ error: "Could not create a secure download link." }, { status: 500 });
  }
}
