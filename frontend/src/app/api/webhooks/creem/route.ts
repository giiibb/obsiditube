import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

function generateLicenseKey(): string {
  const part = () => crypto.randomBytes(2).toString("hex").toUpperCase();
  return `OT-${part()}-${part()}-${part()}`;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("creem-signature");
  const secret = process.env.CREEM_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ detail: "Missing signature or secret" }, { status: 400 });
  }

  const rawBody = await req.text();
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ detail: "Invalid signature" }, { status: 401 });
  }

  const data = JSON.parse(rawBody);
  const event = data.event;

  if (event === "order.created") {
    const email = data.data?.customer?.email;
    const orderId = data.data?.order?.id;

    if (email && orderId) {
      const licenseKey = generateLicenseKey();
      const kvUrl = process.env.KV_REST_API_URL;
      const kvToken = process.env.KV_REST_API_TOKEN;

      if (kvUrl && kvToken) {
        const payload = {
          status: "active",
          email: email,
          id: `creem_${orderId}`,
          created_at: new Date().toISOString()
        };

        // Store in Upstash
        await fetch(`${kvUrl}/set/license:${licenseKey}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${kvToken}` },
          body: JSON.stringify(payload)
        });

        console.log(`[Webhook] Provisioned ${licenseKey} for ${email}`);
      }
    }
  }

  return NextResponse.json({ status: "success" });
}
