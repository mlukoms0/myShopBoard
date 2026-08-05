import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Placeholder shaped like the content it replaces.
 *
 * Deliberately NO pulse animation: a whole page of pulsing blocks is more distracting than
 * a still one, and on a shop-floor tablet in bright light it reads as broken. Same call
 * myStorage made.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-md bg-muted", className)} {...props} />;
}
