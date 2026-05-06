import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "orders";
  const startDate = searchParams.get("start") || new Date().toISOString().split("T")[0];
  const endDate = searchParams.get("end") || new Date().toISOString().split("T")[0];

  let csv = "";
  let filename = "";

  if (type === "orders") {
    filename = `orders_${startDate}_to_${endDate}.csv`;
    const { data: orders } = await supabase
      .from("orders").select("*, staff:staff_id(name)")
      .eq("venue_id", venueId)
      .gte("created_at", `${startDate}T00:00:00`).lte("created_at", `${endDate}T23:59:59`)
      .order("created_at", { ascending: false });

    csv = "Order #,Date,Customer,Phone,Type,Table,Status,Subtotal,Tax,Discount,Total,Payment,Staff,Notes\n";
    for (const o of orders ?? []) {
      const staffName = (o.staff as { name?: string } | null)?.name ?? "";
      csv += `${escapeCSV(o.order_number)},${escapeCSV(o.created_at)},${escapeCSV(o.customer_name)},${escapeCSV(o.customer_phone)},${escapeCSV(o.order_type)},${escapeCSV(o.table_number)},${escapeCSV(o.status)},${escapeCSV(o.subtotal)},${escapeCSV(o.tax)},${escapeCSV(o.discount)},${escapeCSV(o.total)},${escapeCSV(o.payment_method)},${escapeCSV(staffName)},${escapeCSV(o.notes)}\n`;
    }
  } else if (type === "items") {
    filename = `items_${startDate}_to_${endDate}.csv`;
    const { data: orders } = await supabase.from("orders").select("id").eq("venue_id", venueId)
      .neq("status", "cancelled").gte("created_at", `${startDate}T00:00:00`).lte("created_at", `${endDate}T23:59:59`);
    const orderIds = (orders ?? []).map((o) => o.id);
    const itemMap: Record<string, { qty: number; revenue: number }> = {};
    if (orderIds.length > 0) {
      const { data: items } = await supabase.from("order_items").select("name, quantity, price").in("order_id", orderIds);
      for (const i of items ?? []) {
        if (!itemMap[i.name]) itemMap[i.name] = { qty: 0, revenue: 0 };
        itemMap[i.name].qty += i.quantity ?? 1;
        itemMap[i.name].revenue += (i.price ?? 0) * (i.quantity ?? 1);
      }
    }
    csv = "Item Name,Quantity Sold,Revenue\n";
    for (const [name, v] of Object.entries(itemMap).sort((a, b) => b[1].qty - a[1].qty)) {
      csv += `${escapeCSV(name)},${escapeCSV(v.qty)},${escapeCSV(v.revenue.toFixed(2))}\n`;
    }
  } else if (type === "customers") {
    filename = `customers.csv`;
    const { data: customers } = await supabase.from("customers").select("*").eq("venue_id", venueId).order("total_spent", { ascending: false });
    csv = "Name,Phone,Email,Address,VIP,Total Orders,Total Spent,Allergies,Notes\n";
    for (const c of customers ?? []) {
      csv += `${escapeCSV(c.name)},${escapeCSV(c.phone)},${escapeCSV(c.email)},${escapeCSV(c.address)},${c.is_vip ? "Yes" : "No"},${escapeCSV(c.total_orders)},${escapeCSV(c.total_spent)},${escapeCSV(c.allergies)},${escapeCSV(c.notes)}\n`;
    }
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
