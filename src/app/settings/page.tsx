"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SidebarNav from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Printer,
  Receipt,
  RefreshCw,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  Banknote,
  ChefHat,
  Utensils,
  Users,
  Lock,
  Clock,
  ChevronDown,
  Eye,
  Truck,
  Database,
  Palette,
  Smartphone,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Settings } from "@/lib/types";

interface PrinterInfo {
  name: string;
  enabled: boolean;
}

function ReceiptPreview({ settings }: { settings: Settings | null }) {
  const width = parseInt(settings?.printer_width || "25");
  const currency = settings?.currency_symbol || "£";
  const shopName = settings?.shop_name || "My Takeaway";
  const shopAddress = settings?.shop_address || "123 High Street";
  const shopPhone = settings?.shop_phone || "0123 456789";
  const headerText = settings?.receipt_header || "";
  const footerText = settings?.receipt_footer || "Thank you for your order!";

  const center = (text: string) => {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(pad) + text;
  };

  const line = (left: string, right: string) => {
    const space = Math.max(1, width - left.length - right.length);
    return left + " ".repeat(space) + right;
  };

  const sep = "-".repeat(width);
  const eq = "=".repeat(width);

  const receiptLines = [
    ...(headerText ? [center(headerText), sep] : []),
    center(shopName),
    center(shopAddress),
    center(shopPhone),
    sep,
    line("Order #:", "0001"),
    line("Type:", "COLLECTION"),
    line("Customer:", "John Smith"),
    line("Date:", new Date().toLocaleString("en-GB")),
    line("Payment:", "CASH"),
    sep,
    line("2x Chicken Tikka Masala", `${currency}15.90`),
    "    > Extra spicy",
    line("1x Garlic Naan", `${currency}2.50`),
    line("1x Mango Lassi", `${currency}3.00`),
    sep,
    line("Subtotal:", `${currency}21.40`),
    line("Tax (20%):", `${currency}4.28`),
    line("Discount:", `-${currency}2.00`),
    sep,
    line("TOTAL:", `${currency}23.68`),
    sep,
    "Notes: Ring doorbell",
    sep,
    "",
    center(footerText),
    "",
    "",
  ];

  return (
    <div className="bg-muted rounded-lg p-4 overflow-x-auto">
      <div
        className="bg-white text-black font-mono text-xs leading-tight p-3 mx-auto shadow-sm"
        style={{ width: `${Math.max(280, width * 7)}px`, fontFamily: "'Courier New', monospace" }}
      >
        {receiptLines.map((line, i) => (
          <div key={i} className={line.startsWith("    >") ? "text-gray-600" : ""}>
            {line || "\u00A0"}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [defaultPrinter, setDefaultPrinter] = useState("");
  const [saving, setSaving] = useState(false);
  const [backups, setBackups] = useState<string[]>([]);
  const [backingUp, setBackingUp] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [testingPrint, setTestingPrint] = useState(false);
  const [testingSumUp, setTestingSumUp] = useState(false);
  const [sumUpTestResult, setSumUpTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setSettings(data);
  }, []);

  const fetchPrinters = useCallback(async () => {
    setLoadingPrinters(true);
    try {
      const res = await fetch("/api/print");
      const data = await res.json();
      setPrinters(data.printers || []);
      setDefaultPrinter(data.defaultPrinter || "");
    } catch {
      toast.error("Failed to detect printers");
    } finally {
      setLoadingPrinters(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchPrinters();
  }, [fetchSettings, fetchPrinters]);

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const fetchBackups = useCallback(async () => {
    try {
      const res = await fetch("/api/backup?action=list");
      const data = await res.json();
      if (data.success) setBackups(data.backups || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const res = await fetch("/api/backup?action=create");
      const data = await res.json();
      if (data.success) {
        toast.success("Backup created successfully");
        setBackups(data.backups || []);
      } else {
        toast.error("Backup failed");
      }
    } catch {
      toast.error("Backup failed");
    } finally {
      setBackingUp(false);
    }
  };

  const handleDownload = (file: string) => {
    const a = document.createElement("a");
    a.href = `/api/backup?action=download&file=${encodeURIComponent(file)}`;
    a.download = file;
    a.click();
  };

  const handleRestore = async (file: string) => {
    if (!confirm(`Restore from ${file}? Current data will be backed up first.`)) return;
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Database restored. Please refresh the page.");
      } else {
        toast.error(data.error || "Restore failed");
      }
    } catch {
      toast.error("Restore failed");
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const testPrint = async () => {
    setTestingPrint(true);
    try {
      const res = await fetch("/api/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          test: true, 
          printer: settings?.default_printer || defaultPrinter 
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Test print sent to printer!");
      } else {
        toast.error(data.error || "Print failed");
      }
    } catch {
      toast.error("Test print failed");
    } finally {
      setTestingPrint(false);
    }
  };

  const saveDefaultPrinter = async (printerName: string) => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ default_printer: printerName }),
    });
    setSettings((prev) => (prev ? { ...prev, default_printer: printerName } : null));
    setDefaultPrinter(printerName);
    toast.success(`Default printer set to ${printerName}`);
  };

  const resetOrderCounter = async () => {
    if (!confirm("Reset order counter back to 0? This will make the next order start at #0001.")) return;
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_counter: "0" }),
    });
    setSettings((prev) => (prev ? { ...prev, order_counter: "0" } : null));
    toast.success("Order counter reset to 0");
  };

  if (!settings) {
    return (
      <div className="flex h-screen overflow-hidden">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-6 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
        <div className="max-w-3xl mx-auto p-6 space-y-6">

          {/* Shop Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Shop Details
              </CardTitle>
              <CardDescription>Your business information that appears on receipts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Shop Name</Label>
                <Input
                  value={settings.shop_name}
                  onChange={(e) => updateSetting("shop_name", e.target.value)}
                  placeholder="My Takeaway"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={settings.shop_address}
                  onChange={(e) => updateSetting("shop_address", e.target.value)}
                  placeholder="123 High Street, London"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={settings.shop_phone}
                  onChange={(e) => updateSetting("shop_phone", e.target.value)}
                  placeholder="020 1234 5678"
                />
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding
              </CardTitle>
              <CardDescription>Customize your logo and brand colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Logo URL</Label>
                <Input
                  value={settings.logo_url}
                  onChange={(e) => updateSetting("logo_url", e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground mt-1">Enter a URL to your logo image</p>
              </div>
              {settings.logo_url && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Logo Preview:</p>
                  <img 
                    src={settings.logo_url} 
                    alt="Logo" 
                    className="h-16 object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.primary_color}
                      onChange={(e) => updateSetting("primary_color", e.target.value)}
                      placeholder="hsl(24 95% 53%)"
                    />
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: settings.primary_color || 'hsl(24 95% 53%)' }}
                    />
                  </div>
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.accent_color}
                      onChange={(e) => updateSetting("accent_color", e.target.value)}
                      placeholder="hsl(280 60% 50%)"
                    />
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: settings.accent_color || 'hsl(280 60% 50%)' }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax & Currency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Tax & Currency
              </CardTitle>
              <CardDescription>Configure tax rate and currency symbol</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.tax_rate}
                    onChange={(e) => updateSetting("tax_rate", e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Set to 0 for no tax</p>
                </div>
                <div>
                  <Label>Currency Symbol</Label>
                  <Input
                    value={settings.currency_symbol}
                    onChange={(e) => updateSetting("currency_symbol", e.target.value)}
                    placeholder="£"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Printer Settings */}
          <Card id="printer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Printer Settings
              </CardTitle>
              <CardDescription>
                Plug in your USB receipt printer and it will be automatically detected by macOS.
                Most ESC/POS compatible thermal printers (Epson, Star, etc.) work plug-and-play.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Print Receipts</Label>
                  <p className="text-xs text-muted-foreground">Automatically print when an order is placed</p>
                </div>
                <Switch
                  checked={settings.auto_print === "1"}
                  onCheckedChange={(checked) => updateSetting("auto_print", checked ? "1" : "0")}
                />
              </div>

              <Separator />

              <div>
                <Label>Printer Brand</Label>
                <Select
                  value={settings.printer_brand || "generic"}
                  onValueChange={(value) => updateSetting("printer_brand", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">Generic ESC/POS</SelectItem>
                    <SelectItem value="star">Star (TSP100/TSP143)</SelectItem>
                    <SelectItem value="epson">Epson (TM-series)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select your printer brand for correct cut commands
                </p>
              </div>

              <div>
                <Label>Receipt Width (characters)</Label>
                <Input
                  type="number"
                  min="20"
                  max="80"
                  value={settings.printer_width}
                  onChange={(e) => updateSetting("printer_width", e.target.value)}
                  placeholder="25"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Star TSP143 on macOS = 25 chars. Adjust until receipt preview fits perfectly
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Default Printer</Label>
                    <p className="text-xs text-muted-foreground">
                      Select which printer to use for receipts
                    </p>
                  </div>
                </div>
                
                {printers.length > 0 ? (
                  <Select 
                    value={defaultPrinter} 
                    onValueChange={saveDefaultPrinter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a printer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {printers.map((printer) => (
                        <SelectItem key={printer.name} value={printer.name}>
                          <div className="flex items-center gap-2">
                            <Printer className="h-4 w-4" />
                            {printer.name}
                            {!printer.enabled && " (Offline)"}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No printers detected. Connect a printer first.
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Detected Printers</Label>
                    <p className="text-xs text-muted-foreground">
                      Available printers on your system
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchPrinters}
                    disabled={loadingPrinters}
                  >
                    {loadingPrinters ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Refresh
                  </Button>
                </div>

                {printers.length > 0 ? (
                  <div className="space-y-2">
                    {printers.map((printer) => (
                      <div
                        key={printer.name}
                        className="flex items-center justify-between border rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Printer className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{printer.name}</span>
                          {printer.name === defaultPrinter && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                        {printer.enabled ? (
                          <Badge className="bg-green-500 text-white text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ready
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            Offline
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border rounded-lg bg-muted/50">
                    <Printer className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No printers detected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Plug in a USB receipt printer. macOS will auto-detect it.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={testPrint} disabled={testingPrint}>
                  {testingPrint ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4 mr-2" />
                  )}
                  Test Print
                </Button>
              </div>

              <Separator />

              {/* Receipt Header / Footer */}
              <div className="space-y-3">
                <div>
                  <Label>Receipt Header</Label>
                  <textarea
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] font-mono"
                    value={settings.receipt_header || ""}
                    onChange={(e) => updateSetting("receipt_header", e.target.value)}
                    placeholder="Extra line(s) printed after shop name/address (e.g. VAT No: 123456)"
                  />
                </div>
                <div>
                  <Label>Receipt Footer</Label>
                  <textarea
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] font-mono"
                    value={settings.receipt_footer || ""}
                    onChange={(e) => updateSetting("receipt_footer", e.target.value)}
                    placeholder="e.g. Thank you for your order!&#10;Please come again&#10;www.myshop.co.uk"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Each line break creates a new line on the receipt.</p>
                </div>
              </div>

              <Separator />

              {/* Receipt Preview */}
              <div>
                <Label className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Receipt Preview
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  This is how receipts will look on {settings?.printer_width || "25"}-char wide paper
                </p>
                <ReceiptPreview settings={settings} />
              </div>
            </CardContent>
          </Card>

          {/* Cash Drawer Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Cash Drawer
              </CardTitle>
              <CardDescription>
                Connect your cash drawer to the receipt printer&apos;s RJ11 port.
                The drawer will open automatically when printing receipts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Cash Drawer</Label>
                  <p className="text-xs text-muted-foreground">Open drawer when printing receipts</p>
                </div>
                <Switch
                  checked={settings.cash_drawer_enabled === "1"}
                  onCheckedChange={(checked) => updateSetting("cash_drawer_enabled", checked ? "1" : "0")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Open on Card Payments</Label>
                  <p className="text-xs text-muted-foreground">Also open drawer for card payments (not just cash)</p>
                </div>
                <Switch
                  checked={settings.cash_drawer_on_card === "1"}
                  onCheckedChange={(checked) => updateSetting("cash_drawer_on_card", checked ? "1" : "0")}
                  disabled={settings.cash_drawer_enabled !== "1"}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Test Drawer</Label>
                  <p className="text-xs text-muted-foreground">Send test open command to drawer</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/printer/drawer", { method: "POST" });
                        const data = await res.json();
                        if (data.success) {
                          alert("Drawer open command sent!");
                        } else {
                          alert("Could not open drawer: " + data.message);
                        }
                      } catch {
                        alert("Failed to send command");
                      }
                    }}
                    disabled={settings.cash_drawer_enabled !== "1"}
                  >
                    Open Drawer
                  </Button>
                  <Link href="/settings/drawer">
                    <Button variant="ghost" size="sm">Diagnostics</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kitchen Printer Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Kitchen Printer
              </CardTitle>
              <CardDescription>
                Set up a second printer in your kitchen to print order tickets.
                Tickets show items without prices — perfect for kitchen staff.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Kitchen Printer</Label>
                  <p className="text-xs text-muted-foreground">Print tickets to kitchen when orders are placed</p>
                </div>
                <Switch
                  checked={settings.kitchen_printer_enabled === "1"}
                  onCheckedChange={(checked) => updateSetting("kitchen_printer_enabled", checked ? "1" : "0")}
                />
              </div>
              {settings.kitchen_printer_enabled === "1" && (
                <div>
                  <Label>Kitchen Printer</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={settings.kitchen_printer}
                    onChange={(e) => updateSetting("kitchen_printer", e.target.value)}
                  >
                    <option value="">Select a printer...</option>
                    {printers.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} {p.enabled ? "(Ready)" : "(Offline)"}
                      </option>
                    ))}
                  </select>
                  {printers.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No printers detected. Connect a printer and click Refresh above.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table Service Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Table Service
              </CardTitle>
              <CardDescription>
                Enable eat-in dining with table numbers. Adds an &quot;Eat In&quot; option to the till.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Table Service</Label>
                  <p className="text-xs text-muted-foreground">Show Eat In option and table number field</p>
                </div>
                <Switch
                  checked={settings.table_service_enabled === "1"}
                  onCheckedChange={(checked) => updateSetting("table_service_enabled", checked ? "1" : "0")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Staff Login Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Login
              </CardTitle>
              <CardDescription>
                Track which staff member takes each order. Manage staff in the Staff page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Staff Login</Label>
                  <p className="text-xs text-muted-foreground">Staff must log in before taking orders</p>
                </div>
                <Switch
                  checked={settings.staff_login_required === "1"}
                  onCheckedChange={(checked) => updateSetting("staff_login_required", checked ? "1" : "0")}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Manager PIN
                </Label>
                <Input
                  value={settings.manager_pin}
                  onChange={(e) => updateSetting("manager_pin", e.target.value)}
                  placeholder="1234"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PIN to access Settings. Staff members have their own PINs set in the Staff page.
                </p>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Auto Logout Timeout
                </Label>
                <Select
                  value={typeof window !== "undefined" ? (localStorage.getItem("pos_pin_timeout") || "0") : "0"}
                  onValueChange={(v) => { if (typeof window !== "undefined") localStorage.setItem("pos_pin_timeout", v); }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Disabled</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically log out staff after this period of inactivity on the till.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SumUp Card Reader Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                SumUp Card Reader
              </CardTitle>
              <CardDescription>
                Configure your SumUp Solo card reader credentials. These are saved to your .env.local file — restart the server after changing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Merchant ID</Label>
                <Input
                  value={settings.sumup_merchant_id || ""}
                  onChange={(e) => updateSetting("sumup_merchant_id", e.target.value)}
                  placeholder="e.g. MXXXXXXXX"
                />
                <p className="text-xs text-muted-foreground mt-1">Found in your SumUp dashboard under Profile → Personal Information.</p>
              </div>
              <div>
                <Label>Reader ID</Label>
                <Input
                  value={settings.sumup_reader_id || ""}
                  onChange={(e) => updateSetting("sumup_reader_id", e.target.value)}
                  placeholder="e.g. SN-XXXXXXXX"
                />
                <p className="text-xs text-muted-foreground mt-1">Found on the back of your SumUp Solo device or in SumUp dashboard under Devices.</p>
              </div>
              <div>
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={settings.sumup_api_key_hint || ""}
                  onChange={(e) => updateSetting("sumup_api_key_hint", e.target.value)}
                  placeholder="sup_sk_... (stored securely in .env.local)"
                />
                <p className="text-xs text-muted-foreground mt-1">Secret API key starting with sup_sk_. Stored in .env.local, not in the database.</p>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={async () => {
                    setTestingSumUp(true);
                    setSumUpTestResult(null);
                    try {
                      const res = await fetch("/api/sumup/reader");
                      const data = await res.json();
                      if (data.online) {
                        const battery = data.battery_level != null ? ` · 🔋${data.battery_level}%` : "";
                        setSumUpTestResult({ ok: true, message: `Reader ${data.status || "ONLINE"}${battery} — ${data.name || "SumUp Solo"}` });
                      } else {
                        setSumUpTestResult({ ok: false, message: data.error || `Reader ${data.status || "OFFLINE"} — not reachable` });
                      }
                    } catch {
                      setSumUpTestResult({ ok: false, message: "Network error — check server configuration" });
                    } finally {
                      setTestingSumUp(false);
                    }
                  }}
                  disabled={testingSumUp}
                >
                  {testingSumUp ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Smartphone className="h-4 w-4 mr-2" />}
                  Test SumUp Connection
                </Button>
                {sumUpTestResult && (
                  <div className={`flex items-center gap-2 text-sm font-medium ${sumUpTestResult.ok ? "text-green-600" : "text-red-500"}`}>
                    {sumUpTestResult.ok
                      ? <CheckCircle2 className="h-4 w-4" />
                      : <XCircle className="h-4 w-4" />}
                    {sumUpTestResult.message}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery & Service Charges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery & Charges
              </CardTitle>
              <CardDescription>
                Configure delivery fees and service charges for orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Delivery Fee</Label>
                  <p className="text-xs text-muted-foreground">Add automatic fee for delivery orders</p>
                </div>
                <Switch
                  checked={settings.delivery_fee_enabled === "1"}
                  onCheckedChange={(checked) => updateSetting("delivery_fee_enabled", checked ? "1" : "0")}
                />
              </div>
              {settings.delivery_fee_enabled === "1" && (
                <div>
                  <Label>Fee Amount ({settings.currency_symbol})</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.delivery_fee_amount}
                    onChange={(e) => updateSetting("delivery_fee_amount", e.target.value)}
                    placeholder="2.50"
                  />
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Service Charge</Label>
                  <p className="text-xs text-muted-foreground">Add automatic service charge for eat-in</p>
                </div>
                <Switch
                  checked={settings.service_charge_enabled === "1"}
                  onCheckedChange={(checked) => updateSetting("service_charge_enabled", checked ? "1" : "0")}
                />
              </div>
              {settings.service_charge_enabled === "1" && (
                <div>
                  <Label>Percentage (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.service_charge_percent}
                    onChange={(e) => updateSetting("service_charge_percent", e.target.value)}
                    placeholder="10"
                  />
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Tips / Gratuity</Label>
                  <p className="text-xs text-muted-foreground">Enable tips tracking on orders</p>
                </div>
                <Switch
                  checked={settings.tips_enabled === "1"}
                  onCheckedChange={(checked) => updateSetting("tips_enabled", checked ? "1" : "0")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Receipt Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Receipt Customization
              </CardTitle>
              <CardDescription>
                Customize receipt header and footer messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Header Text (optional)</Label>
                <Input
                  value={settings.receipt_header}
                  onChange={(e) => updateSetting("receipt_header", e.target.value)}
                  placeholder="Welcome to..."
                />
                <p className="text-xs text-muted-foreground mt-1">Appears at top of receipts</p>
              </div>
              <div>
                <Label>Footer Text</Label>
                <Input
                  value={settings.receipt_footer}
                  onChange={(e) => updateSetting("receipt_footer", e.target.value)}
                  placeholder="Thank you for your order!"
                />
                <p className="text-xs text-muted-foreground mt-1">Appears at bottom of receipts</p>
              </div>
            </CardContent>
          </Card>

          {/* Opening Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Opening Hours
              </CardTitle>
              <CardDescription>
                Set when your takeaway is open. When closed, the till will show a closed message.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Shop Open</Label>
                  <p className="text-xs text-muted-foreground">Temporarily close the shop</p>
                </div>
                <Switch
                  checked={settings.shop_open === "1"}
                  onCheckedChange={(checked) => updateSetting("shop_open", checked ? "1" : "0")}
                />
              </div>
              <div>
                <Label>Closed Message</Label>
                <Input
                  value={settings.shop_closed_message}
                  onChange={(e) => updateSetting("shop_closed_message", e.target.value)}
                  placeholder="Sorry, we are currently closed..."
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "opening_monday", label: "Monday" },
                  { key: "opening_tuesday", label: "Tuesday" },
                  { key: "opening_wednesday", label: "Wednesday" },
                  { key: "opening_thursday", label: "Thursday" },
                  { key: "opening_friday", label: "Friday" },
                  { key: "opening_saturday", label: "Saturday" },
                  { key: "opening_sunday", label: "Sunday" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <Label className="text-xs">{label}</Label>
                    <Input
                      value={settings[key] || ""}
                      onChange={(e) => updateSetting(key, e.target.value)}
                      placeholder="11:00-22:00"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Counter */}
          <Card>
            <CardHeader>
              <CardTitle>Order Counter</CardTitle>
              <CardDescription>
                Current order counter: #{String(parseInt(settings.order_counter) + 1).padStart(4, "0")}
                {" "}(next order number)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={resetOrderCounter}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Counter to #0001
              </Button>
            </CardContent>
          </Card>

          {/* Re-run Setup */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <RefreshCw className="h-5 w-5" />
                Re-run Setup Wizard
              </CardTitle>
              <CardDescription>
                Start the setup wizard again. This lets you load a new menu template — your existing orders are kept.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!confirm("Re-run setup wizard? You can load a new menu template. Existing orders are kept.")) return;
                  await fetch("/api/settings", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ setup_complete: "0" }),
                  });
                  window.location.href = "/setup";
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-run Setup Wizard
              </Button>
            </CardContent>
          </Card>

          {/* Backup & Restore */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup & Restore
              </CardTitle>
              <CardDescription>
                Manage database backups and restore points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Backup</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically backup daily at 3 AM
                  </p>
                </div>
                <Switch
                  checked={autoBackupEnabled}
                  onCheckedChange={setAutoBackupEnabled}
                />
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button onClick={handleBackup} disabled={backingUp}>
                  {backingUp ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  Create Backup Now
                </Button>
              </div>

              {backups.length > 0 && (
                <>
                  <Separator />
                  <Label>Available Backups</Label>
                  <ScrollArea className="h-32 rounded-md border">
                    <div className="p-2 space-y-1">
                      {backups.map((file) => (
                        <div
                          key={file}
                          className="flex items-center justify-between p-2 rounded hover:bg-muted"
                        >
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">{file.replace("backup-", "").replace(".db", "")}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleDownload(file)}>
                              ↓
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleRestore(file)}>
                              Restore
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>

          {/* Save button at bottom */}
          <div className="flex justify-end pb-6">
            <Button onClick={saveSettings} disabled={saving} size="lg" className="btn-glow">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save All Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
