import { NextRequest, NextResponse } from "next/server";
import { verifyCreemSignature, provisionLicense } from "@/lib/license-manager";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("creem-signature");
  if (!signature) {
    return NextResponse.json({ detail: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  if (!verifyCreemSignature(rawBody, signature)) {
    return NextResponse.json({ detail: "Invalid signature" }, { status: 401 });
  }

  const data = JSON.parse(rawBody);
  const event = data.event;

  if (event === "order.created") {
    const order = data.data?.order || {};
    const customer = data.data?.customer || {};
    const email = customer.email;
    const orderId = order.id;

    if (email && orderId) {
      await provisionLicense(email, orderId, "creem");
    }
  }

  return NextResponse.json({ status: "success" });
}
