import { redirect } from "next/navigation";

import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function UpdatePasswordPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return <UpdatePasswordForm />;
}
