import React from "react";
import { Youtube } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground italic">Last Updated: March 17, 2026</p>
        </header>

        <section className="space-y-6 prose prose-invert max-w-none">
          <p>
            At ObsidiTube (GiBlok), we respect your privacy and are committed to protecting any information we may collect. This Privacy Policy describes how we handle data when you use our website and conversion tools.
          </p>

          <h2 className="text-xl font-bold text-white">1. Data We Do Not Collect</h2>
          <p>
            ObsidiTube is designed to be as private as possible. We do not store:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>YouTube Playlist URLs you convert.</li>
            <li>The content of the generated Markdown/Obsidian cards.</li>
            <li>Your YouTube account data or cookies (these are processed in-memory and discarded).</li>
          </ul>

          <h2 className="text-xl font-bold text-white">2. Data We Do Collect</h2>
          <p>
            When you purchase ObsidiTube Pro, our payment providers (Creem.io and NOWPayments) collect and share the following with us to facilitate your license:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Email Address:</strong> To send your license key and provide support.</li>
            <li><strong>Order History:</strong> To verify your lifetime access status.</li>
          </ul>

          <h2 className="text-xl font-bold text-white">3. Third-Party Services</h2>
          <p>
            We use a few trusted third-party services to operate:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Creem.io:</strong> Our Merchant of Record for fiat payments.</li>
            <li><strong>NOWPayments:</strong> For cryptocurrency payments.</li>
            <li><strong>Upstash:</strong> To securely store your license key status.</li>
            <li><strong>Resend:</strong> To send license delivery emails.</li>
            <li><strong>Vercel:</strong> For hosting our application.</li>
          </ul>

          <h2 className="text-xl font-bold text-white">4. Cookies</h2>
          <p>
            We use local storage only to remember your Pro license key on your device. We do not use tracking or advertising cookies.
          </p>

          <h2 className="text-xl font-bold text-white">5. Contact</h2>
          <p>
            If you have any questions about this policy, please contact us at support@giblok.com.
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
