import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";

export async function GET() {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const { data } = await supabase.from("settings").select("key, value").eq("venue_id", venueId);
  const settings: Record<string, string> = {};
  for (const row of (data ?? [])) settings[row.key] = row.value;
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const { supabase, venueId, error } = await getVenueId();
  if (error) return error;
  const body = await req.json();
  const upserts = Object.entries(body).map(([key, value]) => ({ venue_id: venueId, key, value: String(value) }));
  await supabase.from("settings").upsert(upserts, { onConflict: "venue_id,key" });
  const { data } = await supabase.from("settings").select("key, value").eq("venue_id", venueId);
  const settings: Record<string, string> = {};
  for (const row of (data ?? [])) settings[row.key] = row.value;
  return NextResponse.json(settings);
}
