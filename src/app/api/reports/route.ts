import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function GET(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "daily";
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  let startDate: string, endDate: string, groupBy: string;
  if (period === "daily") {
    startDate = endDate = date; groupBy = "hour";
  } else if (period === "weekly") {
    const d = new Date(date);
    const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1);
    const monday = new Date(new Date(date).setDate(diff));
    const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
    startDate = monday.toISOString().split("T")[0]; endDate = sunday.toISOString().split("T")[0]; groupBy = "day";
  } else {
    const [year, month] = date.split("-");
    startDate = `${year}-${month}-01`;
    endDate = `${year}-${month}-${new Date(parseInt(year), parseInt(month), 0).getDate()}`;
    groupBy = "day";
  }

  const { data: orders } = await supabase
    .from("orders").select("id, total, created_at, order_type, payment_method")
    .eq("venue_id", venueId).neq("status", "cancelled")
    .gte("created_at", `${startDate}T00:00:00`).lte("created_at", `${endDate}T23:59:59`)
    .order("created_at");

  const o = orders ?? [];
  const totalSales = o.reduce((s, r) => s + (r.total ?? 0), 0);
  const totalOrders = o.length;

  const byType: Record<string, { count: number; sales: number }> = {};
  const byPayment: Record<string, { count: number; sales: number }> = {};
  const breakdown: Record<string, { orders: number; sales: number }> = {};

  for (const order of o) {
    const t = order.order_type ?? "collection";
    if (!byType[t]) byType[t] = { count: 0, sales: 0 };
    byType[t].count++; byType[t].sales += order.total ?? 0;

    const pm = order.payment_method ?? "cash";
    if (!byPayment[pm]) byPayment[pm] = { count: 0, sales: 0 };
    byPayment[pm].count++; byPayment[pm].sales += order.total ?? 0;

    const key = groupBy === "hour"
      ? new Date(order.created_at!).getHours().toString().padStart(2, "0") + ":00"
      : new Date(order.created_at!).toISOString().split("T")[0];
    if (!breakdown[key]) breakdown[key] = { orders: 0, sales: 0 };
    breakdown[key].orders++; breakdown[key].sales += order.total ?? 0;
  }

  // Top items
  const orderIds = o.map((r) => r.id);
  let topItems: { name: string; total_quantity: number; total_revenue: number }[] = [];
  if (orderIds.length > 0) {
    const { data: items } = await supabase.from("order_items").select("name, quantity, price").in("order_id", orderIds);
    const itemMap: Record<string, { total_quantity: number; total_revenue: number }> = {};
    for (const i of items ?? []) {
      if (!itemMap[i.name]) itemMap[i.name] = { total_quantity: 0, total_revenue: 0 };
      itemMap[i.name].total_quantity += i.quantity ?? 1;
      itemMap[i.name].total_revenue += (i.price ?? 0) * (i.quantity ?? 1);
    }
    topItems = Object.entries(itemMap).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 10);
  }

  return NextResponse.json({ period, startDate, endDate, summary: { totalSales, totalOrders, avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0 }, byType, topItems, breakdown, byPayment });
}
