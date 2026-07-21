import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-6 w-6", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2 3h20L12 21 2 3Z" fill="url(#meta-logo-gradient)" />
      <defs>
        <linearGradient id="meta-logo-gradient" x1="2" y1="3" x2="22" y2="21">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-bold", className)}>
      Meta<LogoMark />
    </span>
  );
}
