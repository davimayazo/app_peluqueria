import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines tailwind CSS classes intelligently, 
 * resolving conflicts (e.g., px-2 and p-4) without relying on the order of execution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
