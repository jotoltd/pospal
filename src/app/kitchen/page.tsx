"use client";

import { useState, useEffect, useCallback } from "react";
import SidebarNav from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  ShoppingBag,
  Truck,
  Printer,
  Bell,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/lib/types";

const statusColors: Record<string, string> = {
  pending: "border-yellow-500 bg-yellow-500/10",
  preparing: "border-blue-500 bg-blue-500/10",
  ready: "border-green-500 bg-green-500/10",
};

// Timer colors based on elapsed time
function getTimerColor(mins: number): string {
  if (mins < 10) return "text-green-400";
  if (mins < 20) return "text-yellow-400";
  return "text-red-400";
}

function getTimerBg(mins: number): string {
  if (mins < 10) return "bg-green-500/20";
  if (mins < 20) return "bg-yellow-500/20";
  return "bg-red-500/20";
}

const statusBadgeColors: Record<string, string> = {
  pending: "bg-yellow-500 text-white",
  preparing: "bg-blue-500 text-white",
  ready: "bg-green-500 text-white",
};

function timeSince(dateStr: string): { text: string; mins: number } {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return { text: "Just now", mins: 0 };
  if (mins < 60) return { text: `${mins}m ago`, mins };
  const hours = Math.floor(mins / 60);
  return { text: `${hours}h ${mins % 60}m ago`, mins };
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/orders?status=pending");
    const pending = await res.json();
    const res2 = await fetch("/api/orders?status=preparing");
    const preparing = await res2.json();
    const res3 = await fetch("/api/orders?status=ready");
    const ready = await res3.json();
    setOrders([...pending, ...preparing, ...ready]);
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId: number, status: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (status === "ready") {
      // Play a sound or visual alert
      toast.success("Order ready for collection!", { icon: <Bell className="h-4 w-4" /> });
    } else {
      toast.success(`Order updated to ${status}`);
    }

    fetchOrders();
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
        toast.info(data.message);
      }
    } catch {
      toast.error("Failed to print");
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <main className="flex-1 flex flex-col overflow-hidden bg-muted/30">
        {/* Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="h-7 w-7" />
              <h1 className="text-2xl font-bold">Kitchen Display</h1>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className="text-sm py-1 px-3 border-yellow-500">
                {pendingOrders.length} New
              </Badge>
              <Badge variant="outline" className="text-sm py-1 px-3 border-blue-500">
                {preparingOrders.length} Preparing
              </Badge>
              <Badge variant="outline" className="text-sm py-1 px-3 border-green-500">
                {readyOrders.length} Ready
              </Badge>
            </div>
          </div>
        </div>

        {/* Three-column layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Pending */}
          <div className="flex-1 flex flex-col border-r">
            <div className="p-3 bg-yellow-500/10 border-b font-semibold text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              NEW ORDERS ({pendingOrders.length})
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <Card key={order.id} className={`border-2 ${statusColors.pending}`}>
                    <CardHeader className="pb-2 pt-3 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold">#{order.order_number}</CardTitle>
                        <div className="flex items-center gap-2">
                          {order.order_type === "delivery" ? (
                            <Badge variant="outline" className="text-xs"><Truck className="h-3 w-3 mr-1" />Delivery</Badge>
                          ) : order.order_type === "eat_in" ? (
                            <Badge variant="outline" className="text-xs border-purple-400 text-purple-700"><Utensils className="h-3 w-3 mr-1" />Table {order.table_number || "?"}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs"><ShoppingBag className="h-3 w-3 mr-1" />Collection</Badge>
                          )}
                          {(() => {
                            const timer = timeSince(order.created_at);
                            return (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTimerBg(timer.mins)} ${getTimerColor(timer.mins)}`}>
                                {timer.text}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      {order.customer_name && (
                        <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                      )}
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <div className="space-y-1 mb-3">
                        {order.items?.map((item, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-semibold">{item.quantity}x</span> {item.name}
                            {item.notes && <p className="text-xs text-blue-600 ml-4">{item.notes}</p>}
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded mb-3">
                          Note: {order.notes}
                        </p>
                      )}
                      {(order as any).customer_allergies && (
                        <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-300 p-2 rounded mb-3">
                          ⚠ ALLERGIES: {(order as any).customer_allergies}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => updateStatus(order.id, "preparing")}>
                          Start Preparing
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => printReceipt(order.id)}>
                          <Printer className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pendingOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-12">No new orders</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Preparing */}
          <div className="flex-1 flex flex-col border-r">
            <div className="p-3 bg-blue-500/10 border-b font-semibold text-sm flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-blue-600" />
              PREPARING ({preparingOrders.length})
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {preparingOrders.map((order) => (
                  <Card key={order.id} className={`border-2 ${statusColors.preparing}`}>
                    <CardHeader className="pb-2 pt-3 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold">#{order.order_number}</CardTitle>
                        <div className="flex items-center gap-2">
                          {order.order_type === "delivery" ? (
                            <Badge variant="outline" className="text-xs"><Truck className="h-3 w-3 mr-1" />Delivery</Badge>
                          ) : order.order_type === "eat_in" ? (
                            <Badge variant="outline" className="text-xs border-purple-400 text-purple-700"><Utensils className="h-3 w-3 mr-1" />Table {order.table_number || "?"}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs"><ShoppingBag className="h-3 w-3 mr-1" />Collection</Badge>
                          )}
                          {(() => {
                            const timer = timeSince(order.created_at);
                            return (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTimerBg(timer.mins)} ${getTimerColor(timer.mins)}`}>
                                {timer.text}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      {order.customer_name && (
                        <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                      )}
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <div className="space-y-1 mb-3">
                        {order.items?.map((item, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-semibold">{item.quantity}x</span> {item.name}
                            {item.notes && <p className="text-xs text-blue-600 ml-4">{item.notes}</p>}
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded mb-3">
                          Note: {order.notes}
                        </p>
                      )}
                      {(order as any).customer_allergies && (
                        <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-300 p-2 rounded mb-3">
                          ⚠ ALLERGIES: {(order as any).customer_allergies}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => updateStatus(order.id, "ready")}>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Mark Ready
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => printReceipt(order.id)}>
                          <Printer className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {preparingOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-12">No orders preparing</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Ready */}
          <div className="flex-1 flex flex-col">
            <div className="p-3 bg-green-500/10 border-b font-semibold text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              READY ({readyOrders.length})
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {readyOrders.map((order) => (
                  <Card key={order.id} className={`border-2 ${statusColors.ready}`}>
                    <CardHeader className="pb-2 pt-3 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold">#{order.order_number}</CardTitle>
                        <div className="flex items-center gap-2">
                          {order.order_type === "delivery" ? (
                            <Badge variant="outline" className="text-xs"><Truck className="h-3 w-3 mr-1" />Delivery</Badge>
                          ) : order.order_type === "eat_in" ? (
                            <Badge variant="outline" className="text-xs border-purple-400 text-purple-700"><Utensils className="h-3 w-3 mr-1" />Table {order.table_number || "?"}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs"><ShoppingBag className="h-3 w-3 mr-1" />Collection</Badge>
                          )}
                          {(() => {
                            const timer = timeSince(order.created_at);
                            return (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTimerBg(timer.mins)} ${getTimerColor(timer.mins)}`}>
                                {timer.text}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      {order.customer_name && (
                        <p className="text-base text-muted-foreground font-semibold">{order.customer_name}</p>
                      )}
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <div className="space-y-1 mb-3">
                        {order.items?.map((item, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-semibold">{item.quantity}x</span> {item.name}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" variant="outline" onClick={() => updateStatus(order.id, "completed")}>
                          Complete & Close
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => printReceipt(order.id)}>
                          <Printer className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {readyOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-12">No orders ready</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  );
}
