import { NextRequest, NextResponse } from "next/server";
import { getVenueId } from "@/lib/supabase/api-helpers";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

interface SettingRow {
  key: string;
  value: string;
}

interface OrderRow {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  delivery_fee: number;
  service_charge: number;
  tip: number;
  split_cash: number;
  split_card: number;
  total: number;
  payment_method: string;
  discount_code: string;
  notes: string;
  created_at: string;
  staff_name: string | null;
}

interface OrderItemRow {
  name: string;
  quantity: number;
  price: number;
  notes: string;
  modifiers: string; // JSON string of {id:string,name:string,price:number}[]
}

// ESC/POS command to open cash drawer
const CASH_DRAWER_COMMAND = "\x1B\x70\x00\x19\xFA"; // ESC p 0 25 250

// Cut commands for different printer brands
const CUT_COMMANDS = {
  epson: "\x1D\x56\x01",     // GS V 1 - Partial cut
  star: "\x1B\x64\x00",      // ESC d 0 - Star cut (works on most Star models)
  generic: "\x1D\x56\x01",   // GS V 1 - Generic ESC/POS
};

function getCutCommand(brand: string): string {
  return CUT_COMMANDS[brand as keyof typeof CUT_COMMANDS] || CUT_COMMANDS.generic;
}

function getPrintOptions(brand: string): string {
  if (brand === "star") {
    // Star TSP143: use 80mm x 2000mm page for auto-cut at end of content
    return '-o PageSize=X80MMY2000MM -o DocCutType=2FullCutDoc';
  }
  return '';
}

function buildKitchenTicket(order: OrderRow, items: OrderItemRow[], settings: Record<string, string>): string {
  const width = parseInt(settings.printer_width || "25");
  const isEatIn = order.order_type === "eat_in";

  function center(text: string): string {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(pad) + text;
  }

  function separator(): string {
    return "=".repeat(width);
  }

  const lines: string[] = [];
  lines.push(separator());
  lines.push(center("KITCHEN ORDER"));
  lines.push(separator());
  lines.push(`Order #: ${order.order_number}`);

  if (isEatIn && (order as unknown as { table_number: string }).table_number) {
    lines.push(`TABLE: ${(order as unknown as { table_number: string }).table_number}`);
  } else {
    lines.push(`Type: ${order.order_type.toUpperCase()}`);
  }

  if ((order as unknown as { staff_name: string }).staff_name) {
    lines.push(`Server: ${(order as unknown as { staff_name: string }).staff_name}`);
  }

  if (order.notes) {
    lines.push(`*** ${order.notes.toUpperCase()} ***`);
  }

  const allergies = (order as unknown as Record<string, string>).customer_allergies;
  const custNotes = (order as unknown as Record<string, string>).customer_notes;
  if (allergies) {
    lines.push(separator());
    lines.push(center("!! ALLERGY ALERT !!"));
    lines.push(`ALLERGIES: ${allergies.toUpperCase()}`);
  }
  if (custNotes) {
    lines.push(`CUST NOTE: ${custNotes}`);
  }

  lines.push(separator());
  lines.push("");

  // Items - no prices for kitchen
  for (const item of items) {
    lines.push(`${item.quantity}x ${item.name.toUpperCase()}`);
    if (item.modifiers) {
      try {
        const mods = JSON.parse(item.modifiers) as { name: string }[];
        for (const mod of mods) {
          lines.push(`   + ${mod.name.toUpperCase()}`);
        }
      } catch { /* ignore */ }
    }
    if (item.notes) {
      lines.push(`   >> ${item.notes.toUpperCase()}`);
    }
    lines.push("");
  }

  lines.push(separator());
  lines.push(center(new Date(order.created_at).toLocaleTimeString("en-GB")));
  lines.push(separator());
  lines.push("");
  lines.push("");
  lines.push("");

  return lines.join("\n");
}

async function openCashDrawer(settings: Record<string, string>): Promise<boolean> {
  if (settings.cash_drawer_enabled !== "1") return false;

  try {
    const { stdout: printerList } = await execAsync("lpstat -p 2>/dev/null || echo ''");
    const printers = printerList
      .split("\n")
      .filter((l: string) => l.startsWith("printer"))
      .map((l: string) => l.split(" ")[1]);

    const receiptPrinter = printers.find(
      (p: string) => /thermal|receipt|epson|star|pos|tm-/i.test(p)
    ) || printers[0];

    if (!receiptPrinter) return false;

    // Write cash drawer command to temp file and print
    const tmpFile = path.join(os.tmpdir(), `drawer_${Date.now()}.bin`);
    fs.writeFileSync(tmpFile, CASH_DRAWER_COMMAND, "binary");

    await execAsync(`lp -d "${receiptPrinter}" -o raw "${tmpFile}"`);

    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    return true;
  } catch {
    return false;
  }
}

