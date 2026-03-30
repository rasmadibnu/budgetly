"use client";

import * as React from "react";

export function useOfflineStatus() {
  const [isOffline, setIsOffline] = React.useState(false);

  React.useEffect(() => {
    const updateStatus = () => setIsOffline(!window.navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return isOffline;
}
