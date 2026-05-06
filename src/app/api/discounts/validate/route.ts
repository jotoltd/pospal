import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function POST(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { code, orderTotal } = await req.json();

  const { data: discount } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("venue_id", venueId)
    .eq("code", code.toUpperCase())
    .eq("active", true)
    .single();

  if (!discount) return NextResponse.json({ valid: false, error: "Invalid code" });

  const now = new Date();
  if (now < new Date(discount.valid_from)) return NextResponse.json({ valid: false, error: "Code not yet valid" });
  if (discount.valid_until && now > new Date(discount.valid_until)) return NextResponse.json({ valid: false, error: "Code expired" });
  if (discount.max_uses && discount.uses_count >= discount.max_uses) return NextResponse.json({ valid: false, error: "Code usage limit reached" });
  if (orderTotal < (discount.min_order_value ?? 0)) return NextResponse.json({ valid: false, error: `Minimum order value £${discount.min_order_value} required` });

  if (discount.is_happy_hour && discount.happy_hour_start && discount.happy_hour_end) {
    const currentTime = now.toTimeString().slice(0, 5);
    if (currentTime < discount.happy_hour_start || currentTime > discount.happy_hour_end) {
      return NextResponse.json({ valid: false, error: `Only valid during happy hour (${discount.happy_hour_start}-${discount.happy_hour_end})` });
    }
  }

  const discountAmount = discount.type === "percentage"
    ? (orderTotal * discount.value) / 100
    : discount.value;

  return NextResponse.json({ valid: true, discountAmount, type: discount.type, value: discount.value, code: code.toUpperCase() });
}
