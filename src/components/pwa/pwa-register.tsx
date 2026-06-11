"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (
      !("serviceWorker" in navigator) ||
      window.location.protocol !== "https:"
    ) {
      if (window.location.hostname !== "localhost") {
        return;
      }
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // Service worker install should never block the QR generator UI.
      }
    };

    register();
  }, []);

  return null;
}
