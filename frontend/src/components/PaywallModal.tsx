"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useLicense } from "./LicenseContext";
import { toast } from "sonner";
import { 
  CreditCard, 
  Bitcoin, 
  Key, 
  Loader2, 
  Zap,
  Infinity,
  Download,
  ShieldCheck
} from "lucide-react";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  const [activeTab, setActiveTab] = useState<"card" | "crypto" | "key">("card");
  const [inputKey, setInputKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const { checkLicense, setLicenseKey } = useLicense();

  if (!isOpen) return null;

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    
    setIsValidating(true);
    const valid = await checkLicense(inputKey.trim());
    setIsValidating(false);
    
    if (valid) {
      setLicenseKey(inputKey.trim());
      toast.success("License activated! Unlimited access unlocked.");
      onClose();
    } else {
      toast.error("Invalid or expired license key.");
    }
  };

  const handleCreemCheckout = () => {
    // In production, this would call our backend to get a checkout URL
    // For now, redirect to the product page or use the API
    toast.info("Redirecting to secure checkout...");
    window.open("https://creem.io/p/prod_obsiditube", "_blank");
  };

  const FEATURES = [
    { icon: <Infinity className="h-4 w-4 text-primary" />, text: "Unlimited videos per playlist" },
    { icon: <Download className="h-4 w-4 text-primary" />, text: "Markdown, CSV, and JSON exports" },
    { icon: <Zap className="h-4 w-4 text-primary" />, text: "Priority parsing speed" },
    { icon: <ShieldCheck className="h-4 w-4 text-primary" />, text: "Lifetime access — no subscriptions" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-b border-white/5 flex items-center justify-center">
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
              ✕
            </Button>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold mb-2">
              <Zap className="h-3 w-3 fill-current" />
              OBSIDITUBE PRO
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Unlock Full Power</h2>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-8">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <span className="text-sm text-muted-foreground">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="flex p-1 bg-background/50 rounded-xl border border-white/5 mb-6">
            <button
              onClick={() => setActiveTab("card")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "card" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Card
            </button>
            <button
              onClick={() => setActiveTab("crypto")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "crypto" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
              }`}
            >
              <Bitcoin className="h-4 w-4" />
              Crypto
            </button>
            <button
              onClick={() => setActiveTab("key")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "key" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
              }`}
            >
              <Key className="h-4 w-4" />
              Redeem
            </button>
          </div>

          {activeTab === "card" && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="text-center space-y-2 mb-6">
                <div className="text-4xl font-extrabold text-white">$9<span className="text-lg font-normal text-muted-foreground">/lifetime</span></div>
                <p className="text-sm text-muted-foreground">One-time payment. All future updates included.</p>
              </div>
              <Button onClick={handleCreemCheckout} className="w-full h-12 text-lg font-bold bg-white text-black hover:bg-white/90">
                Continue with Creem.io
              </Button>
              <p className="text-[10px] text-center text-muted-foreground/60 uppercase tracking-widest">
                Secure checkout · Global taxes handled by Creem
              </p>
            </div>
          )}

          {activeTab === "crypto" && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="text-center space-y-2 mb-6">
                <div className="text-3xl font-bold text-white">Pay with Crypto</div>
                <p className="text-sm text-muted-foreground">BTC, ETH, SOL, USDC & 300+ more.</p>
              </div>
              <Button variant="outline" className="w-full h-12 text-lg border-primary/50 hover:bg-primary/10">
                Pay via NOWPayments
              </Button>
              <p className="text-[10px] text-center text-muted-foreground/60 uppercase tracking-widest">
                License sent to your email after 1 confirmation
              </p>
            </div>
          )}

          {activeTab === "key" && (
            <form onSubmit={handleKeySubmit} className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <Label htmlFor="license-key">License Key</Label>
                <Input
                  id="license-key"
                  placeholder="OT-XXXX-XXXX-XXXX"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="h-12 bg-background border-white/10 font-mono text-center tracking-widest"
                />
              </div>
              <Button type="submit" disabled={isValidating} className="w-full h-12 bg-primary">
                {isValidating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Activate Pro"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
