"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  ArrowRight,
  ArrowLeft,
  Check,
  Printer,
  Loader2,
  Rocket,
  ChefHat,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface TemplateSummary {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category_count: number;
  item_count: number;
}

interface PrinterInfo {
  name: string;
  enabled: boolean;
}

const STEPS = [
  { label: "Welcome", icon: Rocket },
  { label: "Your Shop", icon: Store },
  { label: "Menu Template", icon: ChefHat },
  { label: "Printer", icon: Printer },
  { label: "Ready!", icon: Check },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [currency, setCurrency] = useState("£");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/setup/templates")
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => {});
  }, []);

  const detectPrinters = async () => {
    setLoadingPrinters(true);
    try {
      const res = await fetch("/api/print");
      const data = await res.json();
      setPrinters(data.printers || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingPrinters(false);
    }
  };

  useEffect(() => {
    if (step === 3) detectPrinters();
  }, [step]);

  const canNext = () => {
    if (step === 1) return shopName.trim().length > 0;
    if (step === 2) return selectedTemplate !== null;
    return true;
  };

  const finishSetup = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate,
          shop_name: shopName.trim(),
          shop_address: shopAddress.trim(),
          shop_phone: shopPhone.trim(),
          tax_rate: taxRate,
          currency_symbol: currency,
        }),
      });

      if (res.ok) {
        toast.success("Setup complete! Let's go!");
        router.push("/");
      } else {
        toast.error("Something went wrong");
      }
    } catch {
      toast.error("Failed to save setup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Progress bar */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all ${
                      i < step
                        ? "bg-green-500 text-white"
                        : i === step
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {i < step ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 w-12 sm:w-20 mx-1 transition-colors ${
                        i < step ? "bg-green-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Step {step + 1} of {STEPS.length}: <span className="font-medium text-foreground">{STEPS[step].label}</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary text-primary-foreground text-4xl font-bold">
                POS
              </div>
              <h1 className="text-4xl font-bold tracking-tight">Welcome to Takeaway POS</h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Let&apos;s get your takeaway set up in under 2 minutes. We&apos;ll help you load your menu, configure your shop details, and connect your printer.
              </p>
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => setStep(1)}>
                Let&apos;s Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Step 1: Shop Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold">Tell us about your shop</h2>
                <p className="text-muted-foreground mt-2">This will appear on your receipts</p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <Label className="text-base">Shop Name *</Label>
                  <Input
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Khan's Tandoori, Golden Dragon, Mario's Pizza..."
                    className="h-12 text-lg"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-base">Address</Label>
                  <Input
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    placeholder="e.g. 42 High Street, Manchester"
                    className="h-12"
                  />
                </div>
                <div>
                  <Label className="text-base">Phone Number</Label>
                  <Input
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    placeholder="e.g. 0161 234 5678"
                    className="h-12"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base">Currency</Label>
                    <Input
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      placeholder="£"
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-base">Tax Rate (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="0"
                      className="h-12"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Set to 0 if no tax</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Menu Template */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold">Choose your menu type</h2>
                <p className="text-muted-foreground mt-2">
                  Pick a template to pre-load your menu. You can customize everything afterwards.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {templates.map((t) => (
                  <Card
                    key={t.id}
                    className={`cursor-pointer transition-all p-5 hover:shadow-md ${
                      selectedTemplate === t.id
                        ? "ring-2 ring-primary bg-primary/5 shadow-md"
                        : "hover:ring-1 hover:ring-primary/30"
                    }`}
                    onClick={() => setSelectedTemplate(t.id)}
                  >
                    <div className="text-center">
                      <span className="text-4xl block mb-2">{t.emoji}</span>
                      <h3 className="font-semibold text-sm">{t.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                      {t.id !== "blank" && (
                        <div className="flex gap-1 justify-center mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {t.category_count} categories
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {t.item_count} items
                          </Badge>
                        </div>
                      )}
                      {selectedTemplate === t.id && (
                        <div className="mt-2">
                          <CheckCircle2 className="h-5 w-5 mx-auto text-primary" />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Printer */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold">Connect your printer</h2>
                <p className="text-muted-foreground mt-2">
                  Plug in your USB receipt printer. Most thermal printers work plug-and-play on Mac — no drivers needed.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Detected Printers</Label>
                  <Button size="sm" variant="outline" onClick={detectPrinters} disabled={loadingPrinters}>
                    {loadingPrinters ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Scan
                  </Button>
                </div>

                {printers.length > 0 ? (
                  <div className="space-y-2">
                    {printers.map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center justify-between border rounded-lg p-4 bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <Printer className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{p.name}</span>
                        </div>
                        {p.enabled ? (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ready
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Offline
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl bg-white">
                    <Printer className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium">No printers detected</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      That&apos;s OK! You can plug one in later.<br />
                      Receipts will show on screen until then.
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                  <p className="font-medium text-blue-900 mb-1">Supported Printers</p>
                  <p className="text-blue-700">
                    Epson TM series, Star TSP/mC series, and most ESC/POS compatible
                    USB thermal printers. Just plug in the USB cable — macOS handles the rest.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Ready */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 text-green-600">
                <Check className="h-12 w-12" />
              </div>
              <h2 className="text-3xl font-bold">You&apos;re all set!</h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Here&apos;s a summary of your setup:
              </p>

              <div className="max-w-sm mx-auto text-left space-y-3 bg-white rounded-xl p-6 border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shop</span>
                  <span className="font-semibold">{shopName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium text-sm">{shopAddress || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{shopPhone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Menu</span>
                  <span className="font-medium">
                    {templates.find((t) => t.id === selectedTemplate)?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Printer</span>
                  <span className="font-medium">
                    {printers.length > 0
                      ? `${printers.filter((p) => p.enabled).length} connected`
                      : "None (on-screen)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{taxRate}%</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                You can change all of this later in Settings.
              </p>

              <Button
                size="lg"
                className="text-lg px-8 py-6"
                onClick={finishSetup}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Rocket className="h-5 w-5 mr-2" />
                )}
                {saving ? "Setting up..." : "Launch Your POS"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      {step > 0 && step < 4 && (
        <div className="border-t bg-white/80 backdrop-blur-sm sticky bottom-0">
          <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between">
            <Button variant="outline" size="lg" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button size="lg" onClick={() => setStep(step + 1)} disabled={!canNext()}>
              {step === 3 ? "Review" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="border-t bg-white/80 backdrop-blur-sm sticky bottom-0">
          <div className="max-w-3xl mx-auto px-6 py-4 flex justify-start">
            <Button variant="outline" size="lg" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
