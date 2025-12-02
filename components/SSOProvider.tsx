"use client";

import { useEffect } from "react";

export function SSOProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Import SSO listener khi component mount
    import("@/lib/init-sso");
  }, []);

  return <>{children}</>;
}
