"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface LicenseData {
  status: string;
  email: string;
  id: string;
  created_at?: string;
}

interface LicenseContextType {
  licenseKey: string | null;
  licenseData: LicenseData | null;
  isValid: boolean;
  isLoading: boolean;
  setLicenseKey: (key: string | null) => void;
  checkLicense: (key: string) => Promise<boolean>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export function LicenseProvider({ children }: { children: React.ReactNode }) {
  const [licenseKey, _setLicenseKey] = useState<string | null>(null);
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const setLicenseKey = (key: string | null) => {
    _setLicenseKey(key);
    if (key) {
      localStorage.setItem("obsiditube_license_key", key);
    } else {
      localStorage.removeItem("obsiditube_license_key");
      setLicenseData(null);
      setIsValid(false);
    }
  };

  const checkLicense = async (key: string): Promise<boolean> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/license/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_key: key }),
      });
      
      if (!res.ok) return false;
      
      const data = await res.json();
      if (data.valid) {
        setLicenseData(data.data);
        setIsValid(true);
        return true;
      }
    } catch (error) {
      console.error("Failed to validate license:", error);
    }
    return false;
  };

  useEffect(() => {
    const init = async () => {
      const savedKey = localStorage.getItem("obsiditube_license_key");
      if (savedKey) {
        _setLicenseKey(savedKey);
        await checkLicense(savedKey);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  return (
    <LicenseContext.Provider
      value={{
        licenseKey,
        licenseData,
        isValid,
        isLoading,
        setLicenseKey,
        checkLicense,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error("useLicense must be used within a LicenseProvider");
  }
  return context;
}
