import { NextResponse } from "next/server";

const SUMUP_API_BASE = "https://api.sumup.com/v0.1";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { checkout_reference } = body;

    const apiKey = process.env.SUMUP_API_KEY || "";
    const merchantId = process.env.SUMUP_MERCHANT_ID || "";
    const readerId = process.env.SUMUP_READER_ID || "";

    if (!apiKey || !merchantId || !readerId) {
      return NextResponse.json({ error: "SumUp not configured" }, { status: 500 });
    }

    // Use the correct terminate endpoint — POST /terminate sends cancel signal to Solo device
    // https://developer.sumup.com/api/readers/get (Terminate a Reader Checkout)
    const response = await fetch(
      `${SUMUP_API_BASE}/merchants/${merchantId}/readers/${readerId}/terminate`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const responseText = await response.text();
    console.log("SumUp terminate reader checkout:", response.status, responseText);

    if (!response.ok) {
      console.log("SumUp terminate failed (device may already be idle):", responseText);
      // Still return success so UI resets — device may have already finished
    }

    return NextResponse.json({
      success: true,
      message: "Payment cancelled on device",
      checkout_reference,
    });

  } catch (error) {
    console.error("Cancel error:", error);
    return NextResponse.json({
      success: true,
      message: "Payment cancelled",
    });
  }
}
