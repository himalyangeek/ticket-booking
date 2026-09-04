/** A snake curling around continuously — used in place of plain "Loading…" text. */
export function SnakeLoader({ label, className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`flex flex-1 flex-col items-center justify-center gap-3 py-16 ${className}`}>
      <svg viewBox="0 0 100 100" className="h-20 w-20 animate-spin" style={{ animationDuration: '1.4s' }}>
        <defs>
          <linearGradient id="snake-body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2f9c42" stopOpacity="0" />
            <stop offset="100%" stopColor="#2f9c42" stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="url(#snake-body)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray="150 239"
        />
        <circle cx="50" cy="12" r="6.5" fill="#1d5f2a" />
        <circle cx="47.5" cy="10" r="1.1" fill="white" />
        <circle cx="52.5" cy="10" r="1.1" fill="white" />
      </svg>
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  )
}
