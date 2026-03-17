import React from "react";
import { Youtube } from "lucide-react";
import Link from "next/link";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 py-20 px-4">
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="flex items-center gap-2.5">
          <Youtube className="h-6 w-6 text-primary" />
          <span className="font-bold tracking-tight text-lg">
            Obsidi<span className="text-primary">Tube</span>
          </span>
        </div>
        
        <header className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight">Refund Policy</h1>
          <p className="text-muted-foreground italic">Last Updated: March 17, 2026</p>
        </header>

        <section className="space-y-6 prose prose-invert max-w-none text-muted-foreground">
          <p>
            We want you to be happy with ObsidiTube Pro. Because this is a digital product with a lifetime license, we have a clear refund policy.
          </p>

          <h2 className="text-xl font-bold text-white">1. 14-Day Money Back Guarantee</h2>
          <p>
            If you are not satisfied with ObsidiTube Pro, you can request a full refund within **14 days** of your purchase. No questions asked.
          </p>

          <h2 className="text-xl font-bold text-white">2. Eligibility</h2>
          <p>
            To be eligible for a refund, you must provide your license key and the email address used for the purchase.
          </p>

          <h2 className="text-xl font-bold text-white">3. Processing Refunds</h2>
          <p>
            Refunds for fiat payments (Creem.io) will be processed back to your original payment method. For cryptocurrency payments, refunds will be issued in the original currency or its current USD equivalent at our discretion.
          </p>

          <h2 className="text-xl font-bold text-white">4. After Refund</h2>
          <p>
            Once a refund is processed, your license key will be permanently deactivated in our systems.
          </p>

          <h2 className="text-xl font-bold text-white">5. Contact Us</h2>
          <p>
            To request a refund, please email support@giblok.com with your order details.
          </p>
        </section>

        <footer className="pt-12 border-t border-white/5">
          <Link href="/" className="text-primary hover:underline font-medium flex items-center gap-2">
            ← Back to Home
          </Link>
        </footer>
      </div>
    </div>
  );
}
