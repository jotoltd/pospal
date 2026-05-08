"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Venue {
  id: string;
  name: string;
  plan: string;
}

interface VenueContextValue {
  venue: Venue | null;
  loading: boolean;
  refresh: () => void;
}

const VenueContext = createContext<VenueContextValue>({
  venue: null,
  loading: true,
  refresh: () => {},
});

export function VenueProvider({ children }: { children: React.ReactNode }) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVenue = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Check for admin impersonation
    const impersonatingId = typeof window !== "undefined" 
      ? localStorage.getItem("admin_impersonating") 
      : null;

    if (impersonatingId && user.email === "hello@pospal.co.uk") {
      const { data } = await supabase
        .from("venues")
        .select("id, name, plan")
        .eq("id", impersonatingId)
        .single();
      setVenue(data ?? null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("venues")
      .select("id, name, plan")
      .eq("owner_id", user.id)
      .single();

    setVenue(data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVenue();
  }, [fetchVenue]);

  return (
    <VenueContext.Provider value={{ venue, loading, refresh: fetchVenue }}>
      {children}
    </VenueContext.Provider>
  );
}

export function useVenue() {
  return useContext(VenueContext);
}
