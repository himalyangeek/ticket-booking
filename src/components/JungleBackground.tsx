import type { CSSProperties } from 'react'

interface TreeProps {
  x: number
  scale: number
  delay: number
}

function Tree({ x, scale, delay }: TreeProps) {
  return (
    <g
      transform={`translate(${x}, 900) scale(${scale})`}
      className="animate-canopy-sway"
      style={{ transformOrigin: '0px 0px', animationDelay: `${delay}s` }}
    >
      <rect x="-14" y="-180" width="28" height="180" rx="8" fill="#4f2f1a" />
      <ellipse cx="0" cy="-230" rx="110" ry="80" fill="#1d5f2a" />
      <ellipse cx="-55" cy="-190" rx="75" ry="60" fill="#237a33" />
      <ellipse cx="60" cy="-195" rx="80" ry="65" fill="#237a33" />
      <ellipse cx="0" cy="-260" rx="70" ry="50" fill="#2f9c42" opacity="0.8" />
    </g>
  )
}

interface VineProps {
  x: number
  length: number
  delay: number
}

function Vine({ x, length, delay }: VineProps) {
  return (
    <g className="animate-[vine-sway_5s_ease-in-out_infinite]" style={{ transformOrigin: `${x}px 0px`, animationDelay: `${delay}s` }}>
      <path d={`M${x} 0 Q${x + 20} ${length / 2} ${x} ${length}`} stroke="#2f9c42" strokeWidth="5" fill="none" />
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <ellipse key={f} cx={x + (f % 0.5 === 0 ? 12 : -12)} cy={length * f} rx="14" ry="9" fill="#4bb85e" />
      ))}
    </g>
  )
}

interface MonkeyProps {
  hopX?: number
  hopY?: number
  duration: number
  delay: number
  watching: boolean
  mode: 'hop' | 'climb'
}

function Monkey({ hopX = 30, hopY = -40, duration, delay, watching, mode }: MonkeyProps) {
  const animStyle: CSSProperties = {
    ['--hop-x' as string]: `${hopX}px`,
    ['--hop-y' as string]: `${hopY}px`,
    animationName: mode === 'hop' ? 'monkey-hop' : 'vine-climb',
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
    animationIterationCount: 'infinite',
    animationDirection: mode === 'climb' ? 'alternate' : 'normal',
    animationTimingFunction: 'ease-in-out',
    animationPlayState: watching ? 'paused' : 'running',
  }

  return (
    <g style={animStyle}>
      {/* jumping / climbing pose — side profile, mid-motion */}
      <g style={{ opacity: watching ? 0 : 1, transition: 'opacity 0.35s ease' }}>
        <ellipse cx="0" cy="10" rx="10" ry="13" fill="#8a5a34" />
        <circle cx="0" cy="-10" r="11" fill="#8a5a34" />
        <circle cx="0" cy="-10" r="6" fill="#e8c39e" />
        <circle cx="-3" cy="-11" r="1.3" fill="#2b1a10" />
        <circle cx="3" cy="-11" r="1.3" fill="#2b1a10" />
        <path d="M10 4 Q22 -4 16 -18" stroke="#8a5a34" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M-8 18 Q-18 30 -10 42" stroke="#8a5a34" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>

      {/* watching pose — sitting, facing forward */}
      <g style={{ opacity: watching ? 1 : 0, transition: 'opacity 0.35s ease' }}>
        <ellipse cx="0" cy="12" rx="13" ry="11" fill="#8a5a34" />
        <circle cx="-11" cy="-4" r="7" fill="#8a5a34" />
        <circle cx="11" cy="-4" r="7" fill="#8a5a34" />
        <circle cx="0" cy="-6" r="12" fill="#8a5a34" />
        <ellipse cx="0" cy="-3" rx="7" ry="6" fill="#e8c39e" />
        <circle cx="-3" cy="-5" r="1.4" fill="#2b1a10" />
        <circle cx="3" cy="-5" r="1.4" fill="#2b1a10" />
      </g>
    </g>
  )
}

export function JungleBackground({ watching = false }: { watching?: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
        <defs>
          <radialGradient id="canopy-light" cx="50%" cy="10%" r="70%">
            <stop offset="0%" stopColor="#2f9c42" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#123a1c" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#184b24" />
            <stop offset="100%" stopColor="#0d2a14" />
          </linearGradient>
        </defs>

        <rect width="1600" height="900" fill="url(#sky)" />
        <rect width="1600" height="900" fill="url(#canopy-light)" />

        {/* soft depth blobs */}
        <ellipse cx="200" cy="80" rx="260" ry="120" fill="#1d5f2a" opacity="0.5" />
        <ellipse cx="900" cy="40" rx="320" ry="130" fill="#1d5f2a" opacity="0.4" />
        <ellipse cx="1400" cy="100" rx="260" ry="110" fill="#1d5f2a" opacity="0.5" />

        <Vine x={260} length={260} delay={0} />
        <Vine x={820} length={220} delay={1.2} />
        <Vine x={1320} length={280} delay={0.6} />

        <Tree x={90} scale={0.9} delay={0} />
        <Tree x={380} scale={1.1} delay={0.4} />
        <Tree x={700} scale={0.8} delay={0.8} />
        <Tree x={980} scale={1.15} delay={0.2} />
        <Tree x={1260} scale={0.95} delay={0.6} />
        <Tree x={1520} scale={1.05} delay={1} />

        <g transform="translate(150, 640)">
          <Monkey hopX={110} hopY={-70} duration={3.4} delay={0} watching={watching} mode="hop" />
        </g>
        <g transform="translate(520, 660)">
          <Monkey hopX={-90} hopY={-55} duration={2.8} delay={0.6} watching={watching} mode="hop" />
        </g>
        <g transform="translate(1050, 650)">
          <Monkey hopX={100} hopY={-60} duration={3.1} delay={1.1} watching={watching} mode="hop" />
        </g>
        <g transform="translate(1420, 670)">
          <Monkey hopX={-80} hopY={-45} duration={2.5} delay={0.3} watching={watching} mode="hop" />
        </g>

        <g transform="translate(260, 300)">
          <Monkey duration={4} delay={0} watching={watching} mode="climb" />
        </g>
        <g transform="translate(1320, 260)">
          <Monkey duration={3.6} delay={1.4} watching={watching} mode="climb" />
        </g>
      </svg>
    </div>
  )
}
