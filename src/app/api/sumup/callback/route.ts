import { NextResponse } from "next/server";

// Handle SumUp payment callbacks
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Log the callback for debugging
    console.log("SumUp callback:", body);
    
    // Here you could:
    // 1. Update order status in database
    // 2. Send receipt
    // 3. Print kitchen ticket
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("SumUp callback error:", error);
    return NextResponse.json({ received: true });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const checkoutRef = searchParams.get("checkout_reference");
  
  // Redirect back to POS with status
  const redirectUrl = new URL("/", req.url);
  redirectUrl.searchParams.set("sumup_status", status || "unknown");
  redirectUrl.searchParams.set("checkout_ref", checkoutRef || "");
  
  return NextResponse.redirect(redirectUrl);
}
