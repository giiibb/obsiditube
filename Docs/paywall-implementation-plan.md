# ObsidiTube Paywall — Implementation Plan
**Brand:** GiBlok · **Product:** ObsidiTube · **Price:** $9 lifetime  
**Branch:** `feature/paywall`

---

## Research Decisions Summary

| Topic | Decision | Reason |
|---|---|---|
| Fiat payments | **LemonSqueezy** | MoR (handles all taxes), built-in license key emails, 5% + $0.50 |
| Crypto payments | **NOWPayments** | No KYC, 300+ coins, 0.5% fee, funds to your own wallet |
| Email (SMTP) | **Resend** | Free 3,000/mo, developer-first, only needed for crypto key delivery |
| License key storage | **Upstash KV (Redis)** | Serverless, revocable, Vercel 1-click integration, free 10k cmds/day |
| Free tier | **10 videos shown** | First 10 cards shown, then paywall modal appears |

---

## Pro Features ($9 Lifetime "GiBlok Pro")

| Feature | Free | Pro |
|---|---|---|
| Videos per playlist | 10 | ♾️ Unlimited |
| Obsidian cardlink export | ✅ | ✅ |
| Notion export | ✅ | ✅ |
| Markdown export (.md) | ❌ | ✅ |
| CSV export | ❌ | ✅ |
| JSON export | ❌ | ✅ |
| Priority support | ❌ | ✅ |
| All future features | ❌ | ✅ |

---

## Architecture

```
User submits playlist
  → Backend fetches all videos, returns first 10 without valid key
  → Frontend shows 10 cards + "X more locked" banner
  → PaywallModal opens (3 tabs)

PaywallModal:
  [💳 Card (LemonSqueezy)] [₿ Crypto (NOWPayments)] [🔑 I have a key]

On successful payment:
  → Webhook → FastAPI → generate UUID key → store in Upstash KV → email via Resend
  → User enters key → GET /api/license/validate → stored in localStorage
  → Full playlist unlocked
```

---

## New Backend Endpoints

```
POST /api/license/validate        ← validate key from user UI input
POST /api/webhooks/lemonsqueezy   ← fiat payment confirmed
POST /api/webhooks/nowpayments    ← crypto payment confirmed

MODIFIED:
POST /api/convert                 ← now checks X-License-Key header
                                     returns truncated:bool + total_count:int
```

---

## New Frontend Components

| File | Purpose |
|---|---|
| `components/PaywallModal.tsx` | 3-tab upgrade modal |
| `components/ProBanner.tsx` | "X more locked · Unlock $9" in-panel banner |
| `components/Footer.tsx` | GiBlok footer with legal links |
| `app/terms/page.tsx` | Terms of Service |
| `app/privacy/page.tsx` | Privacy Policy |
| `app/refund/page.tsx` | Refund Policy |

---

## Required Environment Variables

```env
# Upstash KV (from Vercel dashboard → Storage → KV)
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# LemonSqueezy
LEMONSQUEEZY_WEBHOOK_SECRET=...
LEMONSQUEEZY_CHECKOUT_URL=https://giblok.lemonsqueezy.com/buy/...

# NOWPayments
NOWPAYMENTS_API_KEY=...
NOWPAYMENTS_IPN_SECRET=...

# Resend (for crypto payment key emails)
RESEND_API_KEY=re_...
RESEND_FROM=noreply@giblok.com

# App
APP_URL=https://obsiditube.vercel.app
```

---

## Footer (GiBlok brand)

- Logo + tagline: *"Simple tools for focused people"*
- Links: Terms · Privacy · Refund Policy · GitHub
- Payment icons: Visa, MC, Apple Pay, BTC, ETH, USDC
- Copyright: `© 2026 GiBlok. All rights reserved.`

---

## Files Already Created (do not re-create)

- `feature/paywall` branch ✅
- `src/license.py` — HMAC key generation/validation skeleton ✅ (will be replaced by Upstash approach)
