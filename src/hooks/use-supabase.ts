"use client";

import { useSessionContext } from "@supabase/auth-helpers-react";

export function useSupabase() {
  const { supabaseClient } = useSessionContext();
  return supabaseClient;
}
