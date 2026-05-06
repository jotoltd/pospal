import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function GET() {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { data } = await supabase.from("parked_orders").select("*").eq("venue_id", venueId).order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const body = await req.json();
  const { data } = await supabase.from("parked_orders").insert({
    venue_id: venueId,
    order_name: body.order_name || `Parked ${new Date().toLocaleTimeString()}`,
    customer_name: body.customer_name || "", customer_phone: body.customer_phone || "",
    order_type: body.order_type || "collection", table_number: body.table_number || "",
    delivery_address: body.delivery_address || "", subtotal: body.subtotal,
    tax: body.tax || 0, discount: body.discount || 0, delivery_fee: body.delivery_fee || 0,
    service_charge: body.service_charge || 0, total: body.total, notes: body.notes || "",
    items: body.items ?? [],
  }).select().single();
  return NextResponse.json({ id: data?.id, success: true });
}

export async function DELETE(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await supabase.from("parked_orders").delete().eq("id", id).eq("venue_id", venueId);
  return NextResponse.json({ success: true });
}
