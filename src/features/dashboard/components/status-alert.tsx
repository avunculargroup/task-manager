import { cn } from "@/lib/utils";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
}

export function Alert({
  className,
  variant = "default",
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        variant === "destructive"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-slate-200 bg-white text-slate-900",
        className
      )}
      {...props}
    />
  );
}

export function AlertTitle({ children }: { children: React.ReactNode }) {
  return <p className="font-semibold">{children}</p>;
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-600">{children}</p>;
}
