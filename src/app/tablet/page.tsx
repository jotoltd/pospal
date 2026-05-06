"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TillScreen from "@/components/till-screen";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TabletTillPage() {
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
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      {/* Tablet header - minimal */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
        <Link href="/">
          <Button variant="ghost" size="sm" className="h-10 px-3">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="font-semibold text-lg">Tablet Till</h1>
        <div className="w-16" /> {/* Spacer for balance */}
      </header>
      
      {/* Full screen till */}
      <main className="flex-1 overflow-hidden">
        <TillScreen />
      </main>
    </div>
  );
}
