import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SUPERADMIN_EMAIL = "hello@pospal.co.uk";

export async function GET() {
  const supabase = await createClient();
  
  // Check superadmin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== SUPERADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Get all venues with owner info
  const { data: venues } = await supabase
    .from("venues")
    .select("*, owner:owner_id(email)")
    .order("created_at", { ascending: false });

  // Get stats for each venue
  const venueStats = await Promise.all(
    (venues || []).map(async (venue) => {
      const { count: orderCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("venue_id", venue.id);
      
      const { count: customerCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("venue_id", venue.id);

      const { data: revenue } = await supabase
        .from("orders")
        .select("total")
        .eq("venue_id", venue.id)
        .neq("status", "cancelled");

      const totalRevenue = (revenue || []).reduce((sum, o) => sum + (o.total || 0), 0);

      return {
        ...venue,
        order_count: orderCount || 0,
        customer_count: customerCount || 0,
        total_revenue: totalRevenue,
        owner_email: (venue.owner as { email?: string })?.email || "Unknown",
      };
    })
  );

  return NextResponse.json({ venues: venueStats });
}
