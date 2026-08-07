import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils";

/**
 * ComponentPropsWithRef rather than InputHTMLAttributes: React 19 passes `ref` as an
 * ordinary prop to function components, so forwardRef is unnecessary - but the props type
 * still has to declare it or callers cannot pass one.
 */
export function Input({ className, type, ...props }: ComponentPropsWithRef<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        "ring-offset-background placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
