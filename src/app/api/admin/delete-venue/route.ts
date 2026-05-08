import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SUPERADMIN_EMAIL = "hello@pospal.co.uk";

export async function POST(req: Request) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== SUPERADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { venue_id } = await req.json();
  if (!venue_id) {
    return NextResponse.json({ error: "venue_id required" }, { status: 400 });
  }

  // Delete venue (cascades to all related data due to FK constraints)
  const { error } = await supabase
    .from("venues")
    .delete()
    .eq("id", venue_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
