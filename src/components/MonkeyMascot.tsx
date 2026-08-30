interface MonkeyMascotProps {
  /** Is any tracked field currently focused? Drives the "watching" vs "looking down" pose. */
  focused: boolean
  /** 0 (start of field) .. 1 (end of field) — how far along the text the caret is. */
  gazeRatio: number
  /** Is the focused field currently failing validation? */
  invalid: boolean
}

export function MonkeyMascot({ focused, gazeRatio, invalid }: MonkeyMascotProps) {
  const mood = !focused ? 'idle' : invalid ? 'upset' : 'happy'

  // The whole head slides left-to-right as you type, tracking the caret position —
  // not just the eyes, so it visibly follows what you're writing.
  const headX = focused ? (gazeRatio - 0.5) * 22 : 0
  const eyeY = focused ? 5 : -4

  return (
    <svg
      viewBox="0 0 200 190"
      className="mx-auto h-28 w-28 select-none"
      role="img"
      aria-label={mood === 'upset' ? 'Monkey looking concerned' : mood === 'happy' ? 'Monkey looking happy' : 'Monkey watching'}
    >
      {/* hanging arms, fixed — the head is the part that tracks typing */}
      <path d="M55 150 Q35 120 48 90" stroke="#8a5a34" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d="M145 150 Q165 120 152 90" stroke="#8a5a34" strokeWidth="14" fill="none" strokeLinecap="round" />

      <g style={{ transform: `translateX(${headX}px)`, transition: 'transform 0.15s ease-out' }}>
        {/* ears */}
        <circle cx="40" cy="82" r="24" fill="#6b4226" />
        <circle cx="160" cy="82" r="24" fill="#6b4226" />
        <circle cx="40" cy="82" r="12" fill="#e8c39e" />
        <circle cx="160" cy="82" r="12" fill="#e8c39e" />

        {/* head + muzzle */}
        <circle cx="100" cy="88" r="62" fill="#8a5a34" />
        <ellipse cx="100" cy="112" rx="42" ry="34" fill="#e8c39e" />
        {/* tuft of hair */}
        <path d="M76 34 Q100 14 124 34" stroke="#6b4226" strokeWidth="8" fill="none" strokeLinecap="round" />

        {/* eyebrows */}
        <path
          d={invalid && focused ? 'M64 62 Q76 74 88 64' : 'M64 64 Q76 54 88 62'}
          stroke="#3a2416"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={invalid && focused ? 'M112 64 Q124 74 136 62' : 'M112 62 Q124 54 136 64'}
          stroke="#3a2416"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* eyes — small vertical shift for "looking down" at the input */}
        <ellipse cx="76" cy="88" rx="13" ry="15" fill="white" />
        <ellipse cx="124" cy="88" rx="13" ry="15" fill="white" />
        <circle cx="76" cy={88 + eyeY * 0.6} r="6" fill="#2b1a10" style={{ transition: 'cy 0.15s ease-out' }} />
        <circle cx="124" cy={88 + eyeY * 0.6} r="6" fill="#2b1a10" style={{ transition: 'cy 0.15s ease-out' }} />

        {/* nostrils */}
        <ellipse cx="92" cy="118" rx="3.5" ry="2.5" fill="#6b4226" />
        <ellipse cx="108" cy="118" rx="3.5" ry="2.5" fill="#6b4226" />

        {/* mouth */}
        {mood === 'happy' && (
          <path d="M80 130 Q100 150 120 130" stroke="#3a2416" strokeWidth="5" strokeLinecap="round" fill="none" />
        )}
        {mood === 'upset' && (
          <path d="M80 140 Q100 122 120 140" stroke="#3a2416" strokeWidth="5" strokeLinecap="round" fill="none" />
        )}
        {mood === 'idle' && (
          <path d="M84 132 Q100 136 116 132" stroke="#3a2416" strokeWidth="5" strokeLinecap="round" fill="none" />
        )}
      </g>
    </svg>
  )
}
