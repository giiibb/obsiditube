import React from 'react';

export const metadata = {
  title: 'Terms of Service | ObsidiTube',
  description: 'Terms of Service for ObsidiTube.',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto prose prose-invert prose-orange">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: March 17, 2026</p>

        <p>
          Welcome to ObsidiTube ("we", "our", or "us"). By accessing or using our website
          at obsiditube.vercel.app (the "Service"), you agree to be bound by these Terms
          of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
        </p>

        <h2>1. Description of Service</h2>
        <p>
          ObsidiTube is a digital utility tool that converts YouTube playlist URLs into formatted
          Markdown checklist cards, specifically optimized for Obsidian and Notion. 
        </p>
        <p>
          <strong>Important Disclaimer:</strong> ObsidiTube is strictly a metadata formatting tool. 
          <strong> It does NOT download, rip, store, or distribute any video, audio, or copyrighted media content from YouTube or any other platform.</strong> 
          It only retrieves publicly available (or user-authenticated) metadata (such as video titles, URLs, and thumbnails) to generate a text-based (Markdown) document.
        </p>

        <h2>2. Independence and Affiliation</h2>
        <p>
          ObsidiTube is an independent tool created by GiBlok. We are <strong>not affiliated, associated, authorized, endorsed by, or in any way officially connected with YouTube, Google LLC, Obsidian, or Notion</strong>. 
          All product and company names are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.
        </p>

        <h2>3. Pro License (Lifetime Access)</h2>
        <p>
          The free tier of ObsidiTube limits playlist conversion to the first 10 videos.
          We offer a "Pro" license for a one-time fee, granting lifetime access to convert playlists of unlimited size.
        </p>
        <ul>
          <li><strong>Payments:</strong> Payments are securely processed via our Merchant of Record, Creem (fiat), or NOWPayments (crypto). By purchasing, you agree to their respective terms.</li>
          <li><strong>License Key:</strong> Upon purchase, you will receive a digital License Key. You are responsible for keeping this key confidential.</li>
          <li><strong>Lifetime Access:</strong> "Lifetime" refers to the lifetime of the ObsidiTube service. As long as the service is operational, your key will remain valid.</li>
        </ul>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Violate any applicable local, state, national, or international law.</li>
          <li>Attempt to exploit, bypass, or reverse-engineer the Service's limitations or licensing system.</li>
          <li>Overload, spam, or perform denial-of-service attacks on our infrastructure.</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <p>
          The generated Markdown code is yours to use freely. The ObsidiTube software, UI design, branding, and logos are the intellectual property of GiBlok. You may not copy, modify, or distribute our proprietary code or designs without explicit permission.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties that the Service will be uninterrupted, error-free, or completely secure. 
          Because we rely on third-party structures (like YouTube's page structure), the service may occasionally experience downtime or require updates to maintain functionality. 
          We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
        </p>

        <h2>7. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify users of any significant changes by updating the "Last Updated" date at the top of this page.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have any questions, support requests, or issues regarding these Terms, please contact us at:
          <br />
          <strong>Email:</strong> <a href="mailto:support@giblok.com" className="text-primary hover:underline">support@giblok.com</a>
        </p>
        <p>We aim to respond to all inquiries within 3 business days.</p>
        
        <div className="mt-12 pt-8 border-t border-white/10">
          <a href="/" className="text-primary hover:underline font-medium">← Back to ObsidiTube</a>
        </div>
      </div>
    </div>
  );
}
