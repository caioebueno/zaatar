"use client";

import {
  clearStoredCustomerSession,
  getStoredCustomerSession,
  setStoredCustomerSession,
} from "@/utils/customerSession";
import { useEffect } from "react";

const CustomerAuthSessionBootstrap: React.FC = () => {
  useEffect(() => {
    let cancelled = false;

    const refreshSession = async () => {
      const storedSession = getStoredCustomerSession();
      const accessToken = storedSession?.accessToken;

      if (!accessToken) return;

      try {
        const response = await fetch("/api/customers/auth/token/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessToken,
          }),
        });

        if (!response.ok) {
          if (!cancelled) {
            clearStoredCustomerSession();
          }
          return;
        }

        const data = (await response.json()) as {
          accessToken?: unknown;
          expiresAt?: unknown;
        };

        if (
          cancelled ||
          !data ||
          typeof data !== "object" ||
          typeof data.accessToken !== "string" ||
          typeof data.expiresAt !== "string"
        ) {
          return;
        }

        setStoredCustomerSession({
          accessToken: data.accessToken,
          accessTokenExpiresAt: data.expiresAt,
        });
      } catch (error) {
        console.error("Failed to refresh customer access token", error);
      }
    };

    refreshSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
};

export default CustomerAuthSessionBootstrap;
