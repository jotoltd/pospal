import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";
import { takeawayTemplates } from "@/lib/templates";

export async function GET() {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { data } = await supabase.from("settings").select("value").eq("venue_id", venueId).eq("key", "setup_complete").single();
  return NextResponse.json({ setup_complete: data?.value === "1" });
}

export async function POST(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const body = await req.json();
  const { template_id, shop_name, shop_address, shop_phone, tax_rate, currency_symbol } = body;

  // Save shop settings
  const upserts: { venue_id: string; key: string; value: string }[] = [];
  if (shop_name) upserts.push({ venue_id: venueId, key: "shop_name", value: shop_name });
  if (shop_address) upserts.push({ venue_id: venueId, key: "shop_address", value: shop_address });
  if (shop_phone) upserts.push({ venue_id: venueId, key: "shop_phone", value: shop_phone });
  if (tax_rate !== undefined) upserts.push({ venue_id: venueId, key: "tax_rate", value: String(tax_rate) });
  if (currency_symbol) upserts.push({ venue_id: venueId, key: "currency_symbol", value: currency_symbol });
  upserts.push({ venue_id: venueId, key: "setup_complete", value: "1" });
  await supabase.from("settings").upsert(upserts, { onConflict: "venue_id,key" });

  // Load template if requested
  if (template_id && template_id !== "blank") {
    await supabase.from("menu_items").delete().eq("venue_id", venueId);
    await supabase.from("categories").delete().eq("venue_id", venueId);

    const template = takeawayTemplates.find((t) => t.id === template_id);
    if (template) {
      for (let ci = 0; ci < template.categories.length; ci++) {
        const cat = template.categories[ci];
        const { data: catRow } = await supabase.from("categories").insert({ venue_id: venueId, name: cat.name, sort_order: ci }).select().single();
        if (!catRow) continue;
        const itemInserts = cat.items.map((item, ii) => ({
          venue_id: venueId, category_id: catRow.id,
          name: item.name, price: item.price,
          description: item.description || "", available: true, sort_order: ii,
        }));
        await supabase.from("menu_items").insert(itemInserts);
      }
    }
  }

  return NextResponse.json({ success: true });
}
