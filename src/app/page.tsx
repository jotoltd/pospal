"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarNav from "@/components/sidebar-nav";
import TillScreen from "@/components/till-screen";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((data) => {
        if (!data.setup_complete) {
          router.replace("/setup");
        } else {
          setReady(true);
        }
      })
      .catch(() => setReady(true));
  }, [router]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-hidden">
        <TillScreen />
      </main>
    </div>
  );
}
