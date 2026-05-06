import { NextResponse } from "next/server";

const SUMUP_API_BASE = "https://api.sumup.com/v0.1";

export async function GET() {
  try {
    const apiKey = process.env.SUMUP_API_KEY || "";
    const merchantId = process.env.SUMUP_MERCHANT_ID || "";
    const readerId = process.env.SUMUP_READER_ID || "";

    if (!apiKey || !merchantId || !readerId) {
      return NextResponse.json({ online: false, error: "SumUp not configured" });
    }

    const response = await fetch(`${SUMUP_API_BASE}/merchants/${merchantId}/readers/${readerId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      return NextResponse.json({ online: false, error: `API error: ${response.status}` });
    }

    const data = await response.json();
    console.log("SumUp reader status:", data);

    // SumUp reader status can be: ONLINE, OFFLINE, BUSY, etc.
    const online = data.status === "ONLINE" || data.status === "BUSY";

    return NextResponse.json({
      online,
      status: data.status,
      name: data.name,
      identifier: data.identifier,
      battery_level: data.battery_level,
      firmware_version: data.firmware_version,
    });

  } catch (error) {
    return NextResponse.json({ online: false, error: String(error) });
  }
}
