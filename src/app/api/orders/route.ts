import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function GET(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");

  let query = supabase.from("orders").select("*, staff:staff_id(name)").eq("venue_id", venueId);
  if (status && status !== "all") query = query.eq("status", status);
  if (date) query = query.gte("created_at", `${date}T00:00:00`).lte("created_at", `${date}T23:59:59`);
  query = query.order("created_at", { ascending: false });

  const { data: orders } = await query;
  if (!orders) return NextResponse.json([]);

  // Attach items and flatten staff name
  const orderIds = orders.map((o) => o.id);
  const { data: allItems } = orderIds.length > 0
    ? await supabase.from("order_items").select("*").in("order_id", orderIds)
    : { data: [] };

  const result = orders.map((o) => ({
    ...o,
    staff_name: (o.staff as { name?: string } | null)?.name ?? null,
    staff: undefined,
    items: (allItems ?? []).filter((i) => i.order_id === o.id),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const body = await req.json();
  try {
    // Generate order number from settings counter
    const { data: counterRow } = await supabase.from("settings").select("value").eq("venue_id", venueId).eq("key", "order_counter").single();
    const newCounter = parseInt(counterRow?.value ?? "0") + 1;
    await supabase.from("settings").upsert([{ venue_id: venueId, key: "order_counter", value: String(newCounter) }], { onConflict: "venue_id,key" });
    const orderNumber = String(newCounter).padStart(4, "0");

    // Get current staff
    const { data: staffRow } = await supabase.from("settings").select("value").eq("venue_id", venueId).eq("key", "current_staff_id").single();
    const staffId = staffRow?.value || null;

    const { data: order, error: orderError } = await supabase.from("orders").insert({
      venue_id: venueId,
      order_number: orderNumber,
      customer_name: body.customer_name ?? "",
      customer_phone: body.customer_phone ?? "",
      order_type: body.order_type ?? "collection",
      table_number: body.table_number ?? "",
      delivery_address: body.delivery_address ?? "",
      status: "pending",
      subtotal: body.subtotal,
      tax: body.tax ?? 0,
      discount: body.discount ?? 0,
      discount_code: body.discount_code ?? "",
      delivery_fee: body.delivery_fee ?? 0,
      service_charge: body.service_charge ?? 0,
      tip: body.tip ?? 0,
      total: body.total,
      payment_method: body.payment_method ?? "cash",
      transaction_code: body.transaction_code ?? "",
      notes: body.notes ?? "",
      staff_id: staffId || null,
      split_cash: body.split_cash ?? 0,
      split_card: body.split_card ?? 0,
    }).select().single();

    if (orderError || !order) return NextResponse.json({ error: orderError?.message }, { status: 500 });

    // Increment discount code usage
    if (body.discount_code) {
      const { data: dc } = await supabase.from("discount_codes").select("uses_count").eq("venue_id", venueId).eq("code", body.discount_code).single();
      if (dc) await supabase.from("discount_codes").update({ uses_count: dc.uses_count + 1 }).eq("venue_id", venueId).eq("code", body.discount_code);
    }

    // Insert order items + decrement stock
    const itemInserts = body.items.map((item: Record<string, unknown>) => ({
      venue_id: venueId,
      order_id: order.id,
      menu_item_id: item.menu_item_id ?? null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes ?? "",
      modifiers: item.modifiers ?? [],
    }));
    const { data: items } = await supabase.from("order_items").insert(itemInserts).select();

    for (const item of body.items) {
      if (item.menu_item_id) {
        const { data: mi } = await supabase.from("menu_items").select("stock_count, track_stock").eq("id", item.menu_item_id).eq("venue_id", venueId).single();
        if (mi?.track_stock && (mi.stock_count ?? 0) > 0) {
          await supabase.from("menu_items").update({ stock_count: Math.max(0, (mi.stock_count ?? 0) - item.quantity) }).eq("id", item.menu_item_id).eq("venue_id", venueId);
        }
      }
    }

    return NextResponse.json({ ...order, items: items ?? [] }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