async function printToKitchen(order: OrderRow, items: OrderItemRow[], settings: Record<string, string>): Promise<boolean> {
  if (settings.kitchen_printer_enabled !== "1" || !settings.kitchen_printer) return false;

  try {
    const ticketText = buildKitchenTicket(order, items, settings);
    const tmpFile = path.join(os.tmpdir(), `kitchen_${order.order_number}.txt`);
    fs.writeFileSync(tmpFile, ticketText, "utf-8");

    const kitchenOpts = getPrintOptions(settings.printer_brand || "generic");
    await execAsync(`lp -d "${settings.kitchen_printer}" ${kitchenOpts} "${tmpFile}"`);

    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    return true;
  } catch {
    return false;
  }
}

function buildReceiptText(order: OrderRow, items: OrderItemRow[], settings: Record<string, string>): string {
  const width = parseInt(settings.printer_width || "25");
  const currency = settings.currency_symbol || "£";

  function center(text: string): string {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(pad) + text;
  }

  function line(left: string, right: string): string {
    const space = Math.max(1, width - left.length - right.length);
    return left + " ".repeat(space) + right;
  }

  function separator(): string {
    return "-".repeat(width);
  }

  const lines: string[] = [];

  // Header
  lines.push(center(settings.shop_name || "My Takeaway"));
  if (settings.shop_address) lines.push(center(settings.shop_address));
  if (settings.shop_phone) lines.push(center(settings.shop_phone));
  if (settings.receipt_header) {
    for (const headerLine of settings.receipt_header.split("\n")) {
      if (headerLine.trim()) lines.push(center(headerLine.trim()));
    }
  }
  lines.push(separator());

  // Order info
  lines.push(line("Order #:", order.order_number));
  lines.push(line("Type:", order.order_type.toUpperCase()));
  if (order.customer_name) lines.push(line("Customer:", order.customer_name));
  if (order.customer_phone) lines.push(line("Phone:", order.customer_phone));
  lines.push(line("Date:", new Date(order.created_at).toLocaleString("en-GB")));
  if (order.payment_method === "split") {
    lines.push(line("Payment:", "SPLIT"));
    lines.push(line("  Cash:", `${currency}${(order.split_cash || 0).toFixed(2)}`));
    lines.push(line("  Card:", `${currency}${(order.split_card || 0).toFixed(2)}`));
  } else {
    lines.push(line("Payment:", order.payment_method.toUpperCase()));
  }
  if (order.tip > 0) lines.push(line("Tip:", `${currency}${order.tip.toFixed(2)}`));
  if (order.staff_name) lines.push(line("Served by:", order.staff_name));
  lines.push(separator());

  // Items
  for (const item of items) {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    lines.push(line(`${item.quantity}x ${item.name}`, `${currency}${itemTotal}`));
    if (item.modifiers) {
      try {
        const mods = JSON.parse(item.modifiers) as { name: string; price: number }[];
        for (const mod of mods) {
          lines.push(`   + ${mod.name}`);
        }
      } catch { /* ignore */ }
    }
    if (item.notes) {
      lines.push(`   > ${item.notes}`);
    }
  }

  lines.push(separator());

  // Totals
  lines.push(line("Subtotal:", `${currency}${order.subtotal.toFixed(2)}`));
  if (order.tax > 0) {
    lines.push(line("Tax:", `${currency}${order.tax.toFixed(2)}`));
  }
  if (order.discount > 0) {
    const discLabel = order.discount_code ? `Discount (${order.discount_code}):` : "Discount:";
    lines.push(line(discLabel, `-${currency}${order.discount.toFixed(2)}`));
  }
  if (order.delivery_fee > 0) {
    lines.push(line("Delivery Fee:", `${currency}${order.delivery_fee.toFixed(2)}`));
  }
  if (order.service_charge > 0) {
    lines.push(line("Service Charge:", `${currency}${order.service_charge.toFixed(2)}`));
  }
  lines.push(separator());
  lines.push(line("TOTAL:", `${currency}${order.total.toFixed(2)}`));
  lines.push(separator());

  // Notes
  if (order.notes) {
    lines.push("Notes: " + order.notes);
    lines.push(separator());
  }

  // Loyalty points
  const loyaltyPoints = (order as unknown as Record<string, unknown>).loyalty_points as number | undefined;
  if (loyaltyPoints != null && loyaltyPoints > 0) {
    const pointsEarned = Math.floor(order.total);
    lines.push("");
    lines.push(center("--- LOYALTY POINTS ---"));
    lines.push(line("Points earned:", `+${pointsEarned} pts`));
    lines.push(line("Total balance:", `${loyaltyPoints} pts`));
  }

  // Footer
  lines.push("");
  const footer = settings.receipt_footer || "Thank you for your order!";
  for (const footerLine of footer.split("\n")) {
    if (footerLine.trim()) lines.push(center(footerLine.trim()));
  }
  lines.push("");
  lines.push("");
  lines.push("");

  return lines.join("\n");
}

