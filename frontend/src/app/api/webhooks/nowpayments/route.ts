import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function verifySignature(data: any, signature: string, secret: string): boolean {
  // 1. Sort dictionary by keys alphabetically
  const sortedKeys = Object.keys(data).sort();
  const sortedData: any = {};
  for (const key of sortedKeys) {
    sortedData[key] = data[key];
  }
  
  // 2. Convert to compact JSON (no spaces)
  const jsonString = JSON.stringify(sortedData, Object.keys(sortedData).sort());
  
  // 3. Calculate HMAC-SHA512
  const hmac = crypto.createHmac("sha512", secret);
  const digest = hmac.update(jsonString).digest("hex");
  
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

function generateLicenseKey(): string {
  const part = () => crypto.randomBytes(2).toString("hex").toUpperCase();
  return `OT-${part()}-${part()}-${part()}`;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-nowpayments-sig");
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ detail: "Missing signature or secret" }, { status: 400 });
  }

  const data = await req.json();
  if (!verifySignature(data, signature, secret)) {
    return NextResponse.json({ detail: "Invalid signature" }, { status: 401 });
  }

  const paymentStatus = data.payment_status;
  if (paymentStatus === "finished") {
    const email = data.customer_email || data.order_description;
    const orderId = data.payment_id;

    if (email && email.includes("@")) {
      const licenseKey = generateLicenseKey();
      const kvUrl = process.env.KV_REST_API_URL;
      const kvToken = process.env.KV_REST_API_TOKEN;

      if (kvUrl && kvToken) {
        const payload = {
          status: "active",
          email: email,
          id: `nowpayments_${orderId}`,
          created_at: new Date().toISOString()
        };

        // Store in Upstash
        await fetch(`${kvUrl}/set/license:${licenseKey}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${kvToken}` },
          body: JSON.stringify(payload)
        });

        // Send Email via Resend
        const resendKey = process.env.RESEND_API_KEY;
        const resendFrom = process.env.RESEND_FROM || "noreply@giblok.com";
        
        if (resendKey) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: resendFrom,
              to: email,
              subject: "Your ObsidiTube Pro License Key",
              html: `<h1>Your ObsidiTube Pro License</h1><p>Thank you for your purchase!</p><p>Your license key is: <strong>${licenseKey}</strong></p><p>Enter this key in the dashboard to unlock unlimited access.</p>`
            })
          });
        }
      }
    }
  }

  return NextResponse.json({ status: "success" });
}
