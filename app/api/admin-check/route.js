import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";

export async function GET() {
  const { user, isAdmin } = await getAdminUser();
  if (!user) return NextResponse.json({ isAdmin: false }, { status: 401 });
  return NextResponse.json({ isAdmin });
}
