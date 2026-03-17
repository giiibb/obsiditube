import React from 'react';

export const metadata = {
  title: 'Privacy Policy | ObsidiTube',
  description: 'Privacy Policy for ObsidiTube.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto prose prose-invert prose-orange">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: March 17, 2026</p>

        <p>
          At ObsidiTube ("we", "our", or "us"), we respect your privacy and are committed to protecting 
          your personal data. This Privacy Policy explains how we collect, use, and safeguard your information 
          when you use our website (obsiditube.vercel.app) and services.
        </p>

        <h2>1. Information We Collect</h2>
        <p>We collect minimal information necessary to provide and improve our Service:</p>
        <ul>
          <li>
            <strong>Payment Information:</strong> When you purchase a Pro license, your payment is processed by our third-party payment providers (Creem for fiat, NOWPayments for crypto). We do not collect or store your credit card numbers or financial details. We only receive your email address and an order ID to generate and send your License Key.
          </li>
          <li>
            <strong>Email Address:</strong> If you purchase a Pro license or contact support, we collect your email address strictly for delivering the license key, order confirmation, and customer support.
          </li>
          <li>
            <strong>Session Cookies (Optional):</strong> If you choose to convert a private playlist, you may temporarily provide your YouTube session cookies to our backend. <strong>We do not store, log, or save these cookies.</strong> They are held in memory for the few seconds required to fetch the playlist metadata and are immediately discarded.
          </li>
          <li>
            <strong>Usage Data:</strong> We may collect anonymous, aggregated usage data (such as page views or conversion success rates) to monitor system performance and improve the user experience.
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect solely to:</p>
        <ul>
          <li>Provide, operate, and maintain the ObsidiTube service.</li>
          <li>Process transactions and send related information, including purchase confirmations and License Keys.</li>
          <li>Respond to your comments, questions, and provide customer service.</li>
        </ul>

        <h2>3. Data Sharing and Disclosure</h2>
        <p>
          We do not sell, rent, or trade your personal information to third parties. We only share information with trusted third-party service providers who assist us in operating our Service:
        </p>
        <ul>
          <li><strong>Creem.io:</strong> Acts as our Merchant of Record for fiat payments.</li>
          <li><strong>NOWPayments:</strong> Processes cryptocurrency transactions.</li>
          <li><strong>Resend:</strong> Used to send transactional emails (like your license key).</li>
          <li><strong>Upstash Redis:</strong> Used to securely store your active License Key status and temporarily cache public playlist conversion results to improve performance.</li>
        </ul>

        <h2>4. Data Retention and Security</h2>
        <p>
          We implement commercially reasonable security measures to protect your data. Your email and license key pairing are stored securely in our database (Upstash) to validate your Pro status.
        </p>
        <p>
          As stated above, if you use the Private Playlist feature, your provided cookies are <strong>never stored</strong> on our servers.
        </p>

        <h2>5. Your Rights</h2>
        <p>
          Depending on your location, you may have the right to access, correct, or delete the personal information we hold about you. If you wish to exercise these rights, or if you want us to delete your email and license key from our database, please contact us.
        </p>

        <h2>6. Third-Party Links</h2>
        <p>
          Our Service generates links to YouTube and may contain links to other websites (like Obsidian or Notion). We are not responsible for the privacy practices or content of these third-party sites.
        </p>

        <h2>7. Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or our data practices, please contact us at:
          <br />
          <strong>Email:</strong> <a href="mailto:support@giblok.com" className="text-primary hover:underline">support@giblok.com</a>
        </p>

        <div className="mt-12 pt-8 border-t border-white/10">
          <a href="/" className="text-primary hover:underline font-medium">← Back to ObsidiTube</a>
        </div>
      </div>
    </div>
  );
}
