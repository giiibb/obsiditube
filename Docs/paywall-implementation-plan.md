# ObsidiTube Paywall — Implementation Plan
**Brand:** GiBlok · **Product:** ObsidiTube · **Price:** $9 lifetime  
**Branch:** `feature/paywall`

---

## Research Decisions Summary

| Topic | Decision | Reason |
|---|---|---|
| Fiat payments | **Creem** | MoR (handles all taxes), 3.9% + $0.40, rich developer SDKs |
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
  [💳 Card (Creem)] [₿ Crypto (NOWPayments)] [🔑 I have a key]

On successful payment:
  → Webhook → FastAPI → generate UUID key → store in Upstash KV → email via Resend
  → User enters key → GET /api/license/validate → stored in localStorage
  → Full playlist unlocked
```

---

## New Backend Endpoints

```
POST /api/license/validate        ← validate key from user UI input
POST /api/webhooks/creem          ← fiat payment confirmed
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

---

## Required Environment Variables

```env
# Upstash KV (from Vercel dashboard → Storage → KV)
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# Creem
CREEM_API_KEY=...
CREEM_WEBHOOK_SECRET=...

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

---

## Files Already Created (do not re-create)

- `feature/paywall` branch ✅
- `src/license.py` — HMAC key generation/validation skeleton ✅ (will be replaced by Upstash approach)
