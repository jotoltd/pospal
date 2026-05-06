"use client";

import { useState, useEffect, useCallback } from "react";
import SidebarNav from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Printer,
  RefreshCw,
  TrendingUp,
  Banknote,
  CreditCard,
  ShoppingBag,
  Truck,
  Utensils,
  RotateCcw,
  Receipt,
  Clock,
  Download,
  Lock,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ZReport {
  date: string;
  totals: {
    orders: number;
    gross_sales: number;
    discounts: number;
    tax: number;
    delivery_fees: number;
    refunds: number;
    net_sales: number;
    tips: number;
  };
  cash_in_drawer: number;
  split_breakdown?: { count: number; cash: number; card: number };
  by_payment: { payment_method: string; count: number; total: number }[];
  by_type: { order_type: string; count: number; total: number }[];
  hourly: { hour: string; count: number; total: number }[];
  top_items: { name: string; qty: number; revenue: number }[];
}

export default function ZReportPage() {
  const [report, setReport] = useState<ZReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [printing, setPrinting] = useState(false);

  // Manager PIN gate
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinChecking, setPinChecking] = useState(false);

  const checkPin = async () => {
    if (!pinInput) { setPinError("Enter your manager PIN"); return; }
    setPinChecking(true);
    setPinError("");
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = await res.json();
      if (data.staff?.is_manager) {
        setPinUnlocked(true);
      } else if (data.staff) {
        setPinError("Manager access required");
      } else {
        setPinError("Invalid PIN");
      }
    } catch {
      setPinError("Could not verify PIN");
    } finally {
      setPinChecking(false);
    }
  };

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/zreport?date=${date}`);
      if (res.ok) setReport(await res.json());
    } catch {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const exportCSV = () => {
    if (!report) return;
    const rows: (string | number)[][] = [
      ["Z-Report", report.date],
      [],
      ["TOTALS"],
      ["Orders", report.totals.orders],
      ["Gross Sales", report.totals.gross_sales.toFixed(2)],
      ["Discounts", (-report.totals.discounts).toFixed(2)],
      ["Delivery Fees", report.totals.delivery_fees.toFixed(2)],
      ["Tax", report.totals.tax.toFixed(2)],
      ...(report.totals.tips > 0 ? [["Tips", report.totals.tips.toFixed(2)]] : []),
      ["Refunds", (-report.totals.refunds).toFixed(2)],
      ["Net Sales", report.totals.net_sales.toFixed(2)],
      ["Cash in Drawer", report.cash_in_drawer.toFixed(2)],
      [],
      ["BY PAYMENT METHOD"],
      ["Method", "Orders", "Total"],
      ...report.by_payment.map(p => [p.payment_method.toUpperCase(), p.count, p.total.toFixed(2)]),
      [],
      ["BY ORDER TYPE"],
      ["Type", "Orders", "Total"],
      ...report.by_type.map(t => [t.order_type.toUpperCase(), t.count, t.total.toFixed(2)]),
      [],
      ["TOP ITEMS"],
      ["Item", "Qty", "Revenue"],
      ...report.top_items.map(i => [i.name, i.qty, i.revenue.toFixed(2)]),
      [],
      ["HOURLY BREAKDOWN"],
      ["Hour", "Orders", "Total"],
      ...report.hourly.map(h => [`${h.hour}:00`, h.count, h.total.toFixed(2)]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zreport-${report.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = async () => {
    if (!report) return;
    setPrinting(true);
    try {
      const res = await fetch("/api/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zreport: report }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Z-Report printed!");
      } else {
        toast.info(data.message || "Printer not available");
      }
    } catch {
      toast.error("Print failed");
    } finally {
      setPrinting(false);
    }
  };

  const paymentIcon = (method: string) => {
    if (method === "cash") return <Banknote className="h-4 w-4" />;
    if (method === "sumup") return <CreditCard className="h-4 w-4" />;
    return <Receipt className="h-4 w-4" />;
  };

  const typeIcon = (type: string) => {
    if (type === "collection") return <ShoppingBag className="h-4 w-4" />;
    if (type === "delivery") return <Truck className="h-4 w-4" />;
    if (type === "eat_in") return <Utensils className="h-4 w-4" />;
    return <ShoppingBag className="h-4 w-4" />;
  };

  if (!pinUnlocked) {
    return (
      <div className="flex h-screen overflow-hidden">
        <SidebarNav />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Manager Access Required</CardTitle>
              <p className="text-sm text-muted-foreground">Enter your manager PIN to view the Z-Report</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Manager PIN</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkPin()}
                  placeholder="Enter PIN"
                  autoFocus
                />
                {pinError && <p className="text-sm text-red-500 mt-1">{pinError}</p>}
              </div>
              <Button className="w-full" onClick={checkPin} disabled={pinChecking}>
                <KeyRound className="h-4 w-4 mr-2" />
                {pinChecking ? "Checking..." : "Unlock Z-Report"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Z-Report</h1>
            <p className="text-muted-foreground">End of day till summary</p>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchReport}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportCSV} disabled={!report}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={printReport} disabled={printing || !report}>
              <Printer className="h-4 w-4 mr-2" />
              {printing ? "Printing..." : "Print Z-Report"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : !report ? (
          <div className="text-center text-muted-foreground py-20">No data found</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Net Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-500">£{report.totals.net_sales.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{report.totals.orders} orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Gross Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">£{report.totals.gross_sales.toFixed(2)}</p>
                  {report.totals.discounts > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">-£{report.totals.discounts.toFixed(2)} discounts</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                    <Banknote className="h-3 w-3" /> Cash in Drawer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-500">£{report.cash_in_drawer.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">After refunds</p>
                </CardContent>
              </Card>

              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" /> Refunds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-500">£{report.totals.refunds.toFixed(2)}</p>
                  {report.totals.tax > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Tax: £{report.totals.tax.toFixed(2)}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    By Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {report.by_payment.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sales today</p>
                  ) : (
                    report.by_payment.map((p) => (
                      <div key={p.payment_method}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            {paymentIcon(p.payment_method)}
                            <span className="capitalize font-medium">
                              {p.payment_method === "sumup" ? "Card (SumUp)" : p.payment_method}
                            </span>
                            <span className="text-muted-foreground">×{p.count}</span>
                          </div>
                          <span className="font-bold">£{Number(p.total).toFixed(2)}</span>
                        </div>
                        {p.payment_method === "split" && report.split_breakdown && report.split_breakdown.count > 0 && (
                          <div className="ml-6 mt-1 space-y-0.5 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>└ Cash portion</span>
                              <span>£{report.split_breakdown.cash.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>└ Card portion</span>
                              <span>£{report.split_breakdown.card.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <Separator />
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span>£{report.totals.gross_sales.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* By Order Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    By Order Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {report.by_type.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sales today</p>
                  ) : (
                    report.by_type.map((t) => (
                      <div key={t.order_type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          {typeIcon(t.order_type)}
                          <span className="font-medium">
                            {t.order_type === "eat_in" ? "Eat In" : t.order_type === "collection" ? "Collection" : t.order_type === "delivery" ? "Delivery" : t.order_type}
                          </span>
                          <span className="text-muted-foreground">×{t.count}</span>
                        </div>
                        <span className="font-bold">£{Number(t.total).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Top Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Top Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {report.top_items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items sold</p>
                  ) : (
                    report.top_items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-5">#{i + 1}</span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-muted-foreground mr-3">×{item.qty}</span>
                          <span className="font-bold">£{Number(item.revenue).toFixed(2)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Hourly Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hourly Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {report.hourly.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hourly data</p>
                  ) : (
                    <div className="h-40 flex items-end gap-1">
                      {report.hourly.map((h, i) => {
                        const max = Math.max(...report.hourly.map(x => x.total));
                        const pct = max > 0 ? (h.total / max) * 100 : 0;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className="w-full bg-primary/70 rounded-t transition-all"
                              style={{ height: `${Math.max(pct, 4)}%` }}
                              title={`£${Number(h.total).toFixed(2)}`}
                            />
                            <span className="text-[10px] text-muted-foreground">{h.hour}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Full breakdown table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Full Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Gross Sales", value: report.totals.gross_sales, bold: false },
                    { label: "Discounts Applied", value: -report.totals.discounts, bold: false },
                    { label: "Delivery Fees", value: report.totals.delivery_fees, bold: false },
                    { label: "Tax Collected", value: report.totals.tax, bold: false },
                    ...(report.totals.tips > 0 ? [{ label: "Tips", value: report.totals.tips, bold: false }] : []),
                    { label: "Refunds Issued", value: -report.totals.refunds, bold: false },
                  ].map(({ label, value, bold }) => (
                    <div key={label} className={`flex justify-between ${bold ? "font-bold" : ""}`}>
                      <span className="text-muted-foreground">{label}</span>
                      <span className={value < 0 ? "text-red-500" : ""}>
                        {value < 0 ? "-" : ""}£{Math.abs(value).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Net Sales</span>
                    <span className="text-green-500">£{report.totals.net_sales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base">
                    <span>Cash in Drawer</span>
                    <span className="text-blue-500">£{report.cash_in_drawer.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
