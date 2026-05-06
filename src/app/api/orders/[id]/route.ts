import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { id } = await params;
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).eq("venue_id", venueId).single();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);
  return NextResponse.json({ ...order, items: items ?? [] });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { id } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (body.status) {
    update.status = body.status;
    if (body.status === "completed") update.completed_at = new Date().toISOString();
  }
  if (Object.keys(update).length > 0) {
    await supabase.from("orders").update(update).eq("id", id).eq("venue_id", venueId);
  }

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).eq("venue_id", venueId).single();
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);
  return NextResponse.json({ ...order, items: items ?? [] });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { id } = await params;
  await supabase.from("orders").delete().eq("id", id).eq("venue_id", venueId);
  return NextResponse.json({ success: true });
}
