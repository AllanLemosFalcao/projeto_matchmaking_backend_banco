/** Faixa ondulada usada como divisor no design. */
export function Onda({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className={`block w-full ${className}`} aria-hidden>
      <path
        d="M0 40 C 120 0, 240 0, 360 30 S 600 70, 720 40 S 960 0, 1080 30 S 1320 70, 1440 32 V80 H0 Z"
        fill="currentColor"
      />
    </svg>
  )
}
