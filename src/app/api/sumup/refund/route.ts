import { NextResponse } from "next/server";

const SUMUP_API_BASE = "https://api.sumup.com/v0.1";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transaction_code, amount } = body;

    if (!transaction_code) {
      return NextResponse.json({ error: "transaction_code required" }, { status: 400 });
    }

    const apiKey = process.env.SUMUP_API_KEY || "";
    const merchantId = process.env.SUMUP_MERCHANT_ID || "";

    if (!apiKey || !merchantId) {
      return NextResponse.json({ error: "SumUp not configured" }, { status: 500 });
    }

    const refundBody: Record<string, unknown> = {};
    if (amount) {
      refundBody.amount = parseFloat(amount);
    }

    const response = await fetch(`${SUMUP_API_BASE}/merchants/${merchantId}/refunds/${transaction_code}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refundBody),
    });

    const responseText = await response.text();
    console.log("SumUp refund response:", response.status, responseText);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `SumUp refund failed: ${responseText}`,
      }, { status: 400 });
    }

    const data = responseText ? JSON.parse(responseText) : {};

    return NextResponse.json({
      success: true,
      message: "Refund processed to card",
      transaction_code,
      refund_data: data,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
