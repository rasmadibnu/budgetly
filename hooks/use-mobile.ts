"use client";

import * as React from "react";

export function useMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mediaQuery.matches);
    onChange();
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isMobile;
}
