import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, isAdmin } = await getAdminUser();
  if (!user || !isAdmin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("uploads")
    .select("id,file_name,file_type,file_size,created_at")
    .order("created_at", { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: "Could not read uploaded files." }, { status: 500 });
  return NextResponse.json({ files: data || [] });
}
