import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SUPERADMIN_EMAIL = "hello@pospal.co.uk";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== SUPERADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Global stats
  const { count: venueCount } = await supabase
    .from("venues")
    .select("*", { count: "exact", head: true });

  const { count: userCount } = await supabase
    .from("venues")
    .select("owner_id", { count: "exact", head: true });

  const { count: orderCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  const { count: customerCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  // Revenue stats
  const { data: orders } = await supabase
    .from("orders")
    .select("total, status, created_at")
    .neq("status", "cancelled");

  const totalRevenue = (orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
  
  // Today's revenue
  const today = new Date().toISOString().split("T")[0];
  const todayRevenue = (orders || [])
    .filter(o => o.created_at?.startsWith(today))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return NextResponse.json({
    stats: {
      venues: venueCount || 0,
      users: userCount || 0,
      orders: orderCount || 0,
      customers: customerCount || 0,
      total_revenue: totalRevenue,
      today_revenue: todayRevenue,
    },
  });
}
