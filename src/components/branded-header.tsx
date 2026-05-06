"use client";

import { Settings } from "@/lib/types";

export function BrandedHeader({ settings }: { settings: Settings | null }) {
  const shopName = settings?.shop_name || "My Takeaway";
  const logoUrl = settings?.logo_url;

  return (
    <div className="flex items-center gap-3">
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt={shopName}
          className="h-10 w-auto object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
          {shopName.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <h1 className="font-bold text-lg leading-tight">{shopName}</h1>
        <p className="text-xs text-muted-foreground">POS System</p>
      </div>
    </div>
  );
}
