import type { ReactNode } from "react"

// Flat, thick-stroked vector art. Fills use the `art-*` theme colours, so in
// the black & white theme they become white / grey / black automatically.

function starPoints(cx: number, cy: number, r: number, inner = 0.45) {
  return Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * inner
    const angle = (Math.PI / 5) * i - Math.PI / 2
    return `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`
  }).join(" ")
}

function Star(props: { x: number; y: number; r: number; className: string }) {
  return (
    <polygon
      points={starPoints(props.x, props.y, props.r)}
      className={props.className}
    />
  )
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className="size-full stroke-ink"
      strokeWidth={5}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

function Trophy() {
  return (
    <Frame>
      <path d="M62 50 H40 Q34 92 70 98" className="fill-none" />
      <path d="M138 50 H160 Q166 92 130 98" className="fill-none" />
      <path
        d="M60 36 H140 V78 Q140 122 100 126 Q60 122 60 78 Z"
        className="fill-art-1"
      />
      <rect x="90" y="126" width="20" height="24" className="fill-art-1" />
      <rect
        x="62"
        y="150"
        width="76"
        height="22"
        rx="5"
        className="fill-art-3"
      />
      <Star x={100} y={78} r={20} className="fill-paper" />
      <Star x={28} y={28} r={14} className="fill-art-2" />
      <Star x={172} y={28} r={14} className="fill-art-2" />
      <Star x={26} y={150} r={11} className="fill-art-4" />
      <Star x={174} y={150} r={11} className="fill-art-4" />
    </Frame>
  )
}

function HappyStar() {
  return (
    <Frame>
      <Star x={100} y={108} r={86} className="fill-art-1" />
      <circle cx="84" cy="102" r="7" className="fill-ink" />
      <circle cx="116" cy="102" r="7" className="fill-ink" />
      <path d="M82 124 Q100 142 118 124" className="fill-none" />
      <circle cx="70" cy="122" r="7" className="fill-art-2" strokeWidth={0} />
      <circle cx="130" cy="122" r="7" className="fill-art-2" strokeWidth={0} />
      <Star x={24} y={30} r={12} className="fill-art-3" />
      <Star x={178} y={36} r={10} className="fill-art-4" />
      <Star x={176} y={176} r={12} className="fill-art-3" />
    </Frame>
  )
}

function Balloons() {
  return (
    <Frame>
      <path
        d="M64 104 Q78 140 100 170 M100 92 V170 M138 108 Q122 140 100 170"
        className="fill-none"
        strokeWidth={3}
      />
      <ellipse cx="64" cy="70" rx="28" ry="34" className="fill-art-2" />
      <ellipse cx="138" cy="74" rx="28" ry="34" className="fill-art-3" />
      <ellipse cx="100" cy="56" rx="30" ry="36" className="fill-art-1" />
      <path d="M90 170 L100 160 L110 170 L100 180 Z" className="fill-art-4" />
      <rect
        x="22"
        y="150"
        width="10"
        height="10"
        transform="rotate(20 27 155)"
        className="fill-art-4"
        strokeWidth={3}
      />
      <rect
        x="166"
        y="140"
        width="10"
        height="10"
        transform="rotate(-25 171 145)"
        className="fill-art-1"
        strokeWidth={3}
      />
      <circle cx="40" cy="186" r="5" className="fill-art-3" strokeWidth={3} />
      <circle cx="160" cy="184" r="5" className="fill-art-2" strokeWidth={3} />
      <Star x={22} y={24} r={10} className="fill-art-4" />
      <Star x={180} y={22} r={10} className="fill-art-1" />
    </Frame>
  )
}

export const CELEBRATIONS = [Trophy, HappyStar, Balloons]
