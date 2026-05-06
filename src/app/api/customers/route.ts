import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function GET(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const phone = new URL(req.url).searchParams.get("phone");

  if (phone) {
    const { data } = await supabase.from("customers").select("*").eq("venue_id", venueId).eq("phone", phone).single();
    return NextResponse.json(data ?? null);
  }

  const { data } = await supabase.from("customers").select("*").eq("venue_id", venueId).order("total_spent", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const body = await req.json();
  const { data } = await supabase.from("customers").insert({
    venue_id: venueId, name: body.name, phone: body.phone,
    email: body.email || "", address: body.address || "",
    is_vip: !!body.is_vip, allergies: body.allergies || "", notes: body.notes || "",
  }).select().single();
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const body = await req.json();
  const { data } = await supabase.from("customers").update({
    name: body.name, phone: body.phone, email: body.email || "",
    address: body.address || "", is_vip: !!body.is_vip,
    allergies: body.allergies || "", notes: body.notes || "",
  }).eq("id", body.id).eq("venue_id", venueId).select().single();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const id = new URL(req.url).searchParams.get("id");
  await supabase.from("customers").delete().eq("id", id!).eq("venue_id", venueId);
  return NextResponse.json({ success: true });
}
