import React from 'react';

export const metadata = {
  title: 'Refund Policy | ObsidiTube',
  description: 'Refund Policy for ObsidiTube.',
};

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto prose prose-invert prose-orange">
        <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: March 17, 2026</p>

        <p>
          Thank you for purchasing ObsidiTube Pro. We want to ensure you have a great experience with our tool. 
          Please read this policy carefully regarding refunds for our digital product.
        </p>

        <h2>1. 14-Day Money-Back Guarantee</h2>
        <p>
          We stand behind the quality of ObsidiTube. If you are not completely satisfied with your purchase, 
          we offer a <strong>14-day money-back guarantee</strong> for all purchases made via fiat currency (credit card/PayPal).
        </p>
        <p>
          If you experience technical issues that we cannot resolve, or if the tool does not meet your expectations, 
          you may request a full refund within 14 days of your original purchase date.
        </p>

        <h2>2. How to Request a Refund</h2>
        <p>To request a refund, please follow these steps:</p>
        <ol>
          <li>Email our support team at <strong>giblok@tuta.io</strong>.</li>
          <li>Include the email address you used to make the purchase and your Order ID or License Key.</li>
          <li>(Optional) Let us know why you are requesting a refund so we can improve the product.</li>
        </ol>
        <p>We aim to process all refund requests within 3 business days.</p>

        <h2>3. Exceptions and Non-Refundable Purchases</h2>
        <ul>
          <li><strong>Cryptocurrency Purchases:</strong> Due to the nature of blockchain transactions and network fees, purchases made via cryptocurrency (NOWPayments) are generally <strong>non-refundable</strong>. Please test the free version of the app thoroughly before purchasing with crypto.</li>
          <li><strong>After 14 Days:</strong> Refund requests submitted after the 14-day window will not be granted.</li>
          <li><strong>Abuse of Policy:</strong> We reserve the right to deny a refund if we detect abuse of this policy (e.g., purchasing, downloading massive amounts of data, and immediately refunding).</li>
        </ul>

        <h2>4. License Revocation</h2>
        <p>
          Upon the issuance of a refund, your ObsidiTube Pro License Key will be immediately revoked and deactivated. 
          Your account will revert to the Free Tier limits (10 videos per playlist).
        </p>

        <h2>5. Contact Us</h2>
        <p>
          If you have any questions about our refund policy, please reach out to us at:
          <br />
          <strong>Email:</strong> <a href="mailto:giblok@tuta.io" className="text-primary hover:underline">giblok@tuta.io</a>
        </p>

        <div className="mt-12 pt-8 border-t border-white/10">
          <a href="/" className="text-primary hover:underline font-medium">← Back to ObsidiTube</a>
        </div>
      </div>
    </div>
  );
}
