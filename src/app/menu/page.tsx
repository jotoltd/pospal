"use client";

import { useState, useEffect, useCallback } from "react";
import SidebarNav from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Plus,
  Pencil,
  Trash2,
  FolderPlus,
  UtensilsCrossed,
  Package,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type { Category, MenuItem } from "@/lib/types";

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Category dialog
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");

  // Item dialog
  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemCatId, setItemCatId] = useState<string>("");
  const [itemAvailable, setItemAvailable] = useState(true);
  const [itemTrackStock, setItemTrackStock] = useState(false);
  const [itemStockCount, setItemStockCount] = useState("");
  const [itemLowStock, setItemLowStock] = useState("10");
  const [itemModifiers, setItemModifiers] = useState<{id:string;name:string;price:number}[]>([]);

  const fetchData = useCallback(async () => {
    const [catRes, menuRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/menu"),
    ]);
    const cats = await catRes.json();
    const items = await menuRes.json();
    setCategories(cats);
    setMenuItems(items);
    setSelectedCategory((prev) => (prev === null && cats.length > 0 ? cats[0].id : prev));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = menuItems.filter((item) => item.category_id === selectedCategory);

  const resetCategoryStock = async () => {
    const trackedItems = filteredItems.filter(i => i.track_stock);
    if (trackedItems.length === 0) { toast.info("No stock-tracked items in this category"); return; }
    if (!confirm(`Reset stock for ${trackedItems.length} tracked item(s) to their default levels?`)) return;
    await Promise.all(trackedItems.map(item =>
      fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, stock_count: item.low_stock_threshold ? item.low_stock_threshold * 3 : 50 }),
      })
    ));
    toast.success(`Stock reset for ${trackedItems.length} item(s)`);
    fetchData();
  };

  // Category CRUD
  const openCatDialog = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setCatName(cat.name);
    } else {
      setEditingCat(null);
      setCatName("");
    }
    setCatDialog(true);
  };

  const saveCat = async () => {
    if (!catName.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (editingCat) {
      await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingCat.id, name: catName.trim() }),
      });
      toast.success("Category updated");
    } else {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName.trim() }),
      });
      toast.success("Category added");
    }
    setCatDialog(false);
    fetchData();
  };

  const deleteCat = async (cat: Category) => {
    if (!confirm(`Delete "${cat.name}" and all its items?`)) return;
    await fetch(`/api/categories?id=${cat.id}`, { method: "DELETE" });
    toast.success("Category deleted");
    if (selectedCategory === cat.id) setSelectedCategory(null);
    fetchData();
  };

  // Item CRUD
  const openItemDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemPrice(item.price.toString());
      setItemDesc(item.description);
      setItemCatId(item.category_id.toString());
      setItemAvailable(!!item.available);
      setItemTrackStock(!!item.track_stock);
      setItemStockCount(item.stock_count >= 0 ? item.stock_count.toString() : "");
      setItemLowStock(item.low_stock_threshold?.toString() || "10");
      try {
        setItemModifiers(JSON.parse(item.modifiers || "[]"));
      } catch {
        setItemModifiers([]);
      }
    } else {
      setEditingItem(null);
      setItemName("");
      setItemPrice("");
      setItemDesc("");
      setItemCatId(selectedCategory?.toString() || "");
      setItemAvailable(true);
      setItemTrackStock(false);
      setItemStockCount("");
      setItemLowStock("10");
      setItemModifiers([]);
    }
    setItemDialog(true);
  };

  const saveItem = async () => {
    if (!itemName.trim() || !itemPrice || !itemCatId) {
      toast.error("Name, price, and category are required");
      return;
    }
    const payload = {
      id: editingItem?.id,
      category_id: parseInt(itemCatId),
      name: itemName.trim(),
      price: parseFloat(itemPrice),
      description: itemDesc.trim(),
      available: itemAvailable ? 1 : 0,
      track_stock: itemTrackStock,
      stock_count: itemTrackStock ? parseInt(itemStockCount) || 0 : -1,
      low_stock_threshold: parseInt(itemLowStock) || 10,
      modifiers: JSON.stringify(itemModifiers),
    };
    if (editingItem) {
      await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success("Item updated");
    } else {
      await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success("Item added");
    }
    setItemDialog(false);
    fetchData();
  };

  const deleteItem = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await fetch(`/api/menu?id=${item.id}`, { method: "DELETE" });
    toast.success("Item deleted");
    fetchData();
  };

  const toggleAvailable = async (item: MenuItem) => {
    await fetch("/api/menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, available: item.available ? 0 : 1 }),
    });
    fetchData();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <main className="flex-1 flex overflow-hidden">
        {/* Categories sidebar */}
        <div className="w-64 border-r bg-card flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-lg">Categories</h2>
            <Button size="icon" variant="outline" onClick={() => openCatDialog()}>
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span className="text-sm font-medium truncate">{cat.name}</span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCatDialog(cat);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCat(cat);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Click + to add your first category
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Menu items */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Menu Management</h1>
              <p className="text-sm text-muted-foreground">
                {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} in this category
              </p>
            </div>
            <div className="flex gap-2">
              {filteredItems.some(i => i.track_stock) && (
                <Button variant="outline" onClick={resetCategoryStock}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Stock
                </Button>
              )}
              <Button onClick={() => openItemDialog()} disabled={categories.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
                <UtensilsCrossed className="h-12 w-12 mb-3" />
                <p>No items in this category</p>
                <p className="text-sm">Click &quot;Add Item&quot; to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className={`${!item.available ? "opacity-60" : ""}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <div className="flex gap-1">
                          {item.track_stock && (
                            <Badge
                              variant={item.stock_count === 0 ? "destructive" : item.stock_count <= (item.low_stock_threshold || 10) ? "outline" : "secondary"}
                              className="text-xs"
                            >
                              {item.stock_count === 0 ? (
                                <><AlertTriangle className="h-3 w-3 mr-1" />Out of Stock</>
                              ) : (
                                <><Package className="h-3 w-3 mr-1" />{item.stock_count}</>
                              )}
                            </Badge>
                          )}
                          <Badge variant={item.available ? "default" : "secondary"}>
                            {item.available ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      )}
                      <p className="text-xl font-bold text-primary mb-3">
                        £{item.price.toFixed(2)}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleAvailable(item)}>
                          {item.available ? "Mark Unavailable" : "Mark Available"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openItemDialog(item)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteItem(item)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </main>

      {/* Category Dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCat ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Category Name</Label>
            <Input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Starters, Mains, Drinks..."
              onKeyDown={(e) => e.key === "Enter" && saveCat()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>Cancel</Button>
            <Button onClick={saveCat}>{editingCat ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Item Name</Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Chicken Tikka Masala"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price (£)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={itemCatId} onValueChange={setItemCatId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                placeholder="Brief description..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={itemAvailable} onCheckedChange={setItemAvailable} />
              <Label>Available for ordering</Label>
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <Switch checked={itemTrackStock} onCheckedChange={setItemTrackStock} />
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Track Stock
              </Label>
            </div>
            {itemTrackStock && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Current Stock</Label>
                  <Input
                    type="number"
                    min="0"
                    value={itemStockCount}
                    onChange={(e) => setItemStockCount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Low Stock Alert At</Label>
                  <Input
                    type="number"
                    min="1"
                    value={itemLowStock}
                    onChange={(e) => setItemLowStock(e.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* Modifiers */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Plus className="h-4 w-4" />
                Modifiers / Extras
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Options like "Extra cheese +£0.50" that can be added to this item
              </p>
              <div className="space-y-2">
                {itemModifiers.map((mod, idx) => (
                  <div key={mod.id} className="flex gap-2 items-center">
                    <Input
                      value={mod.name}
                      onChange={(e) => {
                        const updated = [...itemModifiers];
                        updated[idx] = { ...mod, name: e.target.value };
                        setItemModifiers(updated);
                      }}
                      placeholder="e.g. Extra Cheese"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={mod.price}
                      onChange={(e) => {
                        const updated = [...itemModifiers];
                        updated[idx] = { ...mod, price: parseFloat(e.target.value) || 0 };
                        setItemModifiers(updated);
                      }}
                      placeholder="0.00"
                      className="w-24"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setItemModifiers(itemModifiers.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setItemModifiers([...itemModifiers, { id: crypto.randomUUID(), name: "", price: 0 }])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Modifier
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog(false)}>Cancel</Button>
            <Button onClick={saveItem}>{editingItem ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
