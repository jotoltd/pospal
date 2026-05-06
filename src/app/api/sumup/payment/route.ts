import { NextResponse } from "next/server";

const SUMUP_API_BASE = "https://api.sumup.com/v0.1";

// Store pending transactions in memory (use Redis/DB in production)
const pendingTransactions = new Map<string, {
  checkout_reference: string;
  client_transaction_id: string;
  status: string;
  amount: number;
  created_at: number;
}>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, description, returnUrl, checkout_reference: clientRef } = body;

    // Get SumUp credentials from settings
    const merchantId = process.env.SUMUP_MERCHANT_ID || "";
    const apiKey = process.env.SUMUP_API_KEY || "";

    if (!merchantId || !apiKey) {
      return NextResponse.json({
        error: "SumUp not configured. Add SUMUP_MERCHANT_ID and SUMUP_API_KEY to .env.local",
        configured: false,
      }, { status: 400 });
    }

    // Use client-provided reference (our SUP- ref) or generate one
    const checkoutReference = clientRef || `POS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const clientTransactionId = `TX-${Date.now()}`;

    // Your SumUp Solo reader ID - sends payment to this specific device
    const readerId = process.env.SUMUP_READER_ID || "rdr_0APHD4D2A987JBPS8VS9Q57B3V";

    // Convert amount to pence (integer) - SumUp expects minor units
    const amountInPence = Math.round(parseFloat(amount) * 100);

    // Create checkout specifically for this reader (this sends directly to Solo device)
    const requestBody = {
      checkout_reference: checkoutReference,
      amount: amountInPence,
      total_amount: {
        value: amountInPence,
        currency: "GBP",
        minor_unit: 2,
      },
      currency: "GBP",
      description: description || "Takeaway Order",
      return_url: returnUrl || "https://localhost:3001/api/sumup/callback",
    };

    console.log("SumUp request to reader:", readerId, JSON.stringify(requestBody, null, 2));

    // Use the readers-specific checkout endpoint
    const response = await fetch(`${SUMUP_API_BASE}/merchants/${merchantId}/readers/${readerId}/checkout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": clientTransactionId,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("SumUp response:", response.status, responseText);

    if (!response.ok) {
      return NextResponse.json({
        error: `SumUp API error: ${responseText}`,
        configured: true,
        status: response.status,
      }, { status: 500 });
    }

    const data = JSON.parse(responseText);

    // Store transaction details
    pendingTransactions.set(checkoutReference, {
      checkout_reference: checkoutReference,
      client_transaction_id: clientTransactionId,
      status: "PENDING",
      amount: parseFloat(amount),
      created_at: Date.now(),
    });

    return NextResponse.json({
      success: true,
      checkout_reference: checkoutReference,
      checkout_id: data.id,
      status_url: data.next_step?.url,
      amount: amount,
      currency: "GBP",
      message: "Payment request sent to SumUp Solo",
      debug: data, // Full response for debugging
    });

  } catch (error) {
    return NextResponse.json({
      error: String(error),
      configured: false,
    }, { status: 500 });
  }
}

// Check payment status
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const checkoutRef = searchParams.get("checkout_reference");
    const checkoutId = searchParams.get("checkout_id");

    if (!checkoutRef && !checkoutId) {
      return NextResponse.json({ error: "checkout_reference or checkout_id required" }, { status: 400 });
    }

    // Use checkout_id if provided, otherwise use checkout_reference (guard above ensures one exists)
    const lookupId: string = checkoutId ?? checkoutRef ?? "";
    
    // Check local cache first
    const cached = checkoutRef ? pendingTransactions.get(checkoutRef) : null;
    if (cached && cached.status === "PAID") {
      return NextResponse.json({
        status: "PAID",
        checkout_reference: checkoutRef,
        amount: cached.amount,
      });
    }

    // Query SumUp API for status
    const apiKey = process.env.SUMUP_API_KEY || "";
    const merchantId = process.env.SUMUP_MERCHANT_ID || "";
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Try merchant-specific endpoint first (for reader checkouts)
    // Use checkout_id if available, otherwise use checkout_reference
    const response = await fetch(`${SUMUP_API_BASE}/merchants/${merchantId}/checkouts/${lookupId}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.log("SumUp status check failed:", response.status, await response.text());
      return NextResponse.json({ status: "UNKNOWN" });
    }

    const data = await response.json();
    console.log("SumUp status API response:", checkoutRef, data.status, data);

    // Update cache
    if (cached && checkoutRef) {
      cached.status = data.status;
      pendingTransactions.set(checkoutRef, cached);
    }

    // Extract card details from transactions array if present
    const transaction = data.transactions?.[0];

    return NextResponse.json({
      status: data.status,
      checkout_reference: checkoutRef,
      amount: data.amount,
      payment_type: data.payment_type,
      transaction_code: data.transaction_code,
      timestamp: data.timestamp,
      decline_reason: data.decline_reason,
      error_code: data.error_code,
      // Card details from transaction
      card_last_four: transaction?.card?.last_4_digits,
      card_type: transaction?.card?.type,
      auth_code: transaction?.auth_code,
      entry_mode: transaction?.entry_mode, // CONTACTLESS, CHIP, etc.
    });

  } catch (error) {
    return NextResponse.json({
      error: String(error),
      status: "ERROR",
    }, { status: 500 });
  }
}
