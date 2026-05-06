import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Gets the authenticated Supabase client + venue_id for the current user.
 * Returns a NextResponse error if unauthenticated or no venue found.
 */
export async function getVenueId(): Promise<
  | { supabase: Awaited<ReturnType<typeof createClient>>; venueId: string; error: null }
  | { supabase: null; venueId: null; error: NextResponse }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase: null,
      venueId: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!venue) {
    return {
      supabase: null,
      venueId: null,
      error: NextResponse.json({ error: "No venue found" }, { status: 404 }),
    };
  }

  return { supabase, venueId: venue.id, error: null };
}
