"use client";

import { useState, useEffect, useCallback } from "react";
import SidebarNav from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  LogIn,
  LogOut,
  Users,
  Calendar,
  Timer,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, PoundSterling } from "lucide-react";

interface Shift {
  id: number;
  staff_id: number;
  staff_name: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  notes: string;
}

interface Staff {
  id: number;
  name: string;
  pin: string;
  is_manager: number;
  hourly_rate: number;
}

interface StaffSummary {
  name: string;
  staff_id: number;
  total_shifts: number;
  total_minutes: number;
  shifts: Shift[];
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDateTime(dt: string): string {
  try {
    return format(parseISO(dt.endsWith("Z") ? dt : dt + "Z"), "dd MMM, HH:mm");
  } catch {
    return dt;
  }
}

export default function TimesheetsPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [activeShifts, setActiveShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Clock in/out form
  const [pin, setPin] = useState("");
  const [clockAction, setClockAction] = useState<"in" | "out">("in");

  // Filters
  const [dateRange, setDateRange] = useState("this_week");
  const [filterStaff, setFilterStaff] = useState("all");
  const [expandedStaff, setExpandedStaff] = useState<number | null>(null);

  // Manager edit/delete
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return { from: format(now, "yyyy-MM-dd"), to: format(now, "yyyy-MM-dd 23:59:59") };
      case "this_week":
        return { from: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"), to: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd 23:59:59") };
      case "this_month":
        return { from: format(startOfMonth(now), "yyyy-MM-dd"), to: format(endOfMonth(now), "yyyy-MM-dd 23:59:59") };
      default:
        return { from: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"), to: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd 23:59:59") };
    }
  }, [dateRange]);

  const fetchData = useCallback(async () => {
    try {
      const { from, to } = getDateRange();
      const [staffRes, shiftsRes, activeRes] = await Promise.all([
        fetch("/api/staff"),
        fetch(`/api/shifts?from=${from}&to=${to}`),
        fetch("/api/shifts?active=1"),
      ]);
      setStaff(await staffRes.json());
      setShifts(await shiftsRes.json());
      setActiveShifts(await activeRes.json());
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePinKey = (key: string) => {
    if (key === "DEL") { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= 6) return;
    setPin(p => p + key);
  };

  const openEditShift = (shift: Shift) => {
    setEditShift(shift);
    setEditClockIn(shift.clock_in.slice(0, 16));
    setEditClockOut(shift.clock_out ? shift.clock_out.slice(0, 16) : "");
    setEditNotes(shift.notes || "");
  };

  const saveEditShift = async () => {
    if (!editShift) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/shifts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editShift.id,
          clock_in: editClockIn,
          clock_out: editClockOut || null,
          notes: editNotes,
        }),
      });
      if (res.ok) {
        toast.success("Shift updated");
        setEditShift(null);
        fetchData();
      } else {
        toast.error("Failed to update shift");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteShift = async (id: number) => {
    if (!confirm("Delete this shift? This cannot be undone.")) return;
    try {
      await fetch(`/api/shifts?id=${id}`, { method: "DELETE" });
      toast.success("Shift deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleClockAction = async () => {
    if (!pin) { toast.error("Enter your PIN"); return; }
    setActionLoading(true);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, action: clockAction }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
      } else {
        if (clockAction === "in") {
          toast.success(`✅ Clocked in — welcome ${data.shift.staff_name}!`);
        } else {
          toast.success(`👋 Clocked out — ${data.shift.staff_name} worked ${formatDuration(data.duration_minutes)}`);
        }
        setPin("");
        fetchData();
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  // Group shifts by staff for summary
  const staffSummaries: StaffSummary[] = [];
  const byStaff: Record<number, StaffSummary> = {};
  for (const s of shifts) {
    if (!byStaff[s.staff_id]) {
      byStaff[s.staff_id] = { name: s.staff_name, staff_id: s.staff_id, total_shifts: 0, total_minutes: 0, shifts: [] };
    }
    byStaff[s.staff_id].total_shifts++;
    byStaff[s.staff_id].total_minutes += s.duration_minutes || 0;
    byStaff[s.staff_id].shifts.push(s);
  }
  staffSummaries.push(...Object.values(byStaff).sort((a, b) => b.total_minutes - a.total_minutes));

  const filteredSummaries = filterStaff === "all"
    ? staffSummaries
    : staffSummaries.filter(s => s.staff_id.toString() === filterStaff);

  const totalHoursAll = staffSummaries.reduce((sum, s) => sum + s.total_minutes, 0);

  const getHourlyRate = (staffId: number) => {
    const s = staff.find(x => x.id === staffId);
    return s?.hourly_rate || 0;
  };

  const getWageCost = (staffId: number, minutes: number) => {
    const rate = getHourlyRate(staffId);
    return rate > 0 ? (minutes / 60) * rate : null;
  };

  const totalWageCost = staffSummaries.reduce((sum, s) => {
    const cost = getWageCost(s.staff_id, s.total_minutes);
    return sum + (cost || 0);
  }, 0);

  const exportCSV = () => {
    const rows = [
      ["Staff Name", "Clock In", "Clock Out", "Duration (mins)", "Duration", "Notes"],
      ...shifts.map(s => [
        s.staff_name,
        s.clock_in,
        s.clock_out || "Active",
        s.duration_minutes ?? "",
        s.duration_minutes ? formatDuration(s.duration_minutes) : "Active",
        s.notes || "",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheets-${dateRange}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-7 w-7" />
              <div>
                <h1 className="text-2xl font-bold">Timesheets</h1>
                <p className="text-sm text-muted-foreground">Staff clock in / out and hours tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {totalHoursAll > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="px-4 py-2 flex items-center gap-3">
                    <Timer className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Hours ({dateRange.replace("_", " ")})</p>
                      <p className="text-lg font-bold text-primary font-mono">{formatDuration(totalHoursAll)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {totalWageCost > 0 && (
                <Card className="border-amber-500/20 bg-amber-500/5">
                  <CardContent className="px-4 py-2 flex items-center gap-3">
                    <PoundSterling className="h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Est. Wage Cost</p>
                      <p className="text-lg font-bold text-amber-600 font-mono">£{totalWageCost.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {shifts.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Calendar className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Clock In/Out Panel */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Clock In / Out
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* Action toggle */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={clockAction === "in" ? "default" : "outline"}
                      onClick={() => setClockAction("in")}
                      className="gap-2"
                    >
                      <LogIn className="h-4 w-4" /> Clock In
                    </Button>
                    <Button
                      variant={clockAction === "out" ? "default" : "outline"}
                      onClick={() => setClockAction("out")}
                      className="gap-2"
                    >
                      <LogOut className="h-4 w-4" /> Clock Out
                    </Button>
                  </div>

                  {/* PIN display */}
                  <div className="text-center">
                    <div className="text-3xl font-mono tracking-widest h-10 flex items-center justify-center border rounded-md bg-muted">
                      {pin ? "•".repeat(pin.length) : <span className="text-muted-foreground text-sm">Enter PIN</span>}
                    </div>
                  </div>

                  {/* Numpad */}
                  <div className="grid grid-cols-3 gap-2">
                    {["1","2","3","4","5","6","7","8","9","DEL","0","✓"].map((k) => (
                      <Button
                        key={k}
                        variant={k === "✓" ? "default" : k === "DEL" ? "outline" : "outline"}
                        className={`h-12 text-lg font-semibold ${k === "✓" ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                        onClick={() => {
                          if (k === "✓") handleClockAction();
                          else handlePinKey(k);
                        }}
                        disabled={actionLoading}
                      >
                        {actionLoading && k === "✓" ? <Loader2 className="h-4 w-4 animate-spin" /> : k}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Currently Clocked In */}
              {activeShifts.length > 0 && (
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Currently Clocked In ({activeShifts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {activeShifts.map(s => (
                      <div key={s.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{s.staff_name}</span>
                        <span className="text-muted-foreground text-xs">{formatDateTime(s.clock_in)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Timesheets Report */}
            <div className="lg:col-span-2 space-y-4">

              {/* Filters + summary */}
              <div className="flex gap-3 flex-wrap items-center">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStaff} onValueChange={setFilterStaff}>
                  <SelectTrigger className="w-40">
                    <Users className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {staff.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    <Clock className="h-3 w-3 mr-1" />
                    Total: {formatDuration(totalHoursAll)}
                  </Badge>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSummaries.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No shifts recorded for this period</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredSummaries.map(summary => (
                    <Card key={summary.staff_id}>
                      <CardHeader
                        className="pb-2 cursor-pointer select-none hover:bg-muted/40 rounded-t-lg transition-colors"
                        onClick={() => setExpandedStaff(expandedStaff === summary.staff_id ? null : summary.staff_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{summary.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {summary.total_shifts} shift{summary.total_shifts !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-sm font-mono">
                              {formatDuration(summary.total_minutes)}
                            </Badge>
                            {expandedStaff === summary.staff_id
                              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            }
                          </div>
                        </div>
                      </CardHeader>

                      {expandedStaff === summary.staff_id && (
                        <CardContent className="pt-0">
                          <Separator className="mb-3" />
                          <div className="space-y-2">
                            {summary.shifts.map(shift => {
                              const wageCost = getWageCost(summary.staff_id, shift.duration_minutes || 0);
                              return (
                              <div key={shift.id} className="text-sm py-2 border-b border-dashed last:border-0">
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Clock In</p>
                                    <p className="font-medium">{formatDateTime(shift.clock_in)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Clock Out</p>
                                    <p className="font-medium">
                                      {shift.clock_out
                                        ? formatDateTime(shift.clock_out)
                                        : <span className="text-green-600 text-xs">Active</span>
                                      }
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Duration</p>
                                    <p className="font-mono font-semibold">
                                      {shift.clock_out ? formatDuration(shift.duration_minutes) : <span className="text-green-600 text-xs">Ongoing</span>}
                                    </p>
                                    {wageCost != null && shift.clock_out && (
                                      <p className="text-xs text-amber-600 font-mono">£{wageCost.toFixed(2)}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-1">
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openEditShift(shift)}>
                                    <Pencil className="h-3 w-3 mr-1" />Edit
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500 hover:text-red-600" onClick={() => deleteShift(shift.id)}>
                                    <Trash2 className="h-3 w-3 mr-1" />Delete
                                  </Button>
                                </div>
                              </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 flex justify-between items-center">
                            <p className="text-sm font-semibold">
                              Total: <span className="font-mono">{formatDuration(summary.total_minutes)}</span>
                            </p>
                            {(() => { const wc = getWageCost(summary.staff_id, summary.total_minutes); return wc != null ? (
                              <p className="text-sm font-semibold text-amber-600">
                                Est. wages: <span className="font-mono">£{wc.toFixed(2)}</span>
                              </p>
                            ) : null; })()}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Edit Shift Dialog */}
      <Dialog open={!!editShift} onOpenChange={(open) => { if (!open) setEditShift(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Shift — {editShift?.staff_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Clock In</Label>
              <Input
                type="datetime-local"
                value={editClockIn}
                onChange={(e) => setEditClockIn(e.target.value)}
              />
            </div>
            <div>
              <Label>Clock Out</Label>
              <Input
                type="datetime-local"
                value={editClockOut}
                onChange={(e) => setEditClockOut(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Leave blank if shift is still active</p>
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditShift(null)}>Cancel</Button>
            <Button onClick={saveEditShift} disabled={savingEdit}>
              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
