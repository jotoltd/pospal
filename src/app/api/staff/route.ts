import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function GET() {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { data } = await supabase.from("staff").select("*").eq("venue_id", venueId).eq("active", true).order("name");
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const body = await req.json();
  const { data } = await supabase.from("staff").insert({
    venue_id: venueId, name: body.name, pin: body.pin,
    role: body.role || "staff", is_manager: !!body.is_manager,
    hourly_rate: body.hourly_rate || 0, active: true,
  }).select().single();
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const body = await req.json();
  const { data } = await supabase.from("staff").update({
    name: body.name, pin: body.pin, role: body.role,
    is_manager: !!body.is_manager, hourly_rate: body.hourly_rate ?? 0,
  }).eq("id", body.id).eq("venue_id", venueId).select().single();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const id = new URL(req.url).searchParams.get("id");
  await supabase.from("staff").update({ active: false }).eq("id", id!).eq("venue_id", venueId);
  return NextResponse.json({ success: true });
}
