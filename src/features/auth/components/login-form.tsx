"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { toast } from "sonner";

import { env } from "@/env.mjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});

export function LoginForm() {
  const router = useRouter();
  const { supabaseClient } = useSessionContext();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    getValues,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabaseClient.auth.signInWithPassword(values);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabaseClient.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
          },
        });
        if (error) {
          throw error;
        }
        toast.success("Check your inbox to confirm your account.");
      }

      router.replace("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to authenticate";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  });

  const handlePasswordReset = async () => {
    const email = getValues("email");
    if (!email) {
      toast.error("Enter your email first");
      return;
    }

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    });

    if (error) {
      toast.error("Unable to send reset email");
      return;
    }

    toast.success("Password reset email sent");
  };

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <button
          className="underline-offset-2 hover:underline"
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
        <button
          className="text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
          type="button"
          onClick={handlePasswordReset}
        >
          Forgot password?
        </button>
      </div>

      <Button className="w-full" type="submit" disabled={loading}>
        {loading ? "Please wait" : mode === "signin" ? "Sign in" : "Create account"}
      </Button>
    </form>
  );
}
