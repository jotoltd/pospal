import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function GET() {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { data } = await supabase.from("discount_codes").select("*").eq("venue_id", venueId).order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const body = await req.json();
  const { data } = await supabase.from("discount_codes").insert({
    venue_id: venueId, code: body.code.toUpperCase(), type: body.type, value: body.value,
    min_order_value: body.min_order_value || 0, max_uses: body.max_uses || null,
    valid_from: body.valid_from || new Date().toISOString(), valid_until: body.valid_until || null,
    is_happy_hour: !!body.is_happy_hour, happy_hour_start: body.happy_hour_start || null, happy_hour_end: body.happy_hour_end || null,
  }).select().single();
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const body = await req.json();
  const { data } = await supabase.from("discount_codes").update({
    code: body.code.toUpperCase(), type: body.type, value: body.value,
    min_order_value: body.min_order_value || 0, max_uses: body.max_uses || null,
    valid_from: body.valid_from, valid_until: body.valid_until || null,
    is_happy_hour: !!body.is_happy_hour, happy_hour_start: body.happy_hour_start || null,
    happy_hour_end: body.happy_hour_end || null, active: !!body.active,
  }).eq("id", body.id).eq("venue_id", venueId).select().single();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const id = new URL(req.url).searchParams.get("id");
  await supabase.from("discount_codes").delete().eq("id", id!).eq("venue_id", venueId);
  return NextResponse.json({ success: true });
}
