"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ShoppingCart,
  UtensilsCrossed,
  ClipboardList,
  BarChart3,
  Settings,
  Printer,
  Users,
  TrendingUp,
  UserCircle,
  Tag,
  LayoutDashboard,
  Tablet,
  FileText,
  Clock,
  ChefHat,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Settings as SettingsType } from "@/lib/types";
import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/", label: "Till", icon: LayoutDashboard },
  { href: "/dashboard", label: "Live", icon: BarChart3 },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/kitchen", label: "Kitchen", icon: ChefHat },
  { href: "/customers", label: "Customers", icon: UserCircle },
  { href: "/discounts", label: "Discounts", icon: Tag },
  { href: "/reports", label: "Reports", icon: TrendingUp },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/timesheets", label: "Timesheets", icon: Clock },
  { href: "/zreport", label: "Z-Report", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [shopName, setShopName] = useState("POS");
  const [logoUrl, setLogoUrl] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?status=pending");
      const data = await res.json();
      setPendingCount(Array.isArray(data) ? data.length : 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setShopName(data.shop_name || "POS");
        setLogoUrl(data.logo_url || "");
      })
      .catch(() => { /* ignore */ });
    fetchPending();
    const interval = setInterval(fetchPending, 15000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  return (
    <aside className="flex h-screen w-20 flex-col items-center border-r border-white/10 bg-[#0B1120] py-5 gap-2">
      <div className="mb-5 flex flex-col items-center">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={shopName}
            className="h-11 w-11 object-contain rounded-xl ring-2 ring-white/10"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold text-lg shadow-lg shadow-orange-500/25">
            {shopName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-[10px] font-medium text-slate-400 mt-2 truncate max-w-16 text-center">
          {shopName.length > 6 ? shopName.slice(0, 6) + "..." : shopName}
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-16 rounded-2xl text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground hover:scale-105"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                {(item.href === "/orders" || item.href === "/kitchen") && pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-none mt-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {[{ href: "/settings#printer", label: "Print", icon: Printer }, { href: "/tablet", label: "Tablet", icon: Tablet }].map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-col items-center justify-center w-16 h-16 rounded-2xl text-xs font-medium transition-all duration-200",
            pathname === href
              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
              : "text-muted-foreground hover:bg-accent hover:text-foreground hover:scale-105"
          )}
        >
          <Icon className="h-5 w-5 mb-1.5" />
          <span className="text-[10px] leading-none">{label}</span>
        </Link>
      ))}
      <button
        onClick={signOut}
        className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl text-xs font-medium transition-all duration-200 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 hover:scale-105 mt-1"
        title="Sign out"
      >
        <LogOut className="h-5 w-5 mb-1.5" />
        <span className="text-[10px] leading-none">Sign out</span>
      </button>
    </aside>
  );
}
