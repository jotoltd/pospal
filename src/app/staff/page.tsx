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
  Users,
  Plus,
  Pencil,
  Trash2,
  Crown,
  User,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Staff } from "@/lib/types";

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [isManager, setIsManager] = useState(false);
  const [hourlyRate, setHourlyRate] = useState("");

  const fetchStaff = useCallback(async () => {
    const res = await fetch("/api/staff");
    const data = await res.json();
    setStaff(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const openDialog = (s?: Staff) => {
    if (s) {
      setEditingStaff(s);
      setName(s.name);
      setPin(s.pin);
      setIsManager(!!s.is_manager);
      setHourlyRate(s.hourly_rate ? String(s.hourly_rate) : "");
    } else {
      setEditingStaff(null);
      setName("");
      setPin("");
      setIsManager(false);
      setHourlyRate("");
    }
    setShowDialog(true);
  };

  const saveStaff = async () => {
    if (!name.trim() || !pin.trim()) {
      toast.error("Name and PIN are required");
      return;
    }
    if (pin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }

    const payload = {
      id: editingStaff?.id,
      name: name.trim(),
      pin,
      role: isManager ? "manager" : "staff",
      is_manager: isManager ? 1 : 0,
      hourly_rate: parseFloat(hourlyRate) || 0,
    };

    if (editingStaff) {
      await fetch("/api/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success("Staff updated");
    } else {
      await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success("Staff added");
    }

    setShowDialog(false);
    fetchStaff();
  };

  const deleteStaff = async (s: Staff) => {
    if (!confirm(`Remove ${s.name}?`)) return;
    await fetch(`/api/staff?id=${s.id}`, { method: "DELETE" });
    toast.success("Staff removed");
    fetchStaff();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="h-7 w-7" />
              <h1 className="text-2xl font-bold">Staff Management</h1>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : staff.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No staff added yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add staff members to track who takes each order
                </p>
                <Button className="mt-4" onClick={() => openDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Staff
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {staff.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {s.is_manager ? (
                            <Crown className="h-5 w-5 text-primary" />
                          ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{s.name}</p>
                            {s.is_manager && (
                              <Badge variant="secondary" className="text-xs">
                                Manager
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            PIN: {s.pin.replace(/\d/g, "•")}
                            {(s.hourly_rate ?? 0) > 0 && (
                              <span className="ml-2 text-amber-600">£{Number(s.hourly_rate).toFixed(2)}/hr</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openDialog(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteStaff(s)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaff ? "Edit Staff" : "Add Staff"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Smith"
              />
            </div>
            <div>
              <Label>PIN (4+ digits)</Label>
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1234"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Staff enter this PIN to log in
              </p>
            </div>
            <div>
              <Label>Hourly Rate (£) — optional</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="e.g. 11.44"
              />
              <p className="text-xs text-muted-foreground mt-1">Used to estimate wage cost on Timesheets</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isManager} onCheckedChange={setIsManager} />
              <Label>Manager (can access Settings)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveStaff}>
              <Save className="h-4 w-4 mr-2" />
              {editingStaff ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
