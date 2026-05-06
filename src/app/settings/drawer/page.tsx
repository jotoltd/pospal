"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Zap, Info, AlertTriangle, CheckCircle, Printer } from "lucide-react";

type DrawerResult = {
  type: string;
  command: string;
  success: boolean;
  message: string;
};

type Diagnostics = {
  detectedPrinters: string[];
  diagnostics: string[];
  drawerCommands: Record<string, string>;
  instructions: string[];
  setup: string[];
};

export default function DrawerDiagnosticsPage() {
  const [status, setStatus] = useState<Diagnostics | null>(null);
  const [results, setResults] = useState<DrawerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/printer/drawer");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const testDrawer = async (drawerType: string) => {
    setTesting(true);
    try {
      const res = await fetch("/api/printer/drawer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawer: drawerType }),
      });
      const data = await res.json();
      setResults(prev => [...prev, {
        type: drawerType,
        command: data.command,
        success: data.success,
        message: data.message,
      }]);
    } catch (err) {
      setResults(prev => [...prev, {
        type: drawerType,
        command: "N/A",
        success: false,
        message: String(err),
      }]);
    }
    setTesting(false);
  };

  const drawerTypes = [
    { key: "drawer1_pin2", label: "Drawer 1 (Pin 2)", desc: "Most common - try this first" },
    { key: "drawer1_pin2_alt", label: "Drawer 1 Alt Timing", desc: "Same pin, different pulse" },
    { key: "drawer2_pin5", label: "Drawer 2 (Pin 5)", desc: "Second drawer port" },
    { key: "drawer2_pin5_alt", label: "Drawer 2 Alt Timing", desc: "Pin 5 with different pulse" },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Cash Drawer Diagnostics</h1>
      </div>

      {/* Printer Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Printer Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-muted-foreground">Detecting printers...</div>
          ) : status ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Detected Printers:</p>
                {status.detectedPrinters.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {status.detectedPrinters.map(p => (
                      <Badge key={p} variant="default">{p}</Badge>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">No printers detected</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Diagnostics:</p>
                <div className="space-y-1">
                  {status.diagnostics.map((d, i) => (
                    <p key={i} className="text-xs text-muted-foreground font-mono">{d}</p>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-red-500">Failed to load diagnostics</div>
          )}
        </CardContent>
      </Card>

      {/* Test Drawer Commands */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Test Drawer Commands
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Try each command below. If your drawer opens, note which one works and use that setting.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {drawerTypes.map(({ key, label, desc }) => (
              <Button
                key={key}
                variant="outline"
                className="h-auto py-4 flex flex-col items-start text-left"
                onClick={() => testDrawer(key)}
                disabled={testing || !status?.detectedPrinters.length}
              >
                <span className="font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </Button>
            ))}
          </div>

          {!status?.detectedPrinters.length && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <Info className="h-4 w-4" />
              No printers detected - commands will be saved to /tmp/open-drawer.bin for debugging
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                {r.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm">{r.type}</p>
                  <p className="text-xs text-muted-foreground font-mono break-all">{r.command}</p>
                  <p className={`text-sm mt-1 ${r.success ? "text-green-600" : "text-amber-600"}`}>
                    {r.message}
                  </p>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setResults([])}>
              Clear Results
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>1.</strong> Connect drawer cable to printer&apos;s RJ11/RJ12 port (labeled &quot;DK&quot; or &quot;Cash Drawer&quot;)</p>
            <p><strong>2.</strong> Set your receipt printer as default in CUPS:</p>
            <code className="block bg-muted p-2 rounded text-xs font-mono">lpoptions -d PRINTER_NAME</code>
            <p><strong>3.</strong> Verify printer is detected:</p>
            <code className="block bg-muted p-2 rounded text-xs font-mono">lpstat -p</code>
            <p><strong>4.</strong> If printer shows above, test each drawer command until one works</p>
            <p><strong>5.</strong> Most common: <strong>Drawer 1 (Pin 2)</strong></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
