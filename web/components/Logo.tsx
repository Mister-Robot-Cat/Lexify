/** Temporary wordmark. Swap this one component when the real logo is ready. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--color-ink)" />
      <rect x="8" y="17" width="4" height="7" rx="1.5" fill="var(--color-amber)" opacity="0.55" />
      <rect x="14" y="13" width="4" height="11" rx="1.5" fill="var(--color-amber)" opacity="0.8" />
      <rect x="20" y="8" width="4" height="16" rx="1.5" fill="var(--color-amber)" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="font-display text-xl font-semibold tracking-tight text-ink">Lexify</span>
    </span>
  );
}
