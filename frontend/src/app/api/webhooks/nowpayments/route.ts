import { NextRequest, NextResponse } from "next/server";
import { verifyNowPaymentsSignature, provisionLicense, sendLicenseEmail } from "@/lib/license-manager";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-nowpayments-sig");
  if (!signature) {
    return NextResponse.json({ detail: "Missing signature" }, { status: 400 });
  }

  const data = await req.json();
  if (!verifyNowPaymentsSignature(data, signature)) {
    return NextResponse.json({ detail: "Invalid signature" }, { status: 401 });
  }

  const paymentStatus = data.payment_status;
  if (paymentStatus === "finished") {
    const email = data.customer_email || data.order_description;
    const orderId = data.payment_id;

    if (email && email.includes("@")) {
      const licenseKey = await provisionLicense(email, String(orderId), "nowpayments");
      await sendLicenseEmail(email, licenseKey);
    }
  }

  return NextResponse.json({ status: "success" });
}
