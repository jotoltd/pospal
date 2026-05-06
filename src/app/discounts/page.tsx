"use client";

import { useState, useEffect, useCallback } from "react";
import SidebarNav from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Percent,
  PoundSterling,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import type { DiscountCode } from "@/lib/types";

export default function DiscountsPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("0");
  const [maxUses, setMaxUses] = useState("");
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState("");
  const [isHappyHour, setIsHappyHour] = useState(false);
  const [happyHourStart, setHappyHourStart] = useState("17:00");
  const [happyHourEnd, setHappyHourEnd] = useState("19:00");
  const [active, setActive] = useState(true);

  const fetchCodes = useCallback(async () => {
    const res = await fetch("/api/discounts");
    const data = await res.json();
    setCodes(data);
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const openDialog = (c?: DiscountCode) => {
    if (c) {
      setEditingCode(c);
      setCode(c.code);
      setType(c.type);
      setValue(String(c.value));
      setMinOrderValue(String(c.min_order_value));
      setMaxUses(c.max_uses?.toString() || "");
      setValidFrom(c.valid_from?.split("T")[0] || new Date().toISOString().split("T")[0]);
      setValidUntil(c.valid_until?.split("T")[0] || "");
      setIsHappyHour(!!c.is_happy_hour);
      setHappyHourStart(c.happy_hour_start || "17:00");
      setHappyHourEnd(c.happy_hour_end || "19:00");
      setActive(!!c.active);
    } else {
      setEditingCode(null);
      setCode("");
      setType("percentage");
      setValue("");
      setMinOrderValue("0");
      setMaxUses("");
      setValidFrom(new Date().toISOString().split("T")[0]);
      setValidUntil("");
      setIsHappyHour(false);
      setHappyHourStart("17:00");
      setHappyHourEnd("19:00");
      setActive(true);
    }
    setShowDialog(true);
  };

  const saveCode = async () => {
    if (!code.trim() || !value) {
      toast.error("Code and value are required");
      return;
    }

    const payload = {
      id: editingCode?.id,
      code: code.trim().toUpperCase(),
      type,
      value: parseFloat(value),
      min_order_value: parseFloat(minOrderValue) || 0,
      max_uses: maxUses ? parseInt(maxUses) : null,
      valid_from: validFrom,
      valid_until: validUntil || null,
      is_happy_hour: isHappyHour,
      happy_hour_start: isHappyHour ? happyHourStart : null,
      happy_hour_end: isHappyHour ? happyHourEnd : null,
      active,
    };

    if (editingCode) {
      await fetch("/api/discounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success("Code updated");
    } else {
      await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success("Code created");
    }

    setShowDialog(false);
    fetchCodes();
  };

  const deleteCode = async (c: DiscountCode) => {
    if (!confirm(`Delete code "${c.code}"?`)) return;
    await fetch(`/api/discounts?id=${c.id}`, { method: "DELETE" });
    toast.success("Code deleted");
    fetchCodes();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Tag className="h-7 w-7" />
              <h1 className="text-2xl font-bold">Discount Codes</h1>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Code
            </Button>
          </div>

          {codes.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-semibold text-lg mb-1">No discount codes yet</p>
                <p className="text-sm text-muted-foreground mb-4">Create a code to offer discounts at checkout</p>
                <Button onClick={() => openDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Code
                </Button>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4">
            {codes.map((c) => (
              <Card key={c.id} className={!c.active ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        {c.type === "percentage" ? (
                          <Percent className="h-6 w-6 text-primary" />
                        ) : (
                          <PoundSterling className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg font-mono">{c.code}</span>
                          {!c.active && <Badge variant="secondary">Inactive</Badge>}
                          {c.is_happy_hour && (
                            <Badge className="bg-amber-500 text-white">
                              <Clock className="h-3 w-3 mr-1" />
                              Happy Hour
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {c.type === "percentage" ? `${c.value}% off` : `£${c.value} off`}
                          {c.min_order_value > 0 && ` (min £${c.min_order_value})`}
                          {c.max_uses && ` • ${c.uses_count}/${c.max_uses} uses`}
                          {c.valid_until && ` • Until ${new Date(c.valid_until).toLocaleDateString("en-GB")}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openDialog(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteCode(c)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCode ? "Edit Code" : "Create Discount Code"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as "percentage" | "fixed")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage %</SelectItem>
                    <SelectItem value="fixed">Fixed £</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value</Label>
                <Input
                  type="number"
                  min="0"
                  step={type === "percentage" ? "1" : "0.01"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === "percentage" ? "20" : "5.00"}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min Order (£)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                />
              </div>
              <div>
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valid From</Label>
                <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
              </div>
              <div>
                <Label>Valid Until (optional)</Label>
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isHappyHour} onCheckedChange={setIsHappyHour} />
              <Label>Happy Hour (time-limited)</Label>
            </div>
            {isHappyHour && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Time</Label>
                  <Input type="time" value={happyHourStart} onChange={(e) => setHappyHourStart(e.target.value)} />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input type="time" value={happyHourEnd} onChange={(e) => setHappyHourEnd(e.target.value)} />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={active} onCheckedChange={setActive} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={saveCode}>{editingCode ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
