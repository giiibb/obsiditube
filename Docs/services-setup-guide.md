# Service Setup Guides — ObsidiTube Paywall

**Complete this before the next implementation session.**

---

## 1. Creem (Fiat payments)

### Create account

1. Go to [creem.io](https://creem.io) → Sign up
2. Verify email

### Get API Keys

1. Dashboard → API Keys
2. Copy your Test and Live API keys
3. Save the live key as `CREEM_API_KEY` in your `.env` file

### Create product

1. You can do this via the Creem CLI or the Dashboard.
2. Name: `ObsidiTube Pro — Lifetime Access`
3. Price: `$9.00` (900 cents) · Type: `One-time`
4. ✅ Enable **License Keys** for the product. We will generate/validate keys via Creem API.

### Set up webhook

1. Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://obsiditube.vercel.app/api/webhooks/creem`
3. Events: ✅ `checkout.completed`
4. Copy the signing secret → save as `CREEM_WEBHOOK_SECRET`

> **Note:** Creem will handle checkout sessions and webhooks. We can use the `@creem_io/nextjs` SDK in our app to easily create checkout sessions and handle webhook access grants.

---

## 2. Resend (Email for crypto payment keys)

### Create account

1. Go to [resend.com](https://resend.com) → Sign up free
2. Verify email

### Add your domain

1. Resend Dashboard → Domains → Add Domain
2. Enter: `giblok.com`
3. Add the DNS records shown (TXT + MX) to your domain registrar
4. Wait for verification (usually < 5 minutes)

### Create API key

1. API Keys → Create API Key
2. Name: `obsiditube-production`
3. Permission: `Sending access`
4. Copy key → save as `RESEND_API_KEY`

### Env var

```
RESEND_FROM=noreply@giblok.com
```

---

## 3. NOWPayments (Crypto — to your own wallet)

### Create account

1. Go to [nowpayments.io](https://nowpayments.io) → Sign up
2. Verify email

### Add your wallet addresses

1. Settings → Payout Settings
2. Add your addresses for:
   - BTC: `bc1q...` (your Bitcoin address)
   - ETH: `0x...` (your Ethereum address)
   - USDC: `0x...` (same ETH address works for USDC)
   - Add others as desired

### Get API key

1. Settings → API Keys → Generate
2. Copy → save as `NOWPAYMENTS_API_KEY`

### Set IPN secret

1. Settings → IPN Settings
2. IPN URL: `https://obsiditube.vercel.app/api/webhooks/nowpayments`
3. Generate secret → save as `NOWPAYMENTS_IPN_SECRET`

---

## 4. Upstash KV / Redis (License key storage)

### Via Vercel dashboard (easiest — recommended)

1. Go to [vercel.com](https://vercel.com) → your `obsiditube` project
2. Storage tab → Create Database
3. Select **KV** → Create
4. Name: `obsiditube-kv`
5. Vercel automatically adds these env vars to your project:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### Free tier limits

- 10,000 commands/day ← enough for early users
- 256MB storage
- No credit card required

### Alternative (standalone Upstash)

1. Go to [upstash.com](https://upstash.com) → Sign up
2. Create → Redis database → `obsiditube-kv`
3. Copy REST URL + Token → add to Vercel env vars

---

## 5. Domain (if needed)

If you don't own `giblok.com` yet:

- Register at [namecheap.com](https://namecheap.com) (~$10/yr)
- Or Cloudflare Registrar (at cost, cheapest)
- Point nameservers to where your email DNS will live

---

## Checklist Before Next Implementation Session

- [ ] Creem account created + product published
- [ ] Creem API key saved
- [ ] Creem webhook secret saved
- [ ] Resend account created + domain verified
- [ ] Resend API key saved
- [ ] NOWPayments account created + wallets added
- [ ] NOWPayments API key + IPN secret saved
- [ ] Upstash KV created via Vercel (or standalone)
- [ ] All env vars added to Vercel project settings
- [ ] `.env.local` file created locally with same vars
