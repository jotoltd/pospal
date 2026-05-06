"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingBag, Store, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_SETTINGS = [
  ["shop_name", ""],
  ["shop_address", ""],
  ["shop_phone", ""],
  ["tax_rate", "0"],
  ["currency_symbol", "£"],
  ["printer_type", "thermal"],
  ["printer_width", "32"],
  ["printer_brand", "generic"],
  ["auto_print", "1"],
  ["order_counter", "0"],
  ["setup_complete", "1"],
  ["cash_drawer_enabled", "1"],
  ["cash_drawer_on_card", "0"],
  ["kitchen_printer", ""],
  ["kitchen_printer_enabled", "0"],
  ["table_service_enabled", "0"],
  ["staff_login_required", "0"],
  ["manager_pin", "1234"],
  ["current_staff_id", ""],
  ["current_staff_name", ""],
  ["shop_open", "1"],
  ["shop_closed_message", "Sorry, we are currently closed."],
  ["opening_monday", "11:00-22:00"],
  ["opening_tuesday", "11:00-22:00"],
  ["opening_wednesday", "11:00-22:00"],
  ["opening_thursday", "11:00-22:00"],
  ["opening_friday", "11:00-23:00"],
  ["opening_saturday", "11:00-23:00"],
  ["opening_sunday", "12:00-22:00"],
  ["delivery_fee_enabled", "0"],
  ["delivery_fee_amount", "2.50"],
  ["service_charge_enabled", "0"],
  ["service_charge_percent", "10"],
  ["tips_enabled", "1"],
  ["receipt_header", ""],
  ["receipt_footer", "Thank you for your order!"],
  ["logo_url", ""],
  ["primary_color", "hsl(24 95% 53%)"],
  ["accent_color", "hsl(280 60% 50%)"],
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venuePhone, setVenuePhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueName.trim()) {
      toast.error("Restaurant name is required");
      return;
    }
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated — please sign in again");
      router.push("/login");
      return;
    }

    // Create venue
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .insert({
        owner_id: user.id,
        name: venueName.trim(),
        address: venueAddress.trim(),
        phone: venuePhone.trim(),
        plan: "trial",
      })
      .select()
      .single();

    if (venueError || !venue) {
      toast.error("Failed to create venue: " + venueError?.message);
      setLoading(false);
      return;
    }

    // Seed default settings
    const settingsRows = DEFAULT_SETTINGS.map(([key, value]) => ({
      venue_id: venue.id,
      key,
      value: key === "shop_name" ? venueName.trim()
           : key === "shop_address" ? venueAddress.trim()
           : key === "shop_phone" ? venuePhone.trim()
           : value,
    }));

    await supabase.from("settings").insert(settingsRows);

    toast.success(`Welcome to POSpal, ${venueName}!`);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary mb-4">
            <ShoppingBag className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Almost there!</h1>
          <p className="text-muted-foreground text-sm mt-1">Tell us about your restaurant or takeaway</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Set up your venue</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Restaurant / Takeaway name *</Label>
                <div className="relative mt-1">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="e.g. Pizza Palace"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    placeholder="123 High Street, London"
                  />
                </div>
              </div>
              <div>
                <Label>Phone number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={venuePhone}
                    onChange={(e) => setVenuePhone(e.target.value)}
                    placeholder="0123 456 789"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Launch my POS system
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
