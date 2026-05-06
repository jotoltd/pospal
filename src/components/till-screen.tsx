"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Minus,
  Trash2,
  Printer,
  ShoppingCart,
  User,
  X,
  Receipt,
  RefreshCw,
  UtensilsCrossed,
  ArrowRight,
  Banknote,
  Split,
  ChevronDown,
  Check,
  Search,
  Zap,
  Pause,
  ShoppingBag,
  Clock,
  LogOut,
  Truck,
  Utensils,
  Tag,
  Smartphone,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Category, MenuItem, CartItem, Settings, Staff, ModifierOption } from "@/lib/types";

export default function TillScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"collection" | "delivery" | "eat_in">("collection");
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptText, setReceiptText] = useState("");
  const [itemNoteDialog, setItemNoteDialog] = useState<{ index: number; note: string } | null>(null);
  const [modifierDialog, setModifierDialog] = useState<{
    item: MenuItem;
    selectedModifiers: { id: string; name: string; price: number }[];
  } | null>(null);
  const [parkedOrdersDialog, setParkedOrdersDialog] = useState(false);
  const [parkedOrders, setParkedOrders] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickKeys, setShowQuickKeys] = useState(true);
  const [discountCode, setDiscountCode] = useState("");
  const [discountCodeError, setDiscountCodeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [staffLoginRequired, setStaffLoginRequired] = useState(false);
  const [splitPayment, setSplitPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [cashTendered, setCashTendered] = useState("");
  const [tipAmount, setTipAmount] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerLoyaltyPoints, setCustomerLoyaltyPoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const [staffPin, setStaffPin] = useState("");
  const [staffLoginError, setStaffLoginError] = useState("");
  const [staffLoginLoading, setStaffLoginLoading] = useState(false);
  // SumUp Solo integration
  const [showSumUpDialog, setShowSumUpDialog] = useState(false);
  const [sumUpStatus, setSumUpStatus] = useState<"idle" | "processing" | "success" | "declined" | "cancelled" | "error">("idle");
  const [sumUpReference, setSumUpReference] = useState("");
  const [sumUpCheckoutRef, setSumUpCheckoutRef] = useState("");
  const [sumUpCheckoutId, setSumUpCheckoutId] = useState("");
  const sumUpCheckoutRefReal = useRef("");
  const sumUpPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sumUpError, setSumUpError] = useState("");
  const [sumUpDeclineReason, setSumUpDeclineReason] = useState("");
  const [sumUpCardDetails, setSumUpCardDetails] = useState<{ last_four?: string; card_type?: string; auth_code?: string; entry_mode?: string } | null>(null);
  const [sumUpChargedAmount, setSumUpChargedAmount] = useState(0);
  const [happyHourCode, setHappyHourCode] = useState("");

  useEffect(() => {
    setMounted(true);
    
    // Load cached data from localStorage
    const cachedMenu = localStorage.getItem('pos_menu_items');
    const cachedCategories = localStorage.getItem('pos_categories');
    const cachedSettings = localStorage.getItem('pos_settings');
    
    if (cachedMenu) {
      try {
        setMenuItems(JSON.parse(cachedMenu));
      } catch { /* ignore */ }
    }
    if (cachedCategories) {
      try {
        setCategories(JSON.parse(cachedCategories));
      } catch { /* ignore */ }
    }
    if (cachedSettings) {
      try {
        setSettings(JSON.parse(cachedSettings));
      } catch { /* ignore */ }
    }
    
    // Check for pending offline orders
    const offlineQueue = localStorage.getItem('pos_offline_queue');
    if (offlineQueue) {
      try {
        const queue = JSON.parse(offlineQueue);
        setPendingSync(queue.length);
      } catch { /* ignore */ }
    }
    
    // Online/offline detection
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineOrders();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    // PIN inactivity timeout
    const resetInactivity = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      const timeoutMins = parseInt(localStorage.getItem('pos_pin_timeout') || '0');
      if (timeoutMins > 0) {
        inactivityTimer.current = setTimeout(async () => {
          await fetch("/api/staff/login", { method: "DELETE" });
          setCurrentStaff(null);
          toast.info("Auto logged out due to inactivity");
        }, timeoutMins * 60 * 1000);
      }
    };
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(e => window.addEventListener(e, resetInactivity));
    resetInactivity();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      activityEvents.forEach(e => window.removeEventListener(e, resetInactivity));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Escape") {
        if (showCheckout) { setShowCheckout(false); return; }
        if (showStaffLogin) { setShowStaffLogin(false); return; }
        if (showSumUpDialog && sumUpStatus !== "processing") { setShowSumUpDialog(false); return; }
        if (searchQuery) { setSearchQuery(""); return; }
      }
      if (e.key === "F2") {
        // F2 focuses search
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>("input[placeholder='Search items...']");
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showCheckout, showStaffLogin, showSumUpDialog, sumUpStatus, searchQuery]);

  const fetchData = useCallback(async () => {
    try {
      const [catRes, menuRes, setRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/menu"),
        fetch("/api/settings"),
      ]);
      const cats = await catRes.json();
      const items = await menuRes.json();
      const sets = await setRes.json();
      setCategories(cats);
      setMenuItems(items);
      setSettings(sets);
      setStaffLoginRequired(sets.staff_login_required === "1");
      
      // Cache in localStorage
      localStorage.setItem('pos_menu_items', JSON.stringify(items));
      localStorage.setItem('pos_categories', JSON.stringify(cats));
      localStorage.setItem('pos_settings', JSON.stringify(sets));

      // Check current staff
      if (sets.current_staff_id && sets.current_staff_name) {
        setCurrentStaff({
          id: parseInt(sets.current_staff_id),
          name: sets.current_staff_name,
          pin: "",
          role: "staff",
          is_manager: 0,
          active: 1,
          created_at: "",
        });
      }
    } catch (error) {
      // If fetch fails, we still have cached data
      console.log('Using cached data - offline mode');
    }
  }, []);

  // Sync offline orders when back online
  const syncOfflineOrders = useCallback(async () => {
    const offlineQueue = localStorage.getItem('pos_offline_queue');
    if (!offlineQueue) return;
    
    try {
      const queue = JSON.parse(offlineQueue);
      if (queue.length === 0) return;
      
      toast.info(`Syncing ${queue.length} offline orders...`);
      let successCount = 0;
      
      for (const order of queue) {
        try {
          const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(order),
          });
          if (res.ok) successCount++;
        } catch { /* ignore individual failures */ }
      }
      
      localStorage.removeItem('pos_offline_queue');
      setPendingSync(0);
      toast.success(`${successCount} orders synced successfully!`);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-apply happy hour discounts
  useEffect(() => {
    const checkHappyHour = async () => {
      try {
        const res = await fetch("/api/discounts");
        if (!res.ok) return;
        const codes = await res.json() as { code: string; is_happy_hour: number; happy_hour_start: string | null; happy_hour_end: string | null; active: number }[];
        const now = new Date().toTimeString().slice(0, 5);
        const active = codes.find(c =>
          c.active === 1 &&
          c.is_happy_hour === 1 &&
          c.happy_hour_start &&
          c.happy_hour_end &&
          now >= c.happy_hour_start &&
          now <= c.happy_hour_end
        );
        if (active && active.code !== happyHourCode) {
          setHappyHourCode(active.code);
          setDiscountCode(active.code);
          toast.info(`🎉 Happy Hour active! Code ${active.code} applied (${active.happy_hour_start}–${active.happy_hour_end})`);
        } else if (!active && happyHourCode) {
          setHappyHourCode("");
          if (discountCode === happyHourCode) {
            setDiscountCode("");
            setDiscount(0);
          }
        }
      } catch { /* ignore */ }
    };
    checkHappyHour();
    const interval = setInterval(checkHappyHour, 60000);
    return () => clearInterval(interval);
  }, [happyHourCode, discountCode]);

  const currency = settings?.currency_symbol || "£";
  const taxRate = parseFloat(settings?.tax_rate || "0") / 100;

  const filteredItems = searchQuery
    ? menuItems.filter(item => 
        item.available === 1 && 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : selectedCategory === null
      ? menuItems.filter(item => item.available === 1)
      : menuItems.filter(item => item.category_id === selectedCategory && item.available === 1);

  // Get top 6 most popular items for Quick Keys
  const quickKeyItems = menuItems
    .filter(item => item.available === 1)
    .slice(0, 6);

  const submitStaffPin = async () => {
    if (!staffPin) return;
    setStaffLoginLoading(true);
    setStaffLoginError("");
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: staffPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStaffLoginError("Invalid PIN — try again");
        setStaffPin("");
      } else {
        setCurrentStaff({ id: data.id, name: data.name, pin: "", role: data.role, is_manager: data.is_manager ? 1 : 0, active: 1, created_at: "" });
        setShowStaffLogin(false);
        setStaffPin("");
        setStaffLoginError("");
        toast.success(`Welcome, ${data.name}!`);
      }
    } catch {
      setStaffLoginError("Login failed");
    } finally {
      setStaffLoginLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    // Require staff login
    if (!currentStaff) {
      setShowStaffLogin(true);
      return;
    }
    // Check stock
    if (item.track_stock && item.stock_count <= 0) {
      toast.error(`${item.name} is out of stock`);
      return;
    }
    if (item.track_stock && item.stock_count <= item.low_stock_threshold) {
      toast.warning(`${item.name} is low on stock (${item.stock_count} remaining)`);
    }

    // Check if item has modifiers
    const itemModifiers: ModifierOption[] = (() => {
      try {
        return JSON.parse(item.modifiers || "[]") as ModifierOption[];
      } catch {
        return [];
      }
    })();

    if (itemModifiers.length > 0) {
      // Show modifier dialog first
      setModifierDialog({
        item,
        selectedModifiers: [],
      });
      return;
    }

    // No modifiers - add directly
    setCart((prev) => {
      const existing = prev.findIndex((c) => c.menu_item_id === item.id && c.notes === "" && c.modifiers.length === 0);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + 1 };
        return updated;
      }
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1, notes: "", modifiers: [] }];
    });
  };

  const addItemWithModifiers = () => {
    if (!modifierDialog) return;
    const { item, selectedModifiers } = modifierDialog;

    const totalPrice = item.price + selectedModifiers.reduce((sum, m) => sum + m.price, 0);

    setCart((prev) => {
      return [...prev, {
        menu_item_id: item.id,
        name: item.name,
        price: totalPrice,
        quantity: 1,
        notes: "",
        modifiers: selectedModifiers,
      }];
    });
    setModifierDialog(null);
  };

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) return;
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode, orderTotal: subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscount(data.discountAmount);
        setDiscountCodeError("");
        toast.success(`Discount applied: £${data.discountAmount.toFixed(2)} off`);
      } else {
        setDiscountCodeError(data.error);
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to validate code");
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: updated[index].quantity + delta };
      if (updated[index].quantity <= 0) {
        updated.splice(index, 1);
      }
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * taxRate;
  
  // Delivery fee for delivery orders
  const deliveryFeeEnabled = settings?.delivery_fee_enabled === "1" && orderType === "delivery";
  const deliveryFee = deliveryFeeEnabled ? parseFloat(settings?.delivery_fee_amount || "0") : 0;
  
  // Service charge for eat-in orders
  const serviceChargeEnabled = settings?.service_charge_enabled === "1" && orderType === "eat_in";
  const serviceChargeRate = serviceChargeEnabled ? parseFloat(settings?.service_charge_percent || "0") / 100 : 0;
  const serviceCharge = subtotal * serviceChargeRate;
  const loyaltyDiscount = (redeemPoints || 0) / 100;
  
  const total = subtotal + tax - discount + deliveryFee + serviceCharge - loyaltyDiscount + tipAmount;

  const clearOrder = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setOrderNotes("");
    setDiscount(0);
    setTipAmount(0);
    setPaymentMethod("cash");
    setOrderType("collection");
    setTableNumber("");
    setDeliveryAddress("");
    setModifierDialog(null);
    setCustomerLoyaltyPoints(0);
    setRedeemPoints(0);
    setSplitPayment(false);
    setCashAmount("");
    setCardAmount("");
    setCashTendered("");
  };

  const parkOrder = async () => {
    if (cart.length === 0) {
      toast.error("Cannot park empty order");
      return;
    }
    
    try {
      const res = await fetch("/api/parked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_name: `${customerName || 'Parked'} - ${cart.length} items`,
          customer_name: customerName,
          customer_phone: customerPhone,
          order_type: orderType,
          table_number: tableNumber,
          delivery_address: deliveryAddress,
          subtotal,
          tax,
          discount,
          delivery_fee: deliveryFee,
          service_charge: serviceCharge,
          total,
          notes: orderNotes,
          items: cart,
          split_payment: splitPayment,
          cash_amount: cashAmount,
          card_amount: cardAmount,
          discount_code: discountCode,
        }),
      });
      
      if (res.ok) {
        toast.success("Order parked successfully");
        clearOrder();
      } else {
        toast.error("Failed to park order");
      }
    } catch {
      toast.error("Failed to park order");
    }
  };

  const loadParkedOrder = (order: any) => {
    setCart(order.items);
    setCustomerName(order.customer_name);
    setCustomerPhone(order.customer_phone);
    setOrderType(order.order_type);
    setTableNumber(order.table_number);
    setDeliveryAddress(order.delivery_address);
    setOrderNotes(order.notes);
    setDiscount(order.discount || 0);
    if (order.split_payment) {
      setSplitPayment(true);
      setCashAmount(order.cash_amount || "");
      setCardAmount(order.card_amount || "");
    }
    if (order.discount_code) setDiscountCode(order.discount_code);
    setParkedOrdersDialog(false);
    toast.success("Order loaded");
  };

  const deleteParkedOrder = async (id: number) => {
    try {
      await fetch(`/api/parked?id=${id}`, { method: "DELETE" });
      setParkedOrders(parkedOrders.filter(o => o.id !== id));
      toast.success("Parked order deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const fetchParkedOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/parked");
      if (res.ok) {
        const data = await res.json();
        setParkedOrders(data);
      }
    } catch {
      // ignore
    }
  }, []);

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // Validate split amounts
    if (splitPayment) {
      const splitCash = parseFloat(cashAmount) || 0;
      const splitCard = parseFloat(cardAmount) || 0;
      if (splitCash <= 0 && splitCard <= 0) {
        toast.error("Enter cash and card amounts for split payment");
        return;
      }
      const splitTotal = parseFloat((splitCash + splitCard).toFixed(2));
      if (Math.abs(splitTotal - total) > 0.01) {
        toast.error(`Split amounts (£${splitTotal.toFixed(2)}) must equal order total (£${total.toFixed(2)})`);
        return;
      }
    }

    setLoading(true);

    const effectivePaymentMethod = splitPayment ? "split" : paymentMethod;
    
    const orderData = {
      customer_name: customerName,
      customer_phone: customerPhone,
      order_type: orderType,
      table_number: tableNumber,
      delivery_address: deliveryAddress,
      subtotal,
      tax,
      discount,
      delivery_fee: deliveryFee,
      service_charge: serviceCharge,
      tip: tipAmount,
      total,
      payment_method: effectivePaymentMethod,
      split_cash: splitPayment ? (parseFloat(cashAmount) || 0) : 0,
      split_card: splitPayment ? (parseFloat(cardAmount) || 0) : 0,
      discount_code: discountCode.trim() || null,
      transaction_code: sumUpCardDetails?.auth_code ? sumUpCheckoutRef : "",
      notes: orderNotes,
      items: cart,
      loyalty_points_redeemed: redeemPoints,
      loyalty_points_earned: Math.floor(subtotal),
    };
    
    // If offline, queue order for later sync
    if (!isOnline) {
      const queue = JSON.parse(localStorage.getItem('pos_offline_queue') || '[]');
      queue.push({ ...orderData, queued_at: new Date().toISOString() });
      localStorage.setItem('pos_offline_queue', JSON.stringify(queue));
      setPendingSync(queue.length);
      toast.success(`Order queued (${queue.length} pending) - will sync when online`);
      setCart([]);
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const order = await res.json();
      const pointsEarned = Math.floor(subtotal);
      const pointsMsg = customerPhone ? ` +${pointsEarned}★ points earned!` : '';
      toast.success(`Order #${order.order_number} placed!${pointsMsg}`);

      // Always send to kitchen printer if enabled (independent of receipt auto-print)
      if (settings?.kitchen_printer_enabled === "1") {
        try {
          await fetch("/api/print", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: order.id, type: "kitchen" }),
          });
        } catch {
          // Kitchen print failed - not critical
        }
      }

      // Auto-print receipt if enabled, OR always fetch receipt for card/SumUp payments
      const isCardPayment = paymentMethod === "sumup" || (splitPayment && parseFloat(cardAmount || "0") > 0);
      if (settings?.auto_print === "1" || isCardPayment) {
        try {
          const printRes = await fetch("/api/print", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: order.id }),
          });
          const printData = await printRes.json();
          if (printData.success) {
            toast.success("Receipt printed!");
          } else {
            setReceiptText(printData.receipt || "");
            setShowReceipt(true);
            if (settings?.auto_print === "1") toast.info(printData.message);
          }
        } catch {
          toast.error("Failed to print receipt");
        }
      }

      // Open cash drawer if enabled
      const drawerEnabled = settings?.cash_drawer_enabled === "1";
      const drawerOnCard = settings?.cash_drawer_on_card === "1";
      const shouldOpenDrawer = drawerEnabled && (paymentMethod === "cash" || splitPayment || (drawerOnCard && paymentMethod === "sumup"));
      
      if (shouldOpenDrawer) {
        try {
          await fetch("/api/printer/drawer", { method: "POST" });
        } catch {
          // Drawer open failed - not critical
        }
      }

      clearOrder();
      setShowCheckout(false);
    } catch {
      toast.error("Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  // Prevent hydration mismatch - don't render until mounted
  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Check if shop is closed
  if (settings?.shop_open === "0") {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Shop Closed</h2>
          <p className="text-muted-foreground">{settings?.shop_closed_message || "Sorry, we are currently closed."}</p>
          <p className="text-sm text-muted-foreground mt-4">
            Opening hours can be set in Settings → Opening Hours
          </p>
        </Card>
      </div>
    );
  }

  const lowStockItems = menuItems.filter(
    (i) => i.track_stock === 1 && i.stock_count >= 0 && i.stock_count <= 3 && i.available === 1
  );

  return (
    <div className="flex h-full">
      {/* Left: Menu Items */}
      <div className="flex-1 flex flex-col h-full">
        {/* Low stock banner */}
        {lowStockItems.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 flex-wrap">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-800">Low stock:</span>
            {lowStockItems.map((i) => (
              <span key={i.id} className="text-xs bg-amber-100 border border-amber-300 text-amber-800 rounded px-2 py-0.5 font-medium">
                {i.name} — {i.stock_count} left
              </span>
            ))}
          </div>
        )}
        {/* Search & Quick Actions */}
        <div className="border-b bg-card px-4 py-3 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Quick Keys Toggle */}
          {quickKeyItems.length > 0 && !searchQuery && (
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickKeys(!showQuickKeys)}
                className="text-xs"
              >
                <Zap className="h-3 w-3 mr-1" />
                {showQuickKeys ? "Hide" : "Show"} Quick Keys
              </Button>
            </div>
          )}

          {/* Quick Keys Grid */}
          {showQuickKeys && quickKeyItems.length > 0 && !searchQuery && (
            <div className="grid grid-cols-6 gap-2">
              {quickKeyItems.map((item, idx) => (
                <Button
                  key={item.id}
                  variant="secondary"
                  className="h-16 flex flex-col items-center justify-center p-2 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                  onClick={() => addToCart(item)}
                >
                  <span className="text-xs font-medium truncate w-full text-center">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{currency}{item.price.toFixed(2)}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Category tabs - Tablet optimized larger touch targets */}
          <ScrollArea className="w-full">
            <div className="flex gap-3 p-1">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                className={`rounded-full transition-all duration-200 h-12 px-6 text-base font-medium ${selectedCategory === null ? 'shadow-md' : 'hover:bg-muted'}`}
                onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
              >
                All Items
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  className={`rounded-full transition-all duration-200 h-12 px-6 text-base font-medium ${selectedCategory === cat.id ? 'shadow-md' : 'hover:bg-muted'}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  No categories yet. Go to Menu to add items.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Menu grid - Tablet optimized with larger touch targets */}
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer card-hover hover:ring-2 hover:ring-primary transition-all p-5 flex flex-col justify-between min-h-[120px] active:scale-95"
                onClick={() => addToCart(item)}
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-semibold text-base leading-tight">{item.name}</h3>
                    {item.track_stock === 1 && item.stock_count <= (item.low_stock_threshold || 5) && item.stock_count > 0 && (
                      <span className="shrink-0 text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-300 rounded px-1 py-0.5 leading-none">
                        {item.stock_count} left
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
                <p className="text-xl font-bold text-primary mt-3">
                  {currency}{item.price.toFixed(2)}
                </p>
              </Card>
            ))}
            {filteredItems.length === 0 && selectedCategory && (
              <p className="text-sm text-muted-foreground col-span-full py-8 text-center">
                No items in this category.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Cart */}
      <div className="w-96 border-l bg-card flex flex-col h-full">
        {/* Staff header - always visible */}
        <div className={`px-4 py-2 border-b ${currentStaff ? "bg-primary/5" : "bg-muted/50"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className={`h-4 w-4 ${currentStaff ? "text-primary" : "text-muted-foreground"}`} />
              {currentStaff ? (
                <span className="text-sm font-semibold text-primary">{currentStaff.name}</span>
              ) : (
                <button
                  className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 cursor-pointer"
                  onClick={() => setShowStaffLogin(true)}
                >
                  Not logged in — tap to login
                </button>
              )}
            </div>
            {currentStaff && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={async () => {
                  await fetch("/api/staff/login", { method: "DELETE" });
                  setCurrentStaff(null);
                  toast.success("Logged out");
                }}
              >
                <LogOut className="h-3 w-3 mr-1" />
                Logout
              </Button>
            )}
          </div>
        </div>

        {/* Order type toggle */}
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <Button
              variant={orderType === "collection" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setOrderType("collection")}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Collection
            </Button>
            <Button
              variant={orderType === "delivery" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setOrderType("delivery")}
            >
              <Truck className="h-4 w-4 mr-2" />
              Delivery
            </Button>
          </div>
          {settings?.table_service_enabled === "1" && (
            <div className="mt-2">
              <Button
                variant={orderType === "eat_in" ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={() => setOrderType("eat_in")}
              >
                <Utensils className="h-4 w-4 mr-2" />
                Eat In
              </Button>
              {orderType === "eat_in" && (
                <div className="mt-2">
                  <Label className="text-xs">Table Number</Label>
                  <Input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. 12, A5..."
                    className="h-8 mt-1"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart items */}
        <ScrollArea className="flex-1 px-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-muted-foreground gap-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <ShoppingCart className="h-7 w-7" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Cart is empty</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tap items on the left to add them</p>
              </div>
            </div>
          ) : (
            <div className="py-2 space-y-1">
              {cart.map((item, index) => (
                <div key={index} className="flex items-start gap-2 py-2.5 px-1 rounded-lg hover:bg-muted/30 border-b last:border-0 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {currency}{item.price.toFixed(2)}{item.quantity > 1 ? ` × ${item.quantity}` : ""}
                    </p>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="mt-0.5 space-y-0.5">
                        {item.modifiers.map((mod) => (
                          <p key={mod.id} className="text-xs text-emerald-500">
                            + {mod.name} ({currency}{mod.price.toFixed(2)})
                          </p>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-xs text-blue-400 mt-0.5 italic">"{item.notes}"</p>
                    )}
                    <button
                      className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground underline mt-0.5 transition-colors"
                      onClick={() => setItemNoteDialog({ index, note: item.notes })}
                    >
                      {item.notes ? "Edit note" : "+ Add note"}
                    </button>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <p className="text-base font-bold text-primary">
                      {currency}{(item.price * item.quantity).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(index, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(index, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 ml-0.5" onClick={() => removeFromCart(index)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Totals and checkout */}
        <div className="border-t p-4 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{currency}{subtotal.toFixed(2)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                <span>{currency}{tax.toFixed(2)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{currency}{discount.toFixed(2)}</span>
              </div>
            )}
            {deliveryFeeEnabled && deliveryFee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span>{currency}{deliveryFee.toFixed(2)}</span>
              </div>
            )}
            {serviceChargeEnabled && serviceCharge > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Service Charge ({settings?.service_charge_percent}%)</span>
                <span>{currency}{serviceCharge.toFixed(2)}</span>
              </div>
            )}
            {/* Loyalty Points Redeem */}
            {customerLoyaltyPoints >= 100 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-orange-400">★ Loyalty</span>
                  <input
                    type="number"
                    value={redeemPoints}
                    onChange={(e) => setRedeemPoints(Math.min(parseInt(e.target.value) || 0, customerLoyaltyPoints))}
                    min={0}
                    max={customerLoyaltyPoints}
                    step={100}
                    className="w-20 h-6 text-xs bg-transparent border rounded px-1 text-right"
                    placeholder="0"
                  />
                  <span className="text-xs text-muted-foreground">pts (100 = £1)</span>
                </div>
                {redeemPoints > 0 && (
                  <span className="text-orange-400">-{currency}{(redeemPoints / 100).toFixed(2)}</span>
                )}
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{currency}{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={clearOrder} disabled={cart.length === 0}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button variant="outline" className="flex-1" onClick={parkOrder} disabled={cart.length === 0}>
              <Pause className="h-4 w-4 mr-1" />
              Park
            </Button>
            <Button size="lg" className="flex-1 h-14 text-lg font-bold btn-glow bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary" onClick={() => { if (!currentStaff) { setShowStaffLogin(true); return; } setShowCheckout(true); if (happyHourCode && discount === 0) validateDiscountCode(); }} disabled={cart.length === 0}>
              <span className="mr-2">{currency}{total.toFixed(2)}</span> — Checkout
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              fetchParkedOrders();
              setParkedOrdersDialog(true);
            }}
          >
            <ShoppingBag className="h-4 w-4 mr-1" />
            View Parked Orders ({parkedOrders.length})
          </Button>
        </div>
      </div>

      {/* Staff PIN Login Dialog */}
      <Dialog open={showStaffLogin} onOpenChange={(open) => { setShowStaffLogin(open); setStaffPin(""); setStaffLoginError(""); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Staff Login
            </DialogTitle>
            <DialogDescription>Enter your PIN to continue</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-mono tracking-widest h-12 flex items-center justify-center border rounded-md bg-muted">
                {staffPin ? "•".repeat(staffPin.length) : <span className="text-muted-foreground text-sm">Enter PIN</span>}
              </div>
              {staffLoginError && <p className="text-sm text-destructive mt-2">{staffLoginError}</p>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["1","2","3","4","5","6","7","8","9","DEL","0","✓"].map((k) => (
                <Button
                  key={k}
                  variant={k === "✓" ? "default" : "outline"}
                  className={`h-12 text-lg font-semibold ${k === "✓" ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                  onClick={() => {
                    if (k === "DEL") { setStaffPin(p => p.slice(0, -1)); return; }
                    if (k === "✓") { submitStaffPin(); return; }
                    if (staffPin.length < 6) setStaffPin(p => p + k);
                  }}
                  disabled={staffLoginLoading}
                >
                  {staffLoginLoading && k === "✓" ? <Loader2 className="h-4 w-4 animate-spin" /> : k}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Customer Name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  onBlur={async () => {
                    if (customerPhone.length >= 6) {
                      try {
                        const res = await fetch(`/api/customers?phone=${encodeURIComponent(customerPhone)}`);
                        const customer = await res.json();
                        if (customer && customer.id) {
                          if (!customerName) setCustomerName(customer.name || "");
                          setCustomerLoyaltyPoints(customer.loyalty_points || 0);
                          if (orderType === "delivery" && !deliveryAddress && customer.address) {
                            setDeliveryAddress(customer.address);
                            toast.info(`Address autofilled for ${customer.name}`);
                          }
                        } else {
                          setCustomerLoyaltyPoints(0);
                        }
                      } catch {
                        setCustomerLoyaltyPoints(0);
                      }
                    }
                  }}
                  placeholder="Optional"
                />
                {customerLoyaltyPoints > 0 && (
                  <p className="text-xs text-green-400 mt-1">
                    ★ {customerLoyaltyPoints} points available
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Order Type</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={orderType === "collection" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => { setOrderType("collection"); setTableNumber(""); }}
                >
                  <ShoppingBag className="h-4 w-4 mr-1" />
                  Collection
                </Button>
                <Button
                  variant={orderType === "delivery" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => { setOrderType("delivery"); setTableNumber(""); }}
                >
                  <Truck className="h-4 w-4 mr-1" />
                  Delivery
                </Button>
                {settings?.table_service_enabled === "1" && (
                  <Button
                    variant={orderType === "eat_in" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => { setOrderType("eat_in"); setDeliveryAddress(""); }}
                  >
                    <Utensils className="h-4 w-4 mr-1" />
                    Eat In
                  </Button>
                )}
              </div>
              {orderType === "eat_in" && (
                <div className="mt-2">
                  <Label>Table Number</Label>
                  <Input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. 12, A5..."
                  />
                </div>
              )}
              {orderType === "delivery" && (
                <div className="mt-2">
                  <Label>Delivery Address <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House number, street, postcode..."
                    rows={3}
                    className={!deliveryAddress.trim() ? "border-orange-300" : ""}
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Payment Method</Label>
              {splitPayment ? (
                <div className="mt-1 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Cash {currency}{parseFloat(cashAmount||"0").toFixed(2)} + Card {currency}{parseFloat(cardAmount||"0").toFixed(2)} via SumUp reader
                </div>
              ) : (
              <div className="flex gap-2 mt-1">
                <Button
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  className="flex-1 h-14 text-base font-semibold"
                  onClick={() => setPaymentMethod("cash")}
                >
                  <Banknote className="h-5 w-5 mr-2" />
                  Cash
                </Button>
                <Button
                  variant={paymentMethod === "sumup" ? "default" : "outline"}
                  className="flex-1 h-14 text-base font-semibold"
                  onClick={() => setPaymentMethod("sumup")}
                >
                  <Smartphone className="h-5 w-5 mr-2" />
                  Card (SumUp)
                </Button>
              </div>
              )}
            </div>

            {/* Cash Change Calculator */}
            {paymentMethod === "cash" && !splitPayment && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Banknote className="h-4 w-4" />
                  Cash Tendered
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={`${currency}${total.toFixed(2)}`}
                    className="h-10 text-lg font-mono"
                  />
                  <div className="flex gap-1">
                    {[Math.ceil(total), Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, Math.ceil(total / 20) * 20].filter((v, i, arr) => arr.indexOf(v) === i && v >= total).slice(0, 3).map((amt) => (
                      <Button key={amt} size="sm" variant="outline" className="h-10 px-2 text-xs font-mono" onClick={() => setCashTendered(amt.toFixed(2))}>
                        £{amt}
                      </Button>
                    ))}
                  </div>
                </div>
                {cashTendered && parseFloat(cashTendered) >= total && (
                  <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-md px-3 py-2">
                    <span className="text-sm font-medium text-green-600">Change due</span>
                    <span className="text-2xl font-bold text-green-600 font-mono">{currency}{(parseFloat(cashTendered) - total).toFixed(2)}</span>
                  </div>
                )}
                {cashTendered && parseFloat(cashTendered) < total && (
                  <p className="text-xs text-red-500">{currency}{(total - parseFloat(cashTendered)).toFixed(2)} still needed</p>
                )}
              </div>
            )}

            {/* Discount Code */}
            <div>
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Discount Code
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={discountCode}
                  onChange={(e) => {
                    setDiscountCode(e.target.value);
                    setDiscountCodeError("");
                  }}
                  placeholder="Enter code..."
                  className={discountCodeError ? "border-red-500" : ""}
                />
                <Button
                  variant="outline"
                  onClick={validateDiscountCode}
                  disabled={!discountCode.trim()}
                >
                  Apply
                </Button>
              </div>
              {discountCodeError && (
                <p className="text-xs text-red-500 mt-1">{discountCodeError}</p>
              )}
              {discount > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Discount applied: -{currency}{discount.toFixed(2)}
                </p>
              )}
            </div>

            {/* Split Payment */}
            <div className="flex items-center gap-2">
              <Switch
                checked={splitPayment}
                onCheckedChange={(checked) => {
                  setSplitPayment(checked);
                  if (!checked) {
                    setCashAmount("");
                    setCardAmount("");
                  }
                }}
              />
              <Label>Split Payment (Cash + Card)</Label>
            </div>

            {splitPayment && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Cash Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cashAmount}
                      onChange={(e) => {
                        const cash = parseFloat(e.target.value) || 0;
                        setCashAmount(e.target.value);
                        setCardAmount(parseFloat(Math.max(0, total - cash).toFixed(2)).toString());
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Card Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cardAmount}
                      onChange={(e) => {
                        const card = parseFloat(e.target.value) || 0;
                        setCardAmount(e.target.value);
                        setCashAmount(parseFloat(Math.max(0, total - card).toFixed(2)).toString());
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {(() => {
                  const splitCash = parseFloat(cashAmount) || 0;
                  const splitCard = parseFloat(cardAmount) || 0;
                  const splitTotal = parseFloat((splitCash + splitCard).toFixed(2));
                  const diff = parseFloat((total - splitTotal).toFixed(2));
                  return diff !== 0 ? (
                    <p className={`text-xs font-medium ${diff > 0 ? "text-amber-600" : "text-destructive"}`}>
                      {diff > 0 ? `£${diff.toFixed(2)} still unallocated` : `£${Math.abs(diff).toFixed(2)} over total`}
                    </p>
                  ) : (
                    <p className="text-xs text-green-600 font-medium">✓ Amounts balance</p>
                  );
                })()}
              </div>
            )}

            <div>
              <Label>Order Notes</Label>
              <Textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Any special instructions..."
                rows={2}
              />
            </div>

            {settings?.tips_enabled === "1" && (
              <div className="space-y-2">
                <Label>Add a Tip</Label>
                <div className="flex gap-2">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <Button
                      key={pct}
                      size="sm"
                      variant={tipAmount === (pct === 0 ? 0 : parseFloat(((subtotal + tax + serviceCharge) * pct / 100).toFixed(2))) ? "default" : "outline"}
                      className="flex-1 text-xs"
                      onClick={() => setTipAmount(pct === 0 ? 0 : parseFloat(((subtotal + tax + serviceCharge) * pct / 100).toFixed(2)))}
                    >
                      {pct === 0 ? "None" : `${pct}%`}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Custom:</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.50"
                    value={tipAmount || ""}
                    onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="h-8 w-28"
                  />
                  {tipAmount > 0 && <span className="text-sm font-medium text-green-600">+{currency}{tipAmount.toFixed(2)}</span>}
                </div>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-xl font-bold">
              <span>Total{tipAmount > 0 ? ` (inc. ${currency}${tipAmount.toFixed(2)} tip)` : ""}</span>
              <span>{currency}{total.toFixed(2)}</span>
            </div>

            <div className="text-sm text-muted-foreground">
              {cart.length} item{cart.length !== 1 ? "s" : ""} | {orderType === "eat_in" ? `Table ${tableNumber || "—"}` : orderType === "collection" ? "Collection" : "Delivery"} | {splitPayment ? `Cash £${parseFloat(cashAmount || "0").toFixed(2)} + Card £${parseFloat(cardAmount || "0").toFixed(2)}` : paymentMethod === "sumup" ? "CARD (SUMUP)" : paymentMethod.toUpperCase()}
              {currentStaff && ` | Staff: ${currentStaff.name}`}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={async () => {
                if (orderType === "delivery" && !deliveryAddress.trim()) {
                  toast.error("Please enter a delivery address");
                  return;
                }
                const cardCharge = splitPayment ? (parseFloat(cardAmount) || 0) : 0;
                const shouldUseSumUp = splitPayment
                  ? cardCharge > 0  // split: charge card portion via SumUp
                  : paymentMethod === "sumup"; // full card payment
                if (shouldUseSumUp) {
                  setSumUpCardDetails(null);
                  setSumUpError("");
                  setSumUpDeclineReason("");
                  setSumUpStatus("processing");
                  setShowSumUpDialog(true);
                  setShowCheckout(false);
                  const ref = `SUP-${Date.now().toString(36).toUpperCase()}`;
                  setSumUpReference(ref);
                  const chargeAmount = splitPayment ? cardCharge.toFixed(2) : total.toFixed(2);
                  setSumUpChargedAmount(parseFloat(chargeAmount));
                  try {
                    const res = await fetch("/api/sumup/payment", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ amount: chargeAmount, description: `${settings?.shop_name || "Order"} - ${customerName || orderType}${splitPayment ? ` (card portion)` : ""} - ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`, checkout_reference: ref }),
                    });
                    const data = await res.json();
                    if (!data.success) {
                      setSumUpError(data.error || "Failed to connect to SumUp");
                      setSumUpStatus("error");
                      return;
                    }
                    setSumUpCheckoutRef(data.checkout_reference);
                    sumUpCheckoutRefReal.current = data.checkout_reference;
                    setSumUpCheckoutId(data.checkout_id || "");
                    let unknownCount = 0;
                    const checkoutId = data.checkout_id || data.checkout_reference;
                    if (sumUpPollRef.current) clearInterval(sumUpPollRef.current);
                    sumUpPollRef.current = setInterval(async () => {
                      const statusRes = await fetch(`/api/sumup/payment?checkout_id=${checkoutId}`);
                      const statusData = await statusRes.json();
                      console.log("SumUp status poll:", statusData.status, statusData);
                      if (statusData.status === "PAID") {
                        clearInterval(sumUpPollRef.current!); sumUpPollRef.current = null;
                        setSumUpCardDetails({
                          last_four: statusData.card_last_four,
                          card_type: statusData.card_type,
                          auth_code: statusData.auth_code,
                          entry_mode: statusData.entry_mode,
                        });
                        setSumUpStatus("success");
                      } else if (statusData.status === "FAILED" || statusData.status === "DECLINED") {
                        clearInterval(sumUpPollRef.current!); sumUpPollRef.current = null;
                        const reason = statusData.decline_reason || statusData.error_code || "Card was declined";
                        setSumUpDeclineReason(reason);
                        setSumUpStatus("declined");
                      } else if (statusData.status === "CANCELLED") {
                        clearInterval(sumUpPollRef.current!); sumUpPollRef.current = null;
                        setSumUpStatus("cancelled");
                      } else if (statusData.status === "ERROR") {
                        clearInterval(sumUpPollRef.current!); sumUpPollRef.current = null;
                        setSumUpDeclineReason(statusData.decline_reason || statusData.error_code || "Payment error");
                        setSumUpStatus("error");
                      } else if (statusData.status === "UNKNOWN") {
                        unknownCount++;
                        if (unknownCount > 10) {
                          clearInterval(sumUpPollRef.current!); sumUpPollRef.current = null;
                          setSumUpDeclineReason("Cannot check payment status. Try again or use different payment.");
                          setSumUpStatus("error");
                        }
                      }
                    }, 2000);
                    setTimeout(() => { if (sumUpPollRef.current) { clearInterval(sumUpPollRef.current); sumUpPollRef.current = null; } }, 300000);
                  } catch {
                    setSumUpError("Network error. Check SumUp configuration.");
                    setSumUpStatus("error");
                  }
                  return;
                }
                placeOrder();
              }}
              disabled={loading || (splitPayment && parseFloat((parseFloat(cashAmount||"0")+parseFloat(cardAmount||"0")).toFixed(2)) !== parseFloat(total.toFixed(2)))}
              className="min-w-[180px] h-12 text-lg font-bold"
            >
              {loading ? "Placing..."
                : splitPayment
                  ? parseFloat((parseFloat(cashAmount||"0")+parseFloat(cardAmount||"0")).toFixed(2)) !== parseFloat(total.toFixed(2))
                    ? "Balance Split First"
                    : parseFloat(cardAmount||"0") > 0
                      ? `Charge ${currency}${parseFloat(cardAmount).toFixed(2)} to Card`
                      : "Place Order"
                  : paymentMethod === "sumup"
                    ? `Pay ${currency}${total.toFixed(2)} by Card`
                    : "Place Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Note Dialog */}
      <Dialog open={!!itemNoteDialog} onOpenChange={() => setItemNoteDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Item Note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={itemNoteDialog?.note ?? ""}
            onChange={(e) => setItemNoteDialog((prev) => prev ? { ...prev, note: e.target.value } : null)}
            placeholder="e.g. No onions, extra spicy..."
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setItemNoteDialog(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (itemNoteDialog !== null) {
                  setCart((prev) => {
                    const updated = [...prev];
                    updated[itemNoteDialog.index] = { ...updated[itemNoteDialog.index], notes: itemNoteDialog.note };
                    return updated;
                  });
                  setItemNoteDialog(null);
                }
              }}
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SumUp Solo Payment Dialog */}
      <Dialog open={showSumUpDialog} onOpenChange={(open) => {
        if (!open) {
          if (sumUpStatus === "processing") return; // block close while waiting
          setShowSumUpDialog(false);
          setSumUpStatus("idle");
          setSumUpDeclineReason("");
          setSumUpError("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              SumUp Solo Payment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">

            {sumUpStatus === "processing" && (
              <div className="text-center space-y-4">
                <div className="animate-pulse">
                  <Smartphone className="h-16 w-16 mx-auto text-primary" />
                </div>
                <div className="text-3xl font-bold">{currency}{sumUpChargedAmount.toFixed(2)}</div>
                {splitPayment && <p className="text-xs text-muted-foreground">Card portion of {currency}{total.toFixed(2)} total</p>}
                <p className="text-lg font-medium">Sent to SumUp Solo...</p>
                <p className="text-xs text-muted-foreground">Customer taps card on device</p>
                {sumUpError && <p className="text-sm text-red-500">{sumUpError}</p>}
              </div>
            )}

            {sumUpStatus === "success" && (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold">{currency}{sumUpChargedAmount.toFixed(2)}</p>
                {splitPayment && <p className="text-xs text-muted-foreground">Card portion — cash {currency}{parseFloat(cashAmount||"0").toFixed(2)} collected separately</p>}
                <p className="text-lg font-medium text-green-600">Payment Successful!</p>
                {sumUpCardDetails?.last_four && (
                  <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                    <p className="font-medium">{sumUpCardDetails.card_type || "Card"} •••• {sumUpCardDetails.last_four}</p>
                    {sumUpCardDetails.entry_mode && (
                      <p className="text-xs text-muted-foreground capitalize">{sumUpCardDetails.entry_mode.toLowerCase().replace(/_/g, " ")}</p>
                    )}
                    {sumUpCardDetails.auth_code && (
                      <p className="text-xs text-muted-foreground">Auth: {sumUpCardDetails.auth_code}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {sumUpStatus === "declined" && (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-lg font-medium text-red-600">Card Declined</p>
                <p className="text-sm text-red-500 font-medium">{sumUpDeclineReason || "Card was declined by the bank"}</p>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <p className="text-xs text-amber-800">Customer should try a different card or payment method</p>
                </div>
              </div>
            )}

            {sumUpStatus === "cancelled" && (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-lg font-medium text-gray-600">Payment Cancelled</p>
                <p className="text-sm text-muted-foreground">Cancelled on the SumUp device</p>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <p className="text-xs text-amber-800">Customer pressed cancel on the reader — tap Try Again to re-send to the device</p>
                </div>
              </div>
            )}

            {sumUpStatus === "error" && (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-lg font-medium text-red-600">Payment Error</p>
                <p className="text-sm text-red-500 font-medium">{sumUpDeclineReason || "An error occurred"}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">

            {sumUpStatus === "processing" && (
              <Button variant="outline" onClick={async (e) => {
                const btn = e.currentTarget;
                btn.disabled = true;
                btn.textContent = "Cancelling...";
                // Stop polling immediately so it doesn't overwrite cancelled state
                if (sumUpPollRef.current) { clearInterval(sumUpPollRef.current); sumUpPollRef.current = null; }
                const ref = sumUpCheckoutRefReal.current || sumUpCheckoutRef;
                if (ref) {
                  try {
                    await fetch("/api/sumup/cancel", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ checkout_reference: ref }),
                    });
                  } catch {
                    // Ignore errors, just reset UI
                  }
                }
                setSumUpStatus("cancelled");
              }}>
                Cancel Payment
              </Button>
            )}

            {sumUpStatus === "success" && (
              <>
                <Button variant="outline" onClick={() => {
                  setSumUpStatus("idle");
                  setShowSumUpDialog(false);
                }}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setSumUpStatus("idle");
                    setShowSumUpDialog(false);
                    // Place order with SumUp payment method
                    placeOrder();
                  }}
                >
                  Complete Order
                </Button>
              </>
            )}

            {(sumUpStatus === "declined" || sumUpStatus === "cancelled" || sumUpStatus === "error") && (
              <>
                <Button variant="outline" onClick={() => setShowSumUpDialog(false)}>
                  Cancel Order
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowSumUpDialog(false);
                  setPaymentMethod("cash");
                }}>
                  Switch to Cash
                </Button>
                <Button onClick={() => {
                  setSumUpDeclineReason("");
                  setSumUpStatus("processing");
                  setShowSumUpDialog(true);
                  const ref = `SUP-${Date.now().toString(36).toUpperCase()}`;
                  setSumUpReference(ref);
                  setSumUpError("");
                  const retryAmount = sumUpChargedAmount > 0 ? sumUpChargedAmount.toFixed(2) : total.toFixed(2);
                  fetch("/api/sumup/payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount: retryAmount, description: `${settings?.shop_name || "Order"} - ${customerName || orderType}${splitPayment ? " (card portion)" : ""} - ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`, checkout_reference: ref }),
                  }).then(r => r.json()).then(data => {
                    if (!data.success) { setSumUpError(data.error || "Failed"); setSumUpStatus("error"); return; }
                    setSumUpCheckoutRef(data.checkout_reference);
                    sumUpCheckoutRefReal.current = data.checkout_reference;
                    setSumUpCheckoutId(data.checkout_id || "");
                    let unknownCount = 0;
                    const checkoutId = data.checkout_id || data.checkout_reference;
                    if (sumUpPollRef.current) clearInterval(sumUpPollRef.current);
                    sumUpPollRef.current = setInterval(async () => {
                      const statusRes = await fetch(`/api/sumup/payment?checkout_id=${checkoutId}`);
                      const statusData = await statusRes.json();
                      console.log("SumUp status poll:", statusData.status, statusData);
                      if (statusData.status === "PAID") { clearInterval(sumUpPollRef.current!); sumUpPollRef.current = null; setSumUpStatus("success"); }
                      else if (statusData.status === "FAILED" || statusData.status === "DECLINED") { clearInterval(sumUpPollRef.current!); sumUpPollRef.current = null; setSumUpDeclineReason(statusData.decline_reason || statusData.error_code || "Card was declined"); setSumUpStatus("declined"); }
                      else if (statusData.status === "CANCELLED") { clearInterval(sumUpPollRef.current!); sumUpPollRef.current = null; setSumUpStatus("cancelled"); }
                      else if (statusData.status === "ERROR") { clearInterval(sumUpPollRef.current!); sumUpPollRef.current = null; setSumUpDeclineReason(statusData.decline_reason || "Payment error"); setSumUpStatus("error"); }
                      else if (statusData.status === "UNKNOWN") { unknownCount++; if (unknownCount > 10) { clearInterval(sumUpPollRef.current!); sumUpPollRef.current = null; setSumUpDeclineReason("Cannot check payment status."); setSumUpStatus("error"); } }
                    }, 2000);
                    setTimeout(() => { if (sumUpPollRef.current) { clearInterval(sumUpPollRef.current); sumUpPollRef.current = null; } }, 300000);
                  }).catch(() => { setSumUpError("Network error."); setSumUpStatus("error"); });
                }}>
                  Try Again
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modifier Selection Dialog */}
      <Dialog open={!!modifierDialog} onOpenChange={() => setModifierDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{modifierDialog?.item.name}</DialogTitle>
            <DialogDescription>
              Select extras for this item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {(() => {
              try {
                return JSON.parse(modifierDialog?.item.modifiers || "[]") as ModifierOption[];
              } catch {
                return [];
              }
            })().map((mod) => {
              const selected = modifierDialog?.selectedModifiers.some((m) => m.id === mod.id) ?? false;
              return (
                <div
                  key={mod.id}
                  className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer transition-colors ${
                    selected ? "border-primary bg-primary/5" : "hover:bg-muted"
                  }`}
                  onClick={() => {
                    if (!modifierDialog) return;
                    const updated = selected
                      ? modifierDialog.selectedModifiers.filter((m) => m.id !== mod.id)
                      : [...modifierDialog.selectedModifiers, mod];
                    setModifierDialog({ ...modifierDialog, selectedModifiers: updated });
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-sm border ${selected ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                      {selected && (
                        <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium">{mod.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    +{currency}{mod.price.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center text-sm font-medium py-2">
            <span>Total:</span>
            <span>{currency}{((modifierDialog?.item.price || 0) + (modifierDialog?.selectedModifiers.reduce((s, m) => s + m.price, 0) || 0)).toFixed(2)}</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModifierDialog(null)}>
              Cancel
            </Button>
            <Button onClick={addItemWithModifiers}>
              Add to Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Receipt Preview
            </DialogTitle>
          </DialogHeader>
          <pre className="bg-muted p-4 rounded-lg text-xs font-mono whitespace-pre overflow-x-auto max-h-96">
            {receiptText}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceipt(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Parked Orders Dialog */}
      <Dialog open={parkedOrdersDialog} onOpenChange={setParkedOrdersDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Parked Orders</DialogTitle>
            <DialogDescription>
              Saved orders that can be recalled later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {parkedOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No parked orders
              </div>
            ) : (
              parkedOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{order.order_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer_name || "No customer"} • {order.order_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items?.length || 0} items • Total: {currency}{order.total?.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => loadParkedOrder(order)}>
                        Load
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteParkedOrder(order.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
