import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function GET(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staff_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const active = searchParams.get("active");

  let query = supabase.from("shifts").select("*").eq("venue_id", venueId);
  if (staffId) query = query.eq("staff_id", staffId);
  if (from) query = query.gte("clock_in", from);
  if (to) query = query.lte("clock_in", to);
  if (active === "1") query = query.is("clock_out", null);
  query = query.order("clock_in", { ascending: false });

  const { data } = await query;
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { pin, action, notes } = await req.json();

  const { data: staff } = await supabase.from("staff").select("id, name").eq("venue_id", venueId).eq("pin", pin).eq("active", true).single();
  if (!staff) return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });

  if (action === "in") {
    const { data: existing } = await supabase.from("shifts").select("*").eq("venue_id", venueId).eq("staff_id", staff.id).is("clock_out", null).limit(1).single();
    if (existing) return NextResponse.json({ error: "Already clocked in", shift: existing }, { status: 409 });
    const { data: shift } = await supabase.from("shifts").insert({ venue_id: venueId, staff_id: staff.id, staff_name: staff.name, clock_in: new Date().toISOString(), notes: notes || "" }).select().single();
    return NextResponse.json({ success: true, action: "clocked_in", shift });
  }

  if (action === "out") {
    const { data: existing } = await supabase.from("shifts").select("*").eq("venue_id", venueId).eq("staff_id", staff.id).is("clock_out", null).order("clock_in", { ascending: false }).limit(1).single();
    if (!existing) return NextResponse.json({ error: "Not currently clocked in" }, { status: 409 });
    const now = new Date();
    const duration = Math.round((now.getTime() - new Date(existing.clock_in).getTime()) / 60000);
    const { data: shift } = await supabase.from("shifts").update({ clock_out: now.toISOString(), duration_minutes: duration }).eq("id", existing.id).select().single();
    return NextResponse.json({ success: true, action: "clocked_out", shift, duration_minutes: duration });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function PUT(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { id, clock_in, clock_out, notes } = await req.json();
  if (!id) return NextResponse.json({ error: "Shift ID required" }, { status: 400 });

  let duration: number | null = null;
  if (clock_in && clock_out) {
    duration = Math.max(0, Math.round((new Date(clock_out).getTime() - new Date(clock_in).getTime()) / 60000));
  }

  const update: Record<string, unknown> = {};
  if (clock_in) update.clock_in = clock_in;
  if (clock_out !== undefined) update.clock_out = clock_out || null;
  if (duration !== null) update.duration_minutes = duration;
  if (notes !== undefined) update.notes = notes;

  const { data: shift } = await supabase.from("shifts").update(update).eq("id", id).eq("venue_id", venueId).select().single();
  return NextResponse.json({ success: true, shift });
}

export async function DELETE(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Shift ID required" }, { status: 400 });
  await supabase.from("shifts").delete().eq("id", id).eq("venue_id", venueId);
  return NextResponse.json({ success: true });
}
