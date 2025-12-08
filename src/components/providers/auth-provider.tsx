"use client";

import { useSessionContext } from "@supabase/auth-helpers-react";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { logError } from "@/lib/logging";
import type { Profile } from "@/types/database";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, supabaseClient } = useSessionContext();
  const user = session?.user ?? null;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      logError("Failed to fetch profile", { error: error.message });
      toast.error("Couldn't fetch your profile. Retrying...");
    }

    setProfile(data ?? null);
    setLoading(false);
  }, [supabaseClient, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const { data: listener } = supabaseClient.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabaseClient, fetchProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      toast.error("Could not sign out. Please try again.");
      logError("Failed to sign out", { error: error.message });
      return;
    }
  }, [supabaseClient]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile: fetchProfile,
      signOut,
    }),
    [user, profile, loading, fetchProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
