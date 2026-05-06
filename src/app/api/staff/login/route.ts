import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function POST(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { pin } = await req.json();

  const { data: staff } = await supabase
    .from("staff")
    .select("id, name, role, is_manager")
    .eq("venue_id", venueId)
    .eq("pin", pin)
    .eq("active", true)
    .single();

  if (!staff) return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });

  await supabase.from("settings").upsert([
    { venue_id: venueId, key: "current_staff_id", value: staff.id },
    { venue_id: venueId, key: "current_staff_name", value: staff.name },
  ], { onConflict: "venue_id,key" });

  return NextResponse.json({ staff: { id: staff.id, name: staff.name, role: staff.role, is_manager: staff.is_manager } });
}

export async function DELETE() {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  await supabase.from("settings").upsert([
    { venue_id: venueId, key: "current_staff_id", value: "" },
    { venue_id: venueId, key: "current_staff_name", value: "" },
  ], { onConflict: "venue_id,key" });
  return NextResponse.json({ success: true });
}
