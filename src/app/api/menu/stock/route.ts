import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function POST(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { item_id, adjustment } = await req.json();

  const { data: item } = await supabase
    .from("menu_items")
    .select("stock_count, track_stock")
    .eq("id", item_id)
    .eq("venue_id", venueId)
    .single();

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  if (!item.track_stock) return NextResponse.json({ error: "Stock tracking not enabled" }, { status: 400 });

  const newStock = Math.max(0, (item.stock_count ?? 0) + adjustment);
  const { data: updated } = await supabase
    .from("menu_items")
    .update({ stock_count: newStock })
    .eq("id", item_id)
    .eq("venue_id", venueId)
    .select()
    .single();

  return NextResponse.json({ item: updated, previous_stock: item.stock_count, new_stock: newStock });
}
