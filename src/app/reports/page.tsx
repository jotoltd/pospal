"use client";

import { useState, useEffect, useCallback } from "react";
import SidebarNav from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart3, TrendingUp, ShoppingCart, Download, PoundSterling } from "lucide-react";
import { toast } from "sonner";

interface ReportData {
  period: string;
  startDate: string;
  endDate: string;
  summary: {
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
  };
  byType: Record<string, { count: number; sales: number }>;
  topItems: { name: string; total_quantity: number; total_revenue: number }[];
  breakdown: Record<string, { orders: number; sales: number }>;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("daily");
  const [date, setDate] = useState<string>("");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?period=${period}&date=${date}`);
      const reportData = await res.json();
      setData(reportData);
    } catch {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [period, date]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const exportCSV = async (type: "orders" | "items") => {
    try {
      const res = await fetch(`/api/export?type=${type}&start=${data?.startDate}&end=${data?.endDate}`);
      if (!res.ok) { toast.error("Export failed"); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_${data?.startDate}_to_${data?.endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Exported ${type} to CSV`);
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-7 w-7" />
              <h1 className="text-2xl font-bold">Sales Reports</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportCSV("orders")}>
                <Download className="h-4 w-4 mr-2" />
                Export Orders
              </Button>
              <Button variant="outline" onClick={() => exportCSV("items")}>
                <Download className="h-4 w-4 mr-2" />
                Export Items
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-4 items-end">
                <div>
                  <Label>Report Period</Label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-44"
                  />
                </div>
                <Button onClick={fetchReport} disabled={loading}>
                  {loading ? "Loading..." : "Generate Report"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {data && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <PoundSterling className="h-4 w-4" />
                      <span className="text-sm">Total Sales</span>
                    </div>
                    <p className="text-2xl font-bold">£{data.summary.totalSales.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="text-sm">Total Orders</span>
                    </div>
                    <p className="text-2xl font-bold">{data.summary.totalOrders}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">Avg Order Value</span>
                    </div>
                    <p className="text-2xl font-bold">£{data.summary.avgOrderValue.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* By Order Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sales by Order Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(data.byType).map(([type, stats]) => (
                        <div key={type} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{type === "eat_in" ? "Eat In" : type.charAt(0).toUpperCase() + type.slice(1)}</Badge>
                            <span className="text-sm text-muted-foreground">{stats.count} orders</span>
                          </div>
                          <span className="font-semibold">£{stats.sales.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Selling Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {data.topItems.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">#{i + 1}</Badge>
                              <span className="text-sm">{item.name}</span>
                            </div>
                            <div className="text-right text-sm">
                              <span className="font-semibold">{item.total_quantity}x</span>
                              <span className="text-muted-foreground ml-2">£{Number(item.total_revenue).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Hourly/Daily Breakdown */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">
                    {period === "daily" ? "Hourly Breakdown" : "Daily Breakdown"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {data.startDate === data.endDate
                      ? data.startDate
                      : `${data.startDate} to ${data.endDate}`}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                    {Object.entries(data.breakdown).map(([key, stats]) => (
                      <div key={key} className="p-2 bg-muted rounded text-center">
                        <p className="text-xs text-muted-foreground">{key}</p>
                        <p className="font-semibold text-sm">£{stats.sales.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{stats.orders} orders</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
