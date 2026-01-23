import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createApiClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Logged out successfully" });
}
