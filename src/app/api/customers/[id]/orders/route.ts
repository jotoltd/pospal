import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { id } = await params;

  // Get customer's phone
  const { data: customer } = await supabase.from("customers").select("phone").eq("id", id).eq("venue_id", venueId).single();
  if (!customer) return NextResponse.json([]);

  const { data: orders } = await supabase.from("orders").select("*").eq("venue_id", venueId).eq("customer_phone", customer.phone).order("created_at", { ascending: false });
  if (!orders?.length) return NextResponse.json([]);

  const orderIds = orders.map((o) => o.id);
  const { data: allItems } = await supabase.from("order_items").select("*").in("order_id", orderIds);

  return NextResponse.json(orders.map((o) => ({ ...o, items: (allItems ?? []).filter((i) => i.order_id === o.id) })));
}
