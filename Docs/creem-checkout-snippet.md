# Creem.io Checkout Integration Snippet

This file contains the technical implementation for creating a checkout session and the marketing description for your product.

## 1. Implementation Code (Express.js)

```typescript
import express, { Request, Response } from 'express';
import axios from 'axios';
  
const app = express();
const port = 3000;
  
app.get('/checkout', async (req: Request, res: Response) => {
    try {
        const response = await axios.post(
          `https://api.creem.io/v1/checkouts`,
          {
            "product_id": "prod_5XLEBdzjnvAmZG7MRbTszY" // Replace with your Product ID
          },
          {
            headers: { "x-api-key": `creem_123456789` }, // Replace with your API Key
          }
        );
        
        // Redirect to the checkout URL
        res.redirect(response.data.checkout_url);
    } catch (error) {
        console.error("Error creating checkout:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
```

---

## 2. Product Description Reference (For Creem Dashboard)

**Title:** ObsidiTube Pro — Lifetime License
**Short Description:** Unlock unlimited YouTube playlist conversions with rich metadata for Obsidian and Notion. Lifetime access, one-time payment.

### Full Description:
**Transform your YouTube research into actionable notes.**

ObsidiTube Pro is the ultimate companion for students, researchers, and power-users who use Obsidian or Notion to manage their learning.

**🚀 What you unlock with Pro:**
*   **Unlimited Everything:** Convert playlists of any length. No more 10-video limits.
*   **Rich Metadata:** Every card automatically includes **Duration**, **View Count**, and **Publish Date**.
*   **Obsidian Properties (YAML):** Files start with full YAML frontmatter (description, views, etc).
*   **Advanced Exports:** Unlocks high-fidelity **CSV** and **JSON** exports.
*   **Lifetime Access:** Pay once, own it forever.

**🛡️ Privacy First:**
ObsidiTube processes your data in-memory and never stores your playlist URLs or generated cards.
