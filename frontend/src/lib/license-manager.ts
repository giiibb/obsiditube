import redis from "./redis";
import crypto from "crypto";

/**
 * ObsidiTube Pro — License Key Generation & Provisioning
 * =======================================================
 * Mirror of Python src/webhooks.py for Vercel deployment.
 */

export function generateLicenseKey(): string {
  // Format: OT-XXXX-XXXX-XXXX
  const segments = Array.from({ length: 3 }, () => 
    crypto.randomBytes(2).toString('hex').toUpperCase()
  );
  return `OT-${segments.join("-")}`;
}

export async function provisionLicense(email: string, orderId: string, platform: string): Promise<string> {
  const licenseKey = generateLicenseKey();
  
  const data = {
    status: "active",
    email: email,
    id: `${platform}_${orderId}`,
    created_at: new Date().toISOString(),
  };

  try {
    // Store in Upstash Redis
    await redis.set(`license:${licenseKey}`, data);
    console.log(`Provisioned license ${licenseKey} for ${email}`);
  } catch (err) {
    console.error("Failed to store license in Redis:", err);
  }

  return licenseKey;
}

export async function sendLicenseEmail(email: string, licenseKey: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM || "noreply@giblok.com";

  if (!apiKey) {
    console.warn("RESEND_API_KEY missing. Skipping email.");
    return;
  }

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h1 style="color: #c8643c;">Your ObsidiTube Pro License</h1>
      <p>Thank you for your purchase!</p>
      <p>Your license key is: <strong style="font-family: monospace; font-size: 1.2em; background: #f4f4f4; padding: 5px 10px; border-radius: 5px;">${licenseKey}</strong></p>
      <p>Enter this key in the ObsidiTube dashboard to unlock unlimited playlist conversions.</p>
      <br/>
      <p>Cheers,<br/>GiBlok Team</p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: "Your ObsidiTube Pro License Key",
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Resend API error:", error);
    }
  } catch (err) {
    console.error("Error sending email via Resend:", err);
  }
}

/**
 * Verifies HMAC-SHA256 signature from Creem.io.
 */
export function verifyCreemSignature(payload: string, signature: string): boolean {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const hmac = crypto.createHmac("sha256", secret);
  const computedSig = hmac.update(payload).digest("hex");
  
  try {
    return crypto.timingSafeEqual(Buffer.from(computedSig), Buffer.from(signature));
  } catch (e) {
    return false;
  }
}

/**
 * Verifies HMAC-SHA512 signature from NOWPayments.
 */
export function verifyNowPaymentsSignature(payload: any, signature: string): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret || !signature) return false;

  // Sort payload keys alphabetically
  const sortedPayload = Object.keys(payload)
    .sort()
    .reduce((obj: any, key) => {
      obj[key] = payload[key];
      return obj;
    }, {});

  const jsonString = JSON.stringify(sortedPayload);
  const hmac = crypto.createHmac("sha512", secret);
  const computedSig = hmac.update(jsonString).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(computedSig), Buffer.from(signature));
  } catch (e) {
    return false;
  }
}
