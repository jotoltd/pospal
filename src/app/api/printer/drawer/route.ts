import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ESC/POS drawer kick commands for different configurations
const DRAWER_COMMANDS = {
  // Drawer 1 (pin 2) - most common
  drawer1_pin2: Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]),
  // Drawer 1 (pin 2) alternate timing
  drawer1_pin2_alt: Buffer.from([0x1B, 0x70, 0x00, 0x3C, 0xC8]),
  // Drawer 2 (pin 5)
  drawer2_pin5: Buffer.from([0x1B, 0x70, 0x01, 0x19, 0xFA]),
  // Drawer 2 (pin 5) alternate timing
  drawer2_pin5_alt: Buffer.from([0x1B, 0x70, 0x01, 0x3C, 0xC8]),
};

async function detectPrinters() {
  const printers: string[] = [];
  const diagnostics: string[] = [];

  try {
    // Check CUPS printers
    const { stdout: lpstatOut } = await execAsync("lpstat -p 2>/dev/null");
    if (lpstatOut) {
      const lines = lpstatOut.split("\n").filter(l => l.includes("printer"));
      lines.forEach(l => {
        const match = l.match(/printer\s+(\S+)/);
        if (match && !printers.includes(match[1])) printers.push(match[1]);
      });
      diagnostics.push(`lpstat found: ${lines.length} printers`);
    }
  } catch (e) {
    diagnostics.push(`lpstat failed: ${String(e).slice(0, 100)}`);
  }

  try {
    // Check default printer
    const { stdout: defaultOut } = await execAsync("lpstat -d 2>/dev/null");
    diagnostics.push(`default printer: ${defaultOut.trim() || "none"}`);
  } catch {
    diagnostics.push("no default printer detected");
  }

  try {
    // Check USB devices (Linux)
    const { stdout: usbOut } = await execAsync("ls /dev/usb/lp* 2>/dev/null");
    if (usbOut) {
      usbOut.trim().split("\n").forEach(d => {
        if (!printers.includes(d)) printers.push(d);
      });
      diagnostics.push(`USB devices: ${usbOut.trim()}`);
    }
  } catch {
    diagnostics.push("no USB printer devices found");
  }

  try {
    // Check macOS USB via system_profiler
    const { stdout: macUsb } = await execAsync("system_profiler SPUSBDataType 2>/dev/null | grep -i 'epson\\|star\\|printer\\|thermal' | head -5");
    if (macUsb) diagnostics.push(`USB detection: ${macUsb.trim()}`);
  } catch {
    diagnostics.push("mac USB profiler: no match");
  }

  return { printers, diagnostics };
}

async function sendToPrinter(command: Buffer, printer: string) {
  const base64 = command.toString("base64");

  if (printer.startsWith("/dev/")) {
    // Direct USB device
    try {
      await execAsync(`printf '${base64}' | base64 -d > ${printer}`);
      return true;
    } catch {
      return false;
    }
  }

  // CUPS printer
  try {
    await execAsync(`printf '${base64}' | base64 -d | lp -d ${printer} -o raw`);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const drawerKey = body.drawer || "drawer1_pin2";
    const command = DRAWER_COMMANDS[drawerKey as keyof typeof DRAWER_COMMANDS] || DRAWER_COMMANDS.drawer1_pin2;

    const { printers, diagnostics } = await detectPrinters();

    let success = false;
    const attempts: { printer: string; sent: boolean }[] = [];

    for (const printer of printers) {
      const sent = await sendToPrinter(command, printer);
      attempts.push({ printer, sent });
      if (sent) {
        success = true;
        break;
      }
    }

    // Also try default lp without specifying printer
    if (!success) {
      try {
        await execAsync(`printf '${command.toString("base64")}' | base64 -d | lp -o raw`);
        success = true;
        attempts.push({ printer: "default lp", sent: true });
      } catch {
        attempts.push({ printer: "default lp", sent: false });
      }
    }

    return NextResponse.json({
      success,
      command: command.toString("hex"),
      drawerType: drawerKey,
      detectedPrinters: printers,
      attempts,
      diagnostics,
      message: success
        ? "Drawer command sent successfully"
        : "No printer found. Check USB connection or CUPS setup.",
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      message: "Failed to send drawer command",
    }, { status: 500 });
  }
}

export async function GET() {
  const { printers, diagnostics } = await detectPrinters();

  return NextResponse.json({
    detectedPrinters: printers,
    diagnostics,
    drawerCommands: Object.fromEntries(
      Object.entries(DRAWER_COMMANDS).map(([k, v]) => [k, v.toString("hex")])
    ),
    instructions: [
      "1. Connect drawer to printer RJ11/RJ12 port (usually labeled 'DK' or 'Cash Drawer')",
      "2. POST to this endpoint with JSON body: { drawer: 'drawer1_pin2' }",
      "3. Available drawer options: drawer1_pin2, drawer1_pin2_alt, drawer2_pin5, drawer2_pin5_alt",
      "4. If no printers detected, check: lpstat -p (CUPS) or USB connection",
    ],
    setup: [
      "Set default printer: lpoptions -d PRINTER_NAME",
      "List printers: lpstat -p",
      "Test drawer: curl -X POST http://localhost:3001/api/printer/drawer -H 'Content-Type: application/json' -d '{\"drawer\":\"drawer1_pin2\"}'",
    ],
  });
}
