import React from "react";
import { Youtube } from "lucide-react";
import Link from "next/link";

export default function TermsOfService() {
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
          <h1 className="text-4xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground italic">Last Updated: March 17, 2026</p>
        </header>

        <section className="space-y-6 prose prose-invert max-w-none text-muted-foreground">
          <h2 className="text-xl font-bold text-white">1. Introduction</h2>
          <p>
            By using ObsidiTube, you agree to these Terms. ObsidiTube is provided by GiBlok.
          </p>

          <h2 className="text-xl font-bold text-white">2. Permitted Use</h2>
          <p>
            ObsidiTube is a tool to convert YouTube playlists into Markdown cards for personal productivity and note-taking. You must not use this tool for large-scale data scraping or any activity that violates YouTube&apos;s Terms of Service.
          </p>

          <h2 className="text-xl font-bold text-white">3. ObsidiTube Pro</h2>
          <p>
            ObsidiTube Pro is a one-time lifetime license. It is not a subscription. Your license key is for your personal use only. Sharing keys or redistributing access is prohibited.
          </p>

          <h2 className="text-xl font-bold text-white">4. Disclaimer</h2>
          <p>
            ObsidiTube relies on YouTube&apos;s internal API structures. If YouTube changes their platform, this tool may break. We strive to provide updates and maintenance, but we do not guarantee indefinite uptime or compatibility with future YouTube updates.
          </p>

          <h2 className="text-xl font-bold text-white">5. Limitation of Liability</h2>
          <p>
            In no event shall GiBlok or ObsidiTube be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the materials on ObsidiTube&apos;s website.
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
