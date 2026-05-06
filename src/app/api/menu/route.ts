import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function GET() {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { data } = await supabase.from("menu_items").select("*").eq("venue_id", venueId).order("sort_order").order("name");
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const body = await req.json();
  const { data } = await supabase.from("menu_items").insert({
    venue_id: venueId,
    category_id: body.category_id,
    name: body.name,
    price: body.price,
    description: body.description ?? "",
    available: body.available ?? true,
    track_stock: body.track_stock ?? false,
    stock_count: body.stock_count ?? -1,
    low_stock_threshold: body.low_stock_threshold ?? 10,
    modifiers: body.modifiers ?? [],
    sort_order: body.sort_order ?? 0,
  }).select().single();
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const body = await req.json();
  const { data } = await supabase.from("menu_items").update({
    category_id: body.category_id,
    name: body.name,
    price: body.price,
    description: body.description ?? "",
    available: body.available ?? true,
    track_stock: body.track_stock ?? false,
    stock_count: body.stock_count ?? -1,
    low_stock_threshold: body.low_stock_threshold ?? 10,
    modifiers: body.modifiers ?? [],
    sort_order: body.sort_order ?? 0,
  }).eq("id", body.id).eq("venue_id", venueId).select().single();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const id = new URL(req.url).searchParams.get("id");
  await supabase.from("menu_items").delete().eq("id", id!).eq("venue_id", venueId);
  return NextResponse.json({ success: true });
}