function buildRefundReceiptText(order: OrderRow, refundAmount: number, refundReason: string, settings: Record<string, string>): string {
  const width = parseInt(settings.printer_width || "25");
  const currency = settings.currency_symbol || "£";

  function center(text: string): string {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(pad) + text;
  }
  function line(left: string, right: string): string {
    const space = Math.max(1, width - left.length - right.length);
    return left + " ".repeat(space) + right;
  }
  function separator(): string { return "-".repeat(width); }

  const lines: string[] = [];
  lines.push(center(settings.shop_name || "My Takeaway"));
  if (settings.shop_address) lines.push(center(settings.shop_address));
  if (settings.shop_phone) lines.push(center(settings.shop_phone));
  lines.push(separator());
  lines.push(center("*** REFUND RECEIPT ***"));
  lines.push(separator());
  lines.push(line("Order #:", order.order_number));
  lines.push(line("Date:", new Date().toLocaleString("en-GB")));
  if (order.customer_name) lines.push(line("Customer:", order.customer_name));
  lines.push(separator());
  lines.push(line("Original Total:", `${currency}${order.total.toFixed(2)}`));
  lines.push(line("REFUND AMOUNT:", `${currency}${Number(refundAmount).toFixed(2)}`));
  if (refundReason) lines.push(`Reason: ${refundReason}`);
  lines.push(separator());
  lines.push(center("Refund processed"));
  lines.push(center(new Date().toLocaleString("en-GB")));
  lines.push("");
  lines.push("");
  lines.push("");
  return lines.join("\n");
}

