"use client";

import { useState, useEffect, useCallback } from "react";
import SidebarNav from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Crown,
  Search,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { Customer, Order } from "@/lib/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [showOrders, setShowOrders] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");

  const fetchCustomers = useCallback(async () => {
    const res = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(data);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openDialog = (c?: Customer) => {
    if (c) {
      setEditingCustomer(c);
      setName(c.name);
      setPhone(c.phone);
      setEmail(c.email);
      setAddress(c.address);
      setIsVip(!!c.is_vip);
      setAllergies(c.allergies);
      setNotes(c.notes);
    } else {
      setEditingCustomer(null);
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setIsVip(false);
      setAllergies("");
      setNotes("");
    }
    setShowDialog(true);
  };

  const saveCustomer = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    const payload = {
      id: editingCustomer?.id,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      is_vip: isVip,
      allergies: allergies.trim(),
      notes: notes.trim(),
    };

    if (editingCustomer) {
      await fetch("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success("Customer updated");
    } else {
      await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success("Customer added");
    }

    setShowDialog(false);
    fetchCustomers();
  };

  const deleteCustomer = async (c: Customer) => {
    if (!confirm(`Delete ${c.name}?`)) return;
    await fetch(`/api/customers?id=${c.id}`, { method: "DELETE" });
    toast.success("Customer deleted");
    fetchCustomers();
  };

  const viewOrders = async (c: Customer) => {
    const res = await fetch(`/api/customers/${c.id}/orders`);
    const orders = await res.json();
    setCustomerOrders(orders);
    setSelectedCustomer(c);
    setShowOrders(true);
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="h-7 w-7" />
              <h1 className="text-2xl font-bold">Customer Database</h1>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search customers by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Customers Table */}
          <Card>
            <ScrollArea className="h-[calc(100vh-250px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{c.name}</span>
                          {c.is_vip && (
                            <Badge className="bg-amber-500 text-white">
                              <Crown className="h-3 w-3 mr-1" />
                              VIP
                            </Badge>
                          )}
                          {c.allergies && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Allergies
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>{c.total_orders}</TableCell>
                      <TableCell className="text-right font-semibold">£{c.total_spent.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="outline" onClick={() => viewOrders(c)}>
                            <ShoppingBag className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openDialog(c)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteCustomer(c)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <Label>Allergies / Dietary Requirements</Label>
              <Input
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Nut allergy, gluten free..."
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special notes..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isVip} onCheckedChange={setIsVip} />
              <Label>VIP Customer</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={saveCustomer}>{editingCustomer ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Orders Dialog */}
      <Dialog open={showOrders} onOpenChange={setShowOrders}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order History - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {customerOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No orders found</p>
              ) : (
                customerOrders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">Order #{order.order_number}</span>
                        <Badge className="capitalize">{order.status.replace(/_/g, " ")}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("en-GB")}
                      </p>
                      <p className="font-semibold">£{order.total.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
