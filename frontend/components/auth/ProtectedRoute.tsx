"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { Role } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, hasRole } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait until hydration finishes before checking auth
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated) {
      // Redirect to login preserving the intent
      router.push(`/login?redirect=${pathname}`);
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const hasAccess = allowedRoles.some(role => hasRole(role));
      if (!hasAccess) {
        // Redirige al inicio o a una página de No Autorizado
        router.push("/");
      }
    }
  }, [isAuthenticated, hasRole, allowedRoles, router, pathname, isReady]);

  if (!isReady) return <div className="min-h-screen flex items-center justify-center bg-[#0d0c11]"><div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div></div>;

  if (!isAuthenticated) return null;

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some(role => hasRole(role));
    if (!hasAccess) return null;
  }

  return <>{children}</>;
}
