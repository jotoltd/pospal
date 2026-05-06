import { NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function GET() {
  try {
    const { supabase, venueId, error } = await getVenueId();
    if (error) return error;

    const today = new Date().toISOString().split("T")[0];
    const start = `${today}T00:00:00`;
    const end = `${today}T23:59:59`;

    // Today's orders
    const { data: todayOrders } = await supabase
      .from("orders").select("id, total, status, created_at")
      .eq("venue_id", venueId).gte("created_at", start).lte("created_at", end);
    const to = todayOrders ?? [];
    const todaySales = to.reduce((s, r) => s + (r.total ?? 0), 0);
    const todayOrdersCount = to.length;

    // Active orders
    const { data: activeData } = await supabase.from("orders").select("id").eq("venue_id", venueId).in("status", ["pending", "preparing"]);
    const activeOrders = activeData?.length ?? 0;

    // Low stock
    const { data: lowStockData } = await supabase.from("menu_items").select("id").eq("venue_id", venueId).eq("track_stock", true).lte("stock_count", 10);
    const lowStockItems = lowStockData?.length ?? 0;

    // Recent orders (last 8)
    const { data: recentOrders } = await supabase
      .from("orders").select("id, order_number, customer_name, order_type, status, total, payment_method, created_at")
      .eq("venue_id", venueId).order("created_at", { ascending: false }).limit(8);

    // Popular items today
    const orderIds = to.map((r) => r.id);
    let popularItems: { name: string; count: number }[] = [];
    if (orderIds.length > 0) {
      const { data: itemRows } = await supabase.from("order_items").select("name, quantity").in("order_id", orderIds);
      const itemMap: Record<string, number> = {};
      for (const i of itemRows ?? []) { itemMap[i.name] = (itemMap[i.name] ?? 0) + (i.quantity ?? 1); }
      popularItems = Object.entries(itemMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    }

    // Hourly sales
    const hourMap: Record<string, number> = {};
    for (const r of to) {
      const h = new Date(r.created_at!).toISOString().slice(11, 13);
      hourMap[h] = (hourMap[h] ?? 0) + (r.total ?? 0);
    }
    const hourlySales = Array.from({ length: 12 }, (_, i) => {
      const h = (i * 2).toString().padStart(2, "0");
      return { hour: `${h}:00`, amount: (hourMap[h] ?? 0) + (hourMap[(i * 2 + 1).toString().padStart(2, "0")] ?? 0) };
    });

    return NextResponse.json({
      todaySales, todayOrders: todayOrdersCount,
      avgOrderValue: todayOrdersCount > 0 ? todaySales / todayOrdersCount : 0,
      activeOrders, pendingOrders: activeOrders, lowStockItems,
      popularItems, hourlySales, recentOrders: recentOrders ?? [],
    });
  } catch {
    return NextResponse.json({ todaySales: 0, todayOrders: 0, avgOrderValue: 0, activeOrders: 0, pendingOrders: 0, lowStockItems: 0, popularItems: [], hourlySales: [], recentOrders: [] });
  }
}