function buildZReportText(report: any, settings: Record<string, string>): string {
  const width = parseInt(settings.printer_width || "32");
  const currency = settings.currency_symbol || "£";

  function center(text: string): string {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(pad) + text;
  }
  function line(left: string, right: string): string {
    const space = Math.max(1, width - left.length - right.length);
    return left + " ".repeat(space) + right;
  }
  function sep(char = "-"): string { return char.repeat(width); }

  const lines: string[] = [];
  lines.push(center(settings.shop_name || "My Takeaway"));
  lines.push(center("*** Z-REPORT ***"));
  lines.push(center("END OF DAY SUMMARY"));
  lines.push(center(report.date));
  lines.push(center(new Date().toLocaleTimeString("en-GB")));
  lines.push(sep("="));

  lines.push(line("Total Orders:", String(report.totals.orders)));
  lines.push(line("Gross Sales:", `${currency}${Number(report.totals.gross_sales).toFixed(2)}`));
  if (report.totals.discounts > 0)
    lines.push(line("Discounts:", `-${currency}${Number(report.totals.discounts).toFixed(2)}`));
  if (report.totals.delivery_fees > 0)
    lines.push(line("Delivery Fees:", `${currency}${Number(report.totals.delivery_fees).toFixed(2)}`));
  if (report.totals.tax > 0)
    lines.push(line("Tax:", `${currency}${Number(report.totals.tax).toFixed(2)}`));
  if (report.totals.tips > 0)
    lines.push(line("Tips:", `${currency}${Number(report.totals.tips).toFixed(2)}`));
  if (report.totals.refunds > 0)
    lines.push(line("Refunds:", `-${currency}${Number(report.totals.refunds).toFixed(2)}`));
  lines.push(sep());
  lines.push(line("NET SALES:", `${currency}${Number(report.totals.net_sales).toFixed(2)}`));
  lines.push(line("CASH IN DRAWER:", `${currency}${Number(report.cash_in_drawer).toFixed(2)}`));
  lines.push(sep("="));

  if (report.split_breakdown?.count > 0) {
    lines.push(center("SPLIT PAYMENT BREAKDOWN"));
    lines.push(sep());
    lines.push(line(`Split x${report.split_breakdown.count} Cash:`, `${currency}${Number(report.split_breakdown.cash).toFixed(2)}`));
    lines.push(line(`Split x${report.split_breakdown.count} Card:`, `${currency}${Number(report.split_breakdown.card).toFixed(2)}`));
    lines.push(sep("="));
  }

  if (report.by_payment?.length) {
    lines.push(center("BY PAYMENT METHOD"));
    lines.push(sep());
    for (const p of report.by_payment) {
      const label = p.payment_method === "sumup" ? "Card (SumUp)" : p.payment_method;
      lines.push(line(`${label} x${p.count}:`, `${currency}${Number(p.total).toFixed(2)}`));
    }
    lines.push(sep("="));
  }

  if (report.by_type?.length) {
    lines.push(center("BY ORDER TYPE"));
    lines.push(sep());
    for (const t of report.by_type) {
      const label = t.order_type === "eat_in" ? "Eat In" : t.order_type;
      lines.push(line(`${label} x${t.count}:`, `${currency}${Number(t.total).toFixed(2)}`));
    }
    lines.push(sep("="));
  }

  if (report.top_items?.length) {
    lines.push(center("TOP ITEMS"));
    lines.push(sep());
    for (const item of report.top_items.slice(0, 5)) {
      lines.push(line(`${item.name}`, `x${item.qty} ${currency}${Number(item.revenue).toFixed(2)}`));
    }
    lines.push(sep("="));
  }

  lines.push("");
  lines.push(center("*** REPORT COMPLETE ***"));
  lines.push("");
  lines.push("");
  lines.push("");
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, type = "receipt", test, printer: requestedPrinter, zreport } = body;

    // Get settings via Supabase
    const { supabase, venueId, error: venueError } = await getVenueId();
    if (venueError) return venueError;
    const { data: settingsRows } = await supabase.from("settings").select("key, value").eq("venue_id", venueId);
    const settings: Record<string, string> = {};
    for (const row of (settingsRows ?? [])) settings[row.key] = row.value;

    // Handle test print
    if (test) {
      const testText = `
================================
      TEST PRINT
================================

Printer: ${requestedPrinter || "Default"}
Time: ${new Date().toLocaleString()}

This is a test print to verify
your printer is working correctly.

================================
        THANK YOU
================================

`;
      // Note: CUPS driver handles auto-cut for Star printers
      const tmpFile = path.join(os.tmpdir(), `test_print.txt`);
      fs.writeFileSync(tmpFile, testText, "utf-8");

      try {
        const opts = getPrintOptions(settings?.printer_brand || "generic");
        if (requestedPrinter) {
          const printCmd = `lp -d "${requestedPrinter}" ${opts} "${tmpFile}"`;
          await execAsync(printCmd);
        } else {
          const printCmd = `lp ${opts} "${tmpFile}"`;
          await execAsync(printCmd);
        }
        return NextResponse.json({ success: true, message: "Test print sent" });
      } catch (printError) {
        return NextResponse.json({ 
          success: false, 
          error: "Print failed: " + (printError as Error).message 
        });
      }
    }

    // Handle Z-Report print
    if (zreport) {
      const reportText = buildZReportText(zreport, settings);
      const tmpFile = path.join(os.tmpdir(), `zreport_${Date.now()}.txt`);
      fs.writeFileSync(tmpFile, reportText, "utf-8");
      try {
        const printOpts = getPrintOptions(settings.printer_brand || "generic");
        const printerToUse = requestedPrinter || settings.default_printer;
        const printCmd = printerToUse
          ? `lp -d "${printerToUse}" ${printOpts} "${tmpFile}"`
          : `lp ${printOpts} "${tmpFile}"`;
        await execAsync(printCmd);
        try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
        return NextResponse.json({ success: true, message: "Z-Report printed", report: reportText });
      } catch {
        try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
        return NextResponse.json({ success: false, message: "Printer unavailable", report: reportText });
      }
    }

    // Get order from Supabase
    const { data: orderRow } = await supabase.from("orders").select("*, staff:staff_id(name)").eq("id", order_id).eq("venue_id", venueId).single();
    if (!orderRow) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const order = { ...orderRow, staff_name: (orderRow.staff as {name?:string}|null)?.name ?? null } as unknown as OrderRow;

    const { data: itemRows } = await supabase.from("order_items").select("*").eq("order_id", order_id);
    const items = (itemRows ?? []) as unknown as OrderItemRow[];

    if (order.customer_phone) {
      const { data: customer } = await supabase.from("customers").select("allergies, notes, loyalty_points").eq("venue_id", venueId).eq("phone", order.customer_phone).single();
      if (customer) {
        (order as unknown as Record<string, unknown>).customer_allergies = customer.allergies || "";
        (order as unknown as Record<string, unknown>).customer_notes = customer.notes || "";
        (order as unknown as Record<string, unknown>).loyalty_points = customer.loyalty_points ?? 0;
      }
    }

    // Kitchen-only print (called separately from till, always fires if kitchen printer enabled)
    if (type === "kitchen") {
      await printToKitchen(order, items, settings);
      return NextResponse.json({ success: true, message: "Kitchen ticket sent" });
    }

    // Handle refund receipt
    if (type === "refund") {
      const refundText = buildRefundReceiptText(order, body.refund_amount, body.refund_reason, settings);
      const tmpRefund = path.join(os.tmpdir(), `refund_${order.order_number}_${Date.now()}.txt`);
      fs.writeFileSync(tmpRefund, refundText, "utf-8");
      try {
        const printOpts = getPrintOptions(settings.printer_brand || "generic");
        const printerToUse = requestedPrinter || settings.default_printer;
        const printCmd = printerToUse
          ? `lp -d "${printerToUse}" ${printOpts} "${tmpRefund}"`
          : `lp ${printOpts} "${tmpRefund}"`;
        await execAsync(printCmd);
        try { fs.unlinkSync(tmpRefund); } catch { /* ignore */ }
        return NextResponse.json({ success: true, message: "Refund receipt printed", receipt: refundText });
      } catch {
        try { fs.unlinkSync(tmpRefund); } catch { /* ignore */ }
        return NextResponse.json({ success: false, message: "Printer unavailable", receipt: refundText });
      }
    }

    // Build and print receipt
    const receiptText = buildReceiptText(order, items, settings);

    // Try to print using macOS lp command (works with any USB receipt printer recognized by macOS)
    const tmpFile = path.join(os.tmpdir(), `receipt_${order.order_number}.txt`);
    fs.writeFileSync(tmpFile, receiptText, "utf-8");

    try {
      // Use requested printer or fall back to settings default
      const printerToUse = requestedPrinter || settings.default_printer;
      
      const printOpts = getPrintOptions(settings.printer_brand || "generic");
      if (printerToUse) {
        const printCmd = `lp -d "${printerToUse}" ${printOpts} "${tmpFile}"`;
        await execAsync(printCmd);
      } else {
        // Use default printer
        const printCmd = `lp ${printOpts} "${tmpFile}"`;
        await execAsync(printCmd);
      }
      
      return NextResponse.json({
        success: true,
        message: "Receipt printed",
        receipt: receiptText,
      });
    } catch {
      // Print failed, return receipt for on-screen display
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
      return NextResponse.json({
        success: false,
        message: "Print command failed. Receipt displayed on screen.",
        receipt: receiptText,
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate receipt", details: String(err) },
      { status: 500 }
    );
  }
}

// GET endpoint to list available printers
export async function GET() {
  try {
    const { stdout } = await execAsync("lpstat -p 2>/dev/null || echo ''");
    const printers = stdout
      .split("\n")
      .filter((l: string) => l.startsWith("printer"))
      .map((l: string) => {
        const parts = l.split(" ");
        const name = parts[1];
        // On macOS: "idle" = connected and ready, "disabled" = offline/unplugged
        const isReady = l.includes("idle") || l.includes("printing");
        const isEnabled = l.includes("enabled");
        return { name, enabled: isReady && isEnabled };
      });

    // Also get the default printer
    let defaultPrinter = "";
    try {
      const { stdout: defOut } = await execAsync("lpstat -d 2>/dev/null || echo ''");
      const match = defOut.match(/:\s*(.+)/);
      if (match) defaultPrinter = match[1].trim();
    } catch { /* ignore */ }

    return NextResponse.json({
      printers,
      defaultPrinter,
    });
  } catch {
    return NextResponse.json({ printers: [], defaultPrinter: "" });
  }
}
