import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function POST(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { order_id, amount, reason } = await req.json();

  const { data: staffRow } = await supabase.from("settings").select("value").eq("venue_id", venueId).eq("key", "current_staff_id").single();
  const staffId = staffRow?.value || null;

  await supabase.from("refunds").insert({ venue_id: venueId, order_id, amount, reason: reason || "", staff_id: staffId || null });
  await supabase.from("orders").update({ refund_amount: amount, refund_reason: reason || "", status: "refunded" }).eq("id", order_id).eq("venue_id", venueId);

  const { data: order } = await supabase.from("orders").select("*").eq("id", order_id).eq("venue_id", venueId).single();
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order_id);
  return NextResponse.json({ ...order, items: items ?? [] });
}
