export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Taskline</p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500">
            Sign in to stay in sync with your team.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          {children}
        </div>
        <p className="text-center text-xs text-slate-500">
          Protected by Supabase Auth · RLS-safe
        </p>
      </div>
    </div>
  );
}
