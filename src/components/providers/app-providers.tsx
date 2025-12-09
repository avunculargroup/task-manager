"use client";

import { Toaster } from "sonner";

import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SupabaseProvider } from "@/components/providers/supabase-provider";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SupabaseProvider>
      <QueryProvider>
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="bottom-right" />
      </QueryProvider>
    </SupabaseProvider>
  );
}
