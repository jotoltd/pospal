import { NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function GET(req: Request) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const start = `${date}T00:00:00`;
  const end = `${date}T23:59:59`;

  // Fetch all orders for the day (not cancelled)
  const { data: orders } = await supabase
    .from("orders")
    .select("id, total, discount, tax, delivery_fee, refund_amount, tip, split_cash, split_card, payment_method, order_type, created_at")
    .eq("venue_id", venueId)
    .neq("status", "cancelled")
    .gte("created_at", start)
    .lte("created_at", end);

  const o = orders ?? [];

  // Aggregate totals
  const gross_sales = o.reduce((s, r) => s + (r.total ?? 0), 0);
  const total_discounts = o.reduce((s, r) => s + (r.discount ?? 0), 0);
  const total_tax = o.reduce((s, r) => s + (r.tax ?? 0), 0);
  const total_delivery = o.reduce((s, r) => s + (r.delivery_fee ?? 0), 0);
  const total_refunds = o.reduce((s, r) => s + (r.refund_amount ?? 0), 0);
  const total_tips = o.reduce((s, r) => s + (r.tip ?? 0), 0);

  // By payment
  const paymentMap: Record<string, { count: number; total: number }> = {};
  for (const r of o) {
    const pm = r.payment_method ?? "cash";
    if (!paymentMap[pm]) paymentMap[pm] = { count: 0, total: 0 };
    paymentMap[pm].count++;
    paymentMap[pm].total += r.total ?? 0;
  }
  const by_payment = Object.entries(paymentMap).map(([payment_method, v]) => ({ payment_method, ...v }));

  // By type
  const typeMap: Record<string, { count: number; total: number }> = {};
  for (const r of o) {
    const t = r.order_type ?? "collection";
    if (!typeMap[t]) typeMap[t] = { count: 0, total: 0 };
    typeMap[t].count++;
    typeMap[t].total += r.total ?? 0;
  }
  const by_type = Object.entries(typeMap).map(([order_type, v]) => ({ order_type, ...v }));

  // Hourly
  const hourMap: Record<string, { count: number; total: number }> = {};
  for (const r of o) {
    const h = new Date(r.created_at!).toISOString().slice(11, 13);
    if (!hourMap[h]) hourMap[h] = { count: 0, total: 0 };
    hourMap[h].count++;
    hourMap[h].total += r.total ?? 0;
  }
  const hourly = Object.entries(hourMap).sort(([a], [b]) => a.localeCompare(b)).map(([hour, v]) => ({ hour, ...v }));

  // Cash in drawer
  const cash_in_drawer = o.reduce((s, r) => {
    if (r.payment_method === "cash") return s + (r.total ?? 0);
    if (r.payment_method === "split") return s + (r.split_cash ?? 0);
    return s;
  }, 0) - total_refunds;

  // Split breakdown
  const splitOrders = o.filter((r) => r.payment_method === "split");
  const split_breakdown = {
    count: splitOrders.length,
    cash: splitOrders.reduce((s, r) => s + (r.split_cash ?? 0), 0),
    card: splitOrders.reduce((s, r) => s + (r.split_card ?? 0), 0),
  };

  // Top items — fetch order_items for these order IDs
  const orderIds = o.map((r) => r.id);
  let top_items: { name: string; qty: number; revenue: number }[] = [];
  if (orderIds.length > 0) {
    const { data: items } = await supabase.from("order_items").select("name, quantity, price").in("order_id", orderIds);
    const itemMap: Record<string, { qty: number; revenue: number }> = {};
    for (const i of items ?? []) {
      if (!itemMap[i.name]) itemMap[i.name] = { qty: 0, revenue: 0 };
      itemMap[i.name].qty += i.quantity ?? 1;
      itemMap[i.name].revenue += (i.price ?? 0) * (i.quantity ?? 1);
    }
    top_items = Object.entries(itemMap).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty).slice(0, 10);
  }

  return NextResponse.json({
    date,
    totals: { orders: o.length, gross_sales, discounts: total_discounts, tax: total_tax, delivery_fees: total_delivery, refunds: total_refunds, net_sales: gross_sales - total_refunds, tips: total_tips },
    cash_in_drawer,
    split_breakdown,
    by_payment,
    by_type,
    hourly,
    top_items,
  });
}
