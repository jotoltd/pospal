"use client";

import { useState, useEffect, useCallback } from "react";
import SidebarNav from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Printer,
  Eye,
  Trash2,
  Search,
  CalendarDays,
  ShoppingBag,
  Truck,
  Utensils,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Order } from "@/lib/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  preparing: "bg-blue-500",
  ready: "bg-green-500",
  out_for_delivery: "bg-purple-500",
  completed: "bg-gray-500",
  cancelled: "bg-red-500",
  refunded: "bg-orange-500",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptText, setReceiptText] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [processingRefund, setProcessingRefund] = useState(false);
  const [refundToCard, setRefundToCard] = useState(false);

  const [allDates, setAllDates] = useState(false);

  useEffect(() => {
    setDateFilter(format(new Date(), "yyyy-MM-dd"));
  }, []);

  const fetchOrders = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (dateFilter && !allDates) params.set("date", dateFilter);
    const res = await fetch(`/api/orders?${params.toString()}`);
    const data = await res.json();
    setOrders(data);
  }, [statusFilter, dateFilter, allDates]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.order_number.includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      order.customer_phone.includes(q)
    );
  });

  const updateStatus = async (orderId: number, status: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success(`Order updated to ${status}`);
    fetchOrders();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => prev ? { ...prev, status: status as Order["status"] } : null);
    }
  };

  const printReceipt = async (orderId: number) => {
    try {
      const res = await fetch("/api/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Receipt printed!");
      } else {
        setReceiptText(data.receipt || "");
        setShowReceipt(true);
        toast.info(data.message);
      }
    } catch {
      toast.error("Failed to print");
    }
  };

  const deleteOrder = async (orderId: number) => {
    if (!confirm("Delete this order?")) return;
    await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
    toast.success("Order deleted");
    setSelectedOrder(null);
    fetchOrders();
  };

  const processRefund = async () => {
    if (!selectedOrder) return;
    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0 || amount > selectedOrder.total) {
      toast.error("Invalid refund amount");
      return;
    }

    setProcessingRefund(true);
    try {
      // If card refund via SumUp
      if (refundToCard && selectedOrder.transaction_code) {
        const cardRes = await fetch("/api/sumup/refund", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transaction_code: selectedOrder.transaction_code,
            amount,
          }),
        });
        const cardData = await cardRes.json();
        if (!cardData.success) {
          toast.error(`Card refund failed: ${cardData.error}`);
          setProcessingRefund(false);
          return;
        }
        toast.success(`£${amount.toFixed(2)} refunded to card!`);
      }

      // Record refund in local DB
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          amount,
          reason: refundReason || (refundToCard ? "Card refund via SumUp" : ""),
        }),
      });

      const updatedOrder = await res.json();
      if (!refundToCard) toast.success(`Refunded £${amount.toFixed(2)}`);
      setSelectedOrder(updatedOrder);
      setShowRefund(false);
      setRefundAmount("");
      setRefundReason("");
      setRefundToCard(false);
      fetchOrders();
      // Auto-print refund receipt
      fetch("/api/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: selectedOrder.id, type: "refund", refund_amount: amount, refund_reason: refundReason }),
      }).then(r => r.json()).then(d => {
        if (d.success) toast.success("Refund receipt printed");
        else if (d.receipt) { setReceiptText(d.receipt); setShowReceipt(true); }
      }).catch(() => {});
    } catch {
      toast.error("Refund failed");
    } finally {
      setProcessingRefund(false);
    }
  };

  // Summary stats
  const todayTotal = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold mb-3">Order History</h1>
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 w-60"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className={`pl-9 w-44 ${allDates ? "opacity-40 pointer-events-none" : ""}`}
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <Button
                variant={allDates ? "default" : "outline"}
                size="sm"
                onClick={() => setAllDates((v) => !v)}
              >
                All dates
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Stats badges */}
            <div className="ml-auto flex gap-3">
              <Badge variant="outline" className="text-sm py-1 px-3">
                {pendingCount} Pending
              </Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">
                {completedCount} Completed
              </Badge>
              <Badge variant="secondary" className="text-sm py-1 px-3 font-semibold">
                Total: £{todayTotal.toFixed(2)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Orders table */}
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-20">Items</TableHead>
                <TableHead className="w-24 text-right">Total</TableHead>
                <TableHead className="w-20">Payment</TableHead>
                <TableHead className="w-36">Time</TableHead>
                <TableHead className="w-48 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <TableCell className="font-mono font-bold">#{order.order_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customer_name || "Walk-in"}</p>
                      {order.customer_phone && (
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {order.order_type === "delivery" ? (
                        <Truck className="h-3 w-3" />
                      ) : order.order_type === "eat_in" ? (
                        <Utensils className="h-3 w-3" />
                      ) : (
                        <ShoppingBag className="h-3 w-3" />
                      )}
                      <span className="capitalize text-xs">
                        {order.order_type === "eat_in" ? `Table ${order.table_number || "—"}` : order.order_type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[order.status]} text-white text-xs capitalize`}>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.items?.length || 0}</TableCell>
                  <TableCell className="text-right font-semibold">£{order.total.toFixed(2)}</TableCell>
                  <TableCell className="uppercase text-xs">{order.payment_method}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(order.created_at), "HH:mm:ss")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => printReceipt(order.id)}>
                        <Printer className="h-3 w-3" />
                      </Button>
                      {order.status === "pending" && (
                        <Button size="sm" onClick={() => updateStatus(order.id, "preparing")}>
                          Accept
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </main>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Order #{selectedOrder?.order_number}
              {selectedOrder && (
                <Badge className={`${statusColors[selectedOrder.status]} text-white capitalize`}>
                  {selectedOrder.status.replace(/_/g, " ")}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer: </span>
                  <span className="font-medium">{selectedOrder.customer_name || "Walk-in"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  <span className="font-medium">{selectedOrder.customer_phone || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  <span className="font-medium capitalize">
                    {selectedOrder.order_type === "eat_in"
                      ? `Eat In (Table ${selectedOrder.table_number || "—"})`
                      : selectedOrder.order_type}
                  </span>
                </div>
                {selectedOrder.order_type === "delivery" && selectedOrder.delivery_address && (
                  <div>
                    <span className="text-muted-foreground">Address: </span>
                    <span className="font-medium">{selectedOrder.delivery_address}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Payment: </span>
                  {selectedOrder.payment_method === "split" ? (
                    <span className="font-medium">
                      Split — Cash £{(selectedOrder.split_cash || 0).toFixed(2)} / Card £{(selectedOrder.split_card || 0).toFixed(2)}
                    </span>
                  ) : (
                    <span className="font-medium uppercase">{selectedOrder.payment_method}</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Time: </span>
                  <span className="font-medium">
                    {format(new Date(selectedOrder.created_at), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
                {selectedOrder.staff_name && (
                  <div>
                    <span className="text-muted-foreground">Staff: </span>
                    <span className="font-medium">{selectedOrder.staff_name}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                {selectedOrder.items?.map((item, i) => {
                  const itemMods = (() => {
                    try { return JSON.parse(item.modifiers || "[]") as { name: string; price: number }[]; }
                    catch { return []; }
                  })();
                  return (
                    <div key={i} className="text-sm">
                      <div className="flex justify-between">
                        <span>
                          {item.quantity}x {item.name}
                          {item.notes && <span className="text-xs text-blue-600 ml-1">({item.notes})</span>}
                        </span>
                        <span className="font-medium">£{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      {itemMods.length > 0 && (
                        <div className="ml-4 mt-0.5">
                          {itemMods.map((mod, mi) => (
                            <div key={mi} className="text-xs text-green-600">
                              + {mod.name} {mod.price > 0 && `(+£${mod.price.toFixed(2)})`}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>£{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.tax > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>£{selectedOrder.tax.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-£{selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.delivery_fee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery Fee</span>
                    <span>£{selectedOrder.delivery_fee.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.service_charge > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service Charge</span>
                    <span>£{selectedOrder.service_charge.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.tip > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tip</span>
                    <span>£{selectedOrder.tip.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.refund_amount > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Refunded</span>
                    <span>-£{selectedOrder.refund_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>£{selectedOrder.total.toFixed(2)}</span>
                </div>
                {selectedOrder.refund_amount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Net Total</span>
                    <span>£{(selectedOrder.total - selectedOrder.refund_amount).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {selectedOrder.refund_reason && (
                <>
                  <Separator />
                  <p className="text-sm text-orange-600">
                    <span className="font-medium">Refund reason:</span> {selectedOrder.refund_reason}
                  </p>
                </>
              )}

              {selectedOrder.notes && (
                <>
                  <Separator />
                  <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {selectedOrder.notes}</p>
                </>
              )}

              <Separator />

              {/* Status update buttons */}
              <div className="flex gap-2 flex-wrap">
                {selectedOrder.status === "pending" && (
                  <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "preparing")}>
                    Start Preparing
                  </Button>
                )}
                {selectedOrder.status === "preparing" && (
                  <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "ready")}>
                    Mark Ready
                  </Button>
                )}
                {selectedOrder.status === "ready" && selectedOrder.order_type === "delivery" && (
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => updateStatus(selectedOrder.id, "out_for_delivery")}>
                    <Truck className="h-3 w-3 mr-1" /> Out for Delivery
                  </Button>
                )}
                {selectedOrder.status === "ready" && selectedOrder.order_type !== "delivery" && (
                  <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "completed")}>
                    Complete Order
                  </Button>
                )}
                {selectedOrder.status === "out_for_delivery" && (
                  <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "completed")}>
                    Mark Delivered
                  </Button>
                )}
                {selectedOrder.status !== "cancelled" && selectedOrder.status !== "completed" && selectedOrder.status !== "refunded" && (
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedOrder.id, "cancelled")}>
                    Cancel Order
                  </Button>
                )}
                {(selectedOrder.status === "completed" || selectedOrder.status === "refunded") && selectedOrder.refund_amount < selectedOrder.total && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-orange-600 border-orange-600"
                    onClick={() => {
                      setRefundAmount(String(selectedOrder.total - selectedOrder.refund_amount));
                      setShowRefund(true);
                    }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Refund
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => printReceipt(selectedOrder.id)}>
                  <Printer className="h-3 w-3 mr-1" />
                  Reprint Receipt
                </Button>
                {selectedOrder.refund_amount > 0 && (
                  <Button size="sm" variant="outline" className="text-orange-600 border-orange-300" onClick={() => {
                    fetch("/api/print", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ order_id: selectedOrder.id, type: "refund", refund_amount: selectedOrder.refund_amount, refund_reason: selectedOrder.refund_reason }),
                    }).then(r => r.json()).then(d => {
                      if (d.success) toast.success("Refund receipt printed");
                      else if (d.receipt) { setReceiptText(d.receipt); setShowReceipt(true); }
                    });
                  }}>
                    <Printer className="h-3 w-3 mr-1" />
                    Refund Receipt
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => deleteOrder(selectedOrder.id)}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Preview Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt Preview</DialogTitle>
          </DialogHeader>
          <pre className="bg-muted p-4 rounded-lg text-xs font-mono whitespace-pre overflow-x-auto max-h-96">
            {receiptText}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceipt(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefund} onOpenChange={setShowRefund}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-orange-600 flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Process Refund
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(selectedOrder?.payment_method === "sumup" || (selectedOrder?.payment_method === "split" && selectedOrder?.split_card > 0)) && selectedOrder?.transaction_code && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={!refundToCard ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setRefundToCard(false)}
                >
                  Cash Refund
                </Button>
                <Button
                  size="sm"
                  variant={refundToCard ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setRefundToCard(true)}
                >
                  Refund to Card
                </Button>
              </div>
            )}
            {refundToCard && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                {selectedOrder?.payment_method === "split"
                  ? `Card portion only: max £${(selectedOrder.split_card || 0).toFixed(2)} can be refunded to card`
                  : "Amount will be refunded directly to the customer's card via SumUp"}
              </div>
            )}
            <div>
              <Label>Refund Amount (£)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                max={refundToCard && selectedOrder?.payment_method === "split" ? selectedOrder.split_card : selectedOrder?.total}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
              />
              {selectedOrder && (
                <p className="text-xs text-muted-foreground mt-1">
                  Max refund: £{refundToCard && selectedOrder.payment_method === "split"
                    ? Math.min(selectedOrder.split_card, selectedOrder.total - selectedOrder.refund_amount).toFixed(2)
                    : (selectedOrder.total - selectedOrder.refund_amount).toFixed(2)}
                </p>
              )}
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Input
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Customer complaint, wrong item..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRefund(false); setRefundToCard(false); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={processRefund}
              disabled={processingRefund}
            >
              {processingRefund ? "Processing..." : (refundToCard ? "Refund to Card" : "Confirm Refund")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
