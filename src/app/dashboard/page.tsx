"use client";

import { useState, useEffect, useCallback } from "react";
import SidebarNav from "@/components/sidebar-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  ShoppingCart,
  Clock,
  PoundSterling,
  Package,
  AlertCircle,
  Activity,
  Utensils,
  Truck,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";

interface RecentOrder {
  id: number;
  order_number: string;
  customer_name: string;
  order_type: string;
  status: string;
  total: number;
  payment_method: string;
  created_at: string;
}

interface LiveStats {
  todaySales: number;
  todayOrders: number;
  avgOrderValue: number;
  activeOrders: number;
  pendingOrders: number;
  lowStockItems: number;
  popularItems: { name: string; count: number }[];
  hourlySales: { hour: string; amount: number }[];
  recentOrders: RecentOrder[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/reports/live");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setLastUpdated(new Date());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <SidebarNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Live Dashboard</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 pulse-dot"></div>
          <span className="text-sm text-muted-foreground">Live</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{stats?.todaySales.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
              Real-time
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg: £{stats?.avgOrderValue.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingOrders || 0} pending prep
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {stats?.lowStockItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Top Selling Items (Today)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.popularItems?.slice(0, 5).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 animate-fade-in-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">#{idx + 1}</Badge>
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-muted-foreground">{item.count} sold</span>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-4">
                No sales data yet today
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hourly Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Hourly Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end gap-2">
            {stats?.hourlySales?.map((hour, idx) => {
              const maxAmount = Math.max(...(stats?.hourlySales.map(h => h.amount) || [1]));
              const height = maxAmount > 0 ? (hour.amount / maxAmount) * 100 : 0;
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={hour.amount > 0 ? `£${hour.amount.toFixed(2)}` : ""}
                >
                  {hour.amount > 0 && height >= 60 && (
                    <span className="text-[9px] text-muted-foreground font-medium">£{hour.amount.toFixed(0)}</span>
                  )}
                  <div
                    className="w-full bg-gradient-to-t from-primary/80 to-primary rounded-t transition-all duration-500"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  ></div>
                  <span className="text-xs text-muted-foreground">{hour.hour}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
            </div>
            <Link href="/orders">
              <span className="text-xs font-normal text-primary underline underline-offset-2 cursor-pointer">View all</span>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.recentOrders?.length ? stats.recentOrders.map((order) => {
              const statusColors: Record<string, string> = {
                pending: "bg-yellow-500", preparing: "bg-blue-500", ready: "bg-green-500",
                out_for_delivery: "bg-purple-500", completed: "bg-gray-400", cancelled: "bg-red-500", refunded: "bg-orange-500",
              };
              const typeIcon = order.order_type === "delivery" ? <Truck className="h-3 w-3" /> :
                order.order_type === "eat_in" ? <Utensils className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />;
              return (
                <div key={order.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-primary">#{order.order_number}</span>
                    <span className="flex items-center gap-1 text-muted-foreground">{typeIcon} {order.order_type.replace("_", " ")}</span>
                    <span>{order.customer_name || "Walk-in"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">£{order.total.toFixed(2)}</span>
                    <span className={`h-2 w-2 rounded-full ${statusColors[order.status] || "bg-gray-400"}`} title={order.status} />
                    <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              );
            }) : (
              <p className="text-muted-foreground text-center py-4">No orders yet today</p>
            )}
          </div>
        </CardContent>
      </Card>
      </main>
    </div>
  );
}
