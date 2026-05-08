"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  Trash2, 
  ExternalLink,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";

interface Venue {
  id: string;
  name: string;
  address: string;
  phone: string;
  plan: string;
  plan_expires_at: string;
  created_at: string;
  owner_email: string;
  order_count: number;
  customer_count: number;
  total_revenue: number;
}

interface Stats {
  venues: number;
  users: number;
  orders: number;
  customers: number;
  total_revenue: number;
  today_revenue: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const supabase = createClient();

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== "hello@pospal.co.uk") {
      router.push("/dashboard");
      return;
    }
    setIsAdmin(true);
    loadData();
  }

  async function loadData() {
    try {
      const [statsRes, venuesRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/venues"),
      ]);

      if (statsRes.ok) {
        const { stats } = await statsRes.json();
        setStats(stats);
      }

      if (venuesRes.ok) {
        const { venues } = await venuesRes.json();
        setVenues(venues);
      }
    } catch (error) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function deleteVenue(venueId: string, venueName: string) {
    if (!confirm(`Delete "${venueName}"? This cannot be undone!`)) return;

    try {
      const res = await fetch("/api/admin/delete-venue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venue_id: venueId }),
      });

      if (res.ok) {
        toast.success("Venue deleted");
        setVenues(venues.filter(v => v.id !== venueId));
      } else {
        toast.error("Failed to delete venue");
      }
    } catch {
      toast.error("Error deleting venue");
    }
  }

  function impersonateVenue(venueId: string) {
    // Store venue ID in localStorage for the venue context to pick up
    localStorage.setItem("admin_impersonating", venueId);
    router.push("/dashboard");
    toast.success("Impersonating venue");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">POSpal Admin</h1>
              <p className="text-sm text-gray-500 mt-1">Superadmin Dashboard</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                Exit Admin
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.venues}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.orders.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.today_revenue)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Venues Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Venues ({venues.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Venue</th>
                    <th className="text-left py-3 px-2">Owner</th>
                    <th className="text-left py-3 px-2">Plan</th>
                    <th className="text-right py-3 px-2">Orders</th>
                    <th className="text-right py-3 px-2">Customers</th>
                    <th className="text-right py-3 px-2">Revenue</th>
                    <th className="text-center py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {venues.map((venue) => (
                    <tr key={venue.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="font-medium">{venue.name}</div>
                        <div className="text-sm text-gray-500">{venue.address}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(venue.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm">{venue.owner_email}</td>
                      <td className="py-3 px-2">
                        <Badge variant={venue.plan === "trial" ? "secondary" : "default"}>
                          {venue.plan}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right">{venue.order_count}</td>
                      <td className="py-3 px-2 text-right">{venue.customer_count}</td>
                      <td className="py-3 px-2 text-right font-medium">
                        {formatCurrency(venue.total_revenue)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => impersonateVenue(venue.id)}
                            title="Impersonate"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => deleteVenue(venue.id, venue.name)}
                            title="Delete Venue"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
