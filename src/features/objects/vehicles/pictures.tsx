import type { ReactNode } from "react"

// Vehicles in one style: flat side views with thick ink outlines on a
// 100 × 100 canvas, ground at y ≈ 80. Fills use the `art-*` theme colours, so
// in the black & white theme each vehicle reads by its shape alone.

function Frame({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-full stroke-ink"
      strokeWidth={3}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

function Wheel({ x, y = 72, r = 9 }: { x: number; y?: number; r?: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={r} className="fill-ink" />
      <circle cx={x} cy={y} r={r * 0.4} className="fill-paper" />
    </>
  )
}

/** A thick outlined bar along a polyline (ladder rails, arms, frames). */
function Bar({
  d,
  width = 6,
  fill = "stroke-art-1",
}: {
  d: string
  width?: number
  fill?: string
}) {
  return (
    <>
      <path d={d} className="fill-none" strokeWidth={width + 6} />
      <path d={d} className={`fill-none ${fill}`} strokeWidth={width} />
    </>
  )
}

function Waves() {
  return (
    <path
      d="M4 90 Q11 85 18 90 T32 90 T46 90 T60 90 T74 90 T88 90 T102 90"
      className="fill-none stroke-art-3"
      strokeWidth={4}
    />
  )
}

/** Sedan body shared by the taxi and the police car. */
function Sedan({ body }: { body: string }) {
  return (
    <>
      <path
        d="M6 72 V60 Q6 53 14 52 L27 50 L37 37 Q40 34 45 34 H65 Q70 34 73 38 L83 50 Q94 52 94 60 V72 Z"
        className={body}
      />
      <path d="M40 50 L47 39 H56 V50 Z" className="fill-paper" />
      <path d="M61 50 V39 H66 Q68 39 70 41 L77 50 Z" className="fill-paper" />
      <Wheel x={26} />
      <Wheel x={74} />
    </>
  )
}

/** Truck cab facing right, from x = 60 to x = 94. */
function Cab({ body = "fill-art-3", x = 60 }: { body?: string; x?: number }) {
  return (
    <>
      <path
        d={`M${x} 72 V36 H${x + 18} L${x + 32} 52 Q${x + 34} 53 ${x + 34} 56 V72 Z`}
        className={body}
      />
      <path
        d={`M${x + 6} 42 H${x + 16} L${x + 25} 52 H${x + 6} Z`}
        className="fill-paper"
      />
    </>
  )
}

function Taxi() {
  return (
    <Frame>
      <Sedan body="fill-art-1" />
      <rect
        x={45}
        y={24}
        width={20}
        height={10}
        rx={2}
        className="fill-paper"
      />
      <text
        x={55}
        y={31.5}
        textAnchor="middle"
        fontSize={7}
        fontWeight={700}
        className="fill-ink stroke-none"
      >
        TAXI
      </text>
      <path d="M10 60 H90" strokeWidth={4} strokeDasharray="4 4" />
    </Frame>
  )
}

function PoliceCar() {
  return (
    <Frame>
      <Sedan body="fill-paper" />
      <rect x={44} y={27} width={11} height={7} className="fill-art-2" />
      <rect x={55} y={27} width={11} height={7} className="fill-art-3" />
      <path d="M8 58 H92 V64 H8 Z" className="fill-art-3" />
    </Frame>
  )
}

function RaceCar() {
  return (
    <Frame>
      <path d="M14 56 V44" strokeWidth={5} />
      <rect x={4} y={38} width={22} height={7} rx={2} className="fill-art-2" />
      <path
        d="M6 72 V60 Q6 56 12 56 L36 54 L44 44 H60 L66 54 L88 57 Q96 59 96 66 V72 Z"
        className="fill-art-2"
      />
      <circle cx={53} cy={45} r={7} className="fill-art-1" />
      <path d="M53 45 H60" strokeWidth={4} />
      <circle cx={52} cy={63} r={6} className="fill-paper" />
      <Wheel x={24} r={10} />
      <Wheel x={80} r={10} />
    </Frame>
  )
}

function OffRoad() {
  return (
    <Frame>
      <circle cx={8} cy={54} r={8} className="fill-ink" />
      <path
        d="M10 70 V46 H30 L34 30 H70 V46 H88 Q92 46 92 50 V70 Z"
        className="fill-art-3"
      />
      <path
        d="M38 46 L40 35 H51 V46 Z M56 46 V35 H65 V46 Z"
        className="fill-paper"
      />
      <Wheel x={28} y={70} r={12} />
      <Wheel x={74} y={70} r={12} />
    </Frame>
  )
}

function Convertible() {
  return (
    <Frame>
      <path d="M34 50 V40 Q34 38 36 38 H42 V50" className="fill-art-1" />
      <path d="M62 50 L56 36" strokeWidth={4} />
      <path
        d="M6 72 V58 Q6 50 14 50 H86 Q94 51 94 60 V72 Z"
        className="fill-art-2"
      />
      <path d="M50 58 H58" strokeWidth={4} />
      <Wheel x={26} />
      <Wheel x={74} />
    </Frame>
  )
}

function Pickup() {
  return (
    <Frame>
      <path
        d="M6 72 V52 H48 V34 H68 L80 50 Q94 51 94 60 V72 Z"
        className="fill-art-4"
      />
      <path d="M53 50 V39 H66 L74 50 Z" className="fill-paper" />
      <path d="M6 52 V46 H44" strokeWidth={3} className="fill-none" />
      <Wheel x={24} />
      <Wheel x={74} />
    </Frame>
  )
}

function Ambulance() {
  return (
    <Frame>
      <rect x={28} y={18} width={14} height={8} rx={2} className="fill-art-3" />
      <path
        d="M6 72 V30 Q6 26 10 26 H66 Q70 26 72 30 L86 48 Q94 50 94 58 V72 Z"
        className="fill-paper"
      />
      <path d="M70 32 L81 48 H70 Z" className="fill-paper" />
      <path
        d="M29 36 H39 V44 H47 V54 H39 V62 H29 V54 H21 V44 H29 Z"
        className="fill-art-2"
      />
      <Wheel x={24} />
      <Wheel x={76} />
    </Frame>
  )
}

function IceCreamTruck() {
  return (
    <Frame>
      <circle cx={36} cy={14} r={9} className="fill-art-2" />
      <path d="M27 18 H45 L36 36 Z" className="fill-art-1" />
      <path
        d="M6 72 V36 H70 L86 50 Q94 52 94 60 V72 Z"
        className="fill-paper"
      />
      <path d="M72 40 L82 50 H72 Z" className="fill-paper" />
      <rect x={14} y={42} width={44} height={14} className="fill-art-1" />
      <path d="M14 42 L20 36 M26 42 L32 36 M38 42 L44 36 M50 42 L56 36" />
      <Wheel x={24} />
      <Wheel x={76} />
    </Frame>
  )
}

function FireTruck() {
  return (
    <Frame>
      <path d="M4 70 V40 H60 V70 Z" className="fill-art-2" />
      <Cab body="fill-art-2" />
      <rect x={6} y={28} width={52} height={8} className="fill-paper" />
      <path d="M14 28 V36 M22 28 V36 M30 28 V36 M38 28 V36 M46 28 V36" />
      <circle cx={28} cy={54} r={8} className="fill-paper" />
      <circle cx={28} cy={54} r={3} />
      <Wheel x={16} />
      <Wheel x={42} />
      <Wheel x={80} />
    </Frame>
  )
}

function Truck() {
  return (
    <Frame>
      <rect x={4} y={22} width={54} height={46} className="fill-art-1" />
      <Cab />
      <path d="M4 68 H60" />
      <Wheel x={18} />
      <Wheel x={78} />
    </Frame>
  )
}

function DumpTruck() {
  return (
    <Frame>
      <path
        d="M10 34 Q18 20 28 26 Q36 16 46 26 Q54 22 58 32"
        className="fill-art-2"
      />
      <path d="M2 30 H62 L56 60 H8 Z" className="fill-art-1" />
      <path d="M14 38 L12 52 M30 38 V52 M46 38 L48 52" />
      <rect x={4} y={60} width={56} height={6} className="fill-ink" />
      <Cab />
      <Wheel x={18} r={10} />
      <Wheel x={44} r={10} />
      <Wheel x={80} r={10} />
    </Frame>
  )
}

function Tanker() {
  return (
    <Frame>
      <rect
        x={2}
        y={30}
        width={60}
        height={30}
        rx={15}
        className="fill-art-3"
      />
      <path d="M18 30 V60 M46 30 V60" />
      <rect x={4} y={60} width={56} height={6} className="fill-ink" />
      <Cab body="fill-art-1" />
      <Wheel x={16} />
      <Wheel x={42} />
      <Wheel x={80} />
    </Frame>
  )
}

function CraneTruck() {
  return (
    <Frame>
      <Bar d="M18 54 L52 14" width={7} />
      <path d="M52 14 V40" strokeWidth={2.5} />
      <path d="M48 40 H56 V44 Q56 50 50 50" className="fill-none" />
      <path d="M4 72 V56 H60 V72 Z" className="fill-art-1" />
      <circle cx={18} cy={54} r={5} className="fill-art-4" />
      <Cab body="fill-art-1" />
      <Wheel x={18} />
      <Wheel x={40} />
      <Wheel x={80} />
    </Frame>
  )
}

function CementMixer() {
  return (
    <Frame>
      <ellipse
        cx={32}
        cy={42}
        rx={28}
        ry={18}
        transform="rotate(-12 32 42)"
        className="fill-art-2"
      />
      <path
        d="M14 30 Q22 44 18 56 M30 26 Q38 42 34 58 M46 24 Q54 40 50 54"
        className="fill-none"
      />
      <rect x={4} y={60} width={56} height={6} className="fill-ink" />
      <Cab body="fill-art-1" />
      <Wheel x={16} />
      <Wheel x={42} />
      <Wheel x={80} />
    </Frame>
  )
}

function Excavator() {
  return (
    <Frame>
      <Bar d="M40 46 L64 18 L84 44" width={7} />
      <path d="M78 42 L96 46 L90 64 L76 56 Z" className="fill-art-3" />
      <path d="M8 60 V36 Q8 32 12 32 H30 L40 46 V60 Z" className="fill-art-1" />
      <path d="M13 46 V37 H28 L34 46 Z" className="fill-paper" />
      <rect x={4} y={60} width={56} height={6} className="fill-art-1" />
      <rect x={4} y={66} width={58} height={16} rx={8} className="fill-ink" />
      <circle cx={13} cy={74} r={4} className="fill-paper" />
      <circle cx={33} cy={74} r={4} className="fill-paper" />
      <circle cx={53} cy={74} r={4} className="fill-paper" />
    </Frame>
  )
}

function Tractor() {
  return (
    <Frame>
      <path d="M74 38 V22" strokeWidth={5} />
      <path d="M44 62 V38 H88 V62 Z" className="fill-art-2" />
      <path d="M14 56 V20 H44 V56" className="fill-none" strokeWidth={4} />
      <path d="M10 20 H48" strokeWidth={6} />
      <path d="M14 46 H44 V60 H14 Z" className="fill-art-2" />
      <Wheel x={28} y={64} r={18} />
      <Wheel x={78} y={72} r={10} />
    </Frame>
  )
}

function Bus() {
  return (
    <Frame>
      <rect x={4} y={24} width={92} height={46} rx={6} className="fill-art-1" />
      <rect x={10} y={32} width={14} height={16} className="fill-paper" />
      <rect x={28} y={32} width={14} height={16} className="fill-paper" />
      <rect x={46} y={32} width={14} height={16} className="fill-paper" />
      <rect x={66} y={32} width={12} height={34} className="fill-paper" />
      <path d="M72 32 V66" />
      <path d="M84 32 H96 V50 H84 Z" className="fill-paper" />
      <path d="M4 56 H62" />
      <Wheel x={22} />
      <Wheel x={82} />
    </Frame>
  )
}

function DoubleDecker() {
  return (
    <Frame>
      <rect x={8} y={10} width={84} height={62} rx={6} className="fill-art-2" />
      {[14, 32, 50, 68].map((x) => (
        <rect
          key={x}
          x={x}
          y={16}
          width={14}
          height={14}
          className="fill-paper"
        />
      ))}
      {[14, 32, 50].map((x) => (
        <rect
          key={x}
          x={x}
          y={40}
          width={14}
          height={14}
          className="fill-paper"
        />
      ))}
      <rect x={70} y={40} width={12} height={28} className="fill-paper" />
      <path d="M8 36 H92" />
      <Wheel x={26} y={74} />
      <Wheel x={76} y={74} />
    </Frame>
  )
}

function Bicycle() {
  return (
    <Frame>
      <circle cx={22} cy={64} r={16} className="fill-none" strokeWidth={5} />
      <circle cx={78} cy={64} r={16} className="fill-none" strokeWidth={5} />
      <Bar
        d="M22 64 L42 64 L34 40 L70 40 L78 64 M42 64 L70 40"
        width={4}
        fill="stroke-art-2"
      />
      <path d="M34 40 L31 32 M24 31 H38" strokeWidth={5} />
      <path d="M70 40 L66 26 H74" strokeWidth={5} className="fill-none" />
      <circle cx={42} cy={64} r={4} className="fill-art-4" />
    </Frame>
  )
}

function Motorbike() {
  return (
    <Frame>
      <Bar d="M80 70 L70 28" width={4} fill="stroke-art-4" />
      <path d="M62 28 H76" strokeWidth={5} />
      <path d="M58 64 L64 36 H74 L70 64 Z" className="fill-art-3" />
      <path
        d="M8 64 Q8 48 24 46 H50 Q58 47 58 56 V64 Z"
        className="fill-art-3"
      />
      <path d="M18 46 Q18 38 26 38 H48 Q54 38 54 46 Z" className="fill-ink" />
      <rect x={40} y={60} width={24} height={6} className="fill-art-3" />
      <Wheel x={22} y={70} r={11} />
      <Wheel x={80} y={70} r={11} />
    </Frame>
  )
}

function Cyclo() {
  return (
    <Frame>
      <Bar d="M38 60 L80 64 L72 34" width={4} fill="stroke-art-4" />
      <path d="M64 32 H80" strokeWidth={5} />
      <path d="M38 52 L50 30 H58" strokeWidth={4} className="fill-none" />
      <path d="M6 30 Q4 10 30 12 L38 30" className="fill-art-2" />
      <path
        d="M8 60 V34 Q8 30 12 30 H28 Q34 30 34 36 V50 H44 V60 Z"
        className="fill-art-1"
      />
      <Wheel x={22} y={70} r={12} />
      <Wheel x={80} y={66} r={16} />
    </Frame>
  )
}

function Scooter() {
  return (
    <Frame>
      <Bar d="M76 72 L66 16" width={5} fill="stroke-art-3" />
      <path d="M56 16 H76" strokeWidth={6} />
      <path d="M14 66 H70 V72 H14 Z" className="fill-art-3" />
      <Wheel x={18} y={76} r={8} />
      <Wheel x={78} y={76} r={8} />
    </Frame>
  )
}

function Train() {
  return (
    <Frame>
      <circle cx={80} cy={14} r={6} className="fill-paper" />
      <circle cx={90} cy={8} r={5} className="fill-paper" />
      <path d="M72 36 V18 H84 V36" className="fill-art-4" />
      <rect
        x={34}
        y={36}
        width={56}
        height={28}
        rx={4}
        className="fill-art-2"
      />
      <path d="M90 50 L98 66 H90 Z" className="fill-art-4" />
      <rect x={6} y={20} width={30} height={44} className="fill-art-3" />
      <path d="M2 20 H40" strokeWidth={5} />
      <rect x={12} y={28} width={18} height={14} className="fill-paper" />
      <rect x={4} y={64} width={88} height={6} className="fill-ink" />
      <Wheel x={20} y={72} r={9} />
      <Wheel x={46} y={74} r={7} />
      <Wheel x={66} y={74} r={7} />
      <Wheel x={84} y={74} r={7} />
    </Frame>
  )
}

function Airplane() {
  return (
    <Frame>
      <path d="M10 44 L4 22 H16 L30 44 Z" className="fill-art-3" />
      <path
        d="M6 52 Q6 44 16 44 H78 Q94 44 96 52 Q94 60 80 60 H16 Q6 60 6 52 Z"
        className="fill-paper"
      />
      <path d="M84 46 Q90 46 92 51 H84 Z" className="fill-art-3" />
      {[30, 42, 54, 66].map((x) => (
        <circle key={x} cx={x} cy={51} r={3} className="fill-art-3" />
      ))}
      <path d="M38 56 H60 L46 80 H36 Z" className="fill-art-3" />
    </Frame>
  )
}

function Helicopter() {
  return (
    <Frame>
      <path d="M14 20 H84" strokeWidth={5} />
      <path d="M48 20 V32" strokeWidth={5} />
      <Bar d="M60 46 H90" width={6} fill="stroke-art-2" />
      <circle cx={92} cy={40} r={8} className="fill-paper" />
      <path
        d="M18 50 Q18 32 42 32 H56 Q70 32 70 50 Q70 64 56 64 H34 Q18 64 18 50 Z"
        className="fill-art-2"
      />
      <path d="M22 48 Q24 37 36 37 H40 V50 H22 Z" className="fill-paper" />
      <path d="M32 64 L28 76 M58 64 L62 76 M18 76 H74" strokeWidth={4} />
    </Frame>
  )
}

function Balloon() {
  return (
    <Frame>
      <path
        d="M50 6 C22 6 12 30 24 50 L40 66 H60 L76 50 C88 30 78 6 50 6 Z"
        className="fill-art-2"
      />
      <path
        d="M50 6 C38 12 34 40 44 66 H56 C66 40 62 12 50 6 Z"
        className="fill-art-1"
      />
      <path d="M40 66 L42 78 M60 66 L58 78" />
      <rect
        x={38}
        y={78}
        width={24}
        height={14}
        rx={2}
        className="fill-art-1"
      />
      <path d="M38 84 H62" />
    </Frame>
  )
}

function Rocket() {
  return (
    <Frame>
      <path d="M42 76 Q50 100 58 76 Z" className="fill-art-1" />
      <path
        d="M38 54 L24 78 H38 Z M62 54 L76 78 H62 Z"
        className="fill-art-2"
      />
      <path
        d="M50 4 C66 18 66 44 62 76 H38 C34 44 34 18 50 4 Z"
        className="fill-paper"
      />
      <path d="M41 16 Q50 4 59 16 Z" className="fill-art-2" />
      <circle cx={50} cy={36} r={8} className="fill-art-3" />
      <path d="M50 54 V76" />
    </Frame>
  )
}

function Ship() {
  return (
    <Frame>
      <rect x={52} y={18} width={12} height={22} className="fill-art-2" />
      <path d="M52 26 H64" strokeWidth={4} />
      <rect x={24} y={40} width={50} height={20} className="fill-paper" />
      <circle cx={36} cy={50} r={4} className="fill-art-3" />
      <circle cx={50} cy={50} r={4} className="fill-art-3" />
      <circle cx={64} cy={50} r={4} className="fill-art-3" />
      <path d="M4 60 H96 L84 82 H16 Z" className="fill-art-4" />
      <Waves />
    </Frame>
  )
}

function Sailboat() {
  return (
    <Frame>
      <path d="M50 66 V8" strokeWidth={4} />
      <path d="M55 10 V60 H88 Z" className="fill-paper" />
      <path d="M45 18 V60 H18 Z" className="fill-art-2" />
      <path d="M10 66 H90 L78 82 H22 Z" className="fill-art-1" />
      <Waves />
    </Frame>
  )
}

function Submarine() {
  return (
    <Frame>
      <path d="M58 30 V14 H68" strokeWidth={4} className="fill-none" />
      <circle cx={88} cy={24} r={3} className="fill-paper" />
      <circle cx={94} cy={14} r={4} className="fill-paper" />
      <path d="M8 54 L2 44 V66 Z" className="fill-art-3" />
      <path d="M36 42 V30 H62 V42" className="fill-art-1" />
      <rect
        x={8}
        y={40}
        width={86}
        height={30}
        rx={15}
        className="fill-art-1"
      />
      <circle cx={36} cy={55} r={5} className="fill-paper" />
      <circle cx={54} cy={55} r={5} className="fill-paper" />
      <circle cx={72} cy={55} r={5} className="fill-paper" />
      <Waves />
    </Frame>
  )
}

/** Keyed by the ids in `voice.json`. */
export const VEHICLES: Record<string, () => ReactNode> = {
  taxi: Taxi,
  police: PoliceCar,
  race: RaceCar,
  offroad: OffRoad,
  convertible: Convertible,
  pickup: Pickup,
  ambulance: Ambulance,
  icecream: IceCreamTruck,
  firetruck: FireTruck,
  truck: Truck,
  dump: DumpTruck,
  tanker: Tanker,
  crane: CraneTruck,
  mixer: CementMixer,
  excavator: Excavator,
  tractor: Tractor,
  bus: Bus,
  doubledecker: DoubleDecker,
  bicycle: Bicycle,
  motorbike: Motorbike,
  cyclo: Cyclo,
  scooter: Scooter,
  train: Train,
  airplane: Airplane,
  helicopter: Helicopter,
  balloon: Balloon,
  rocket: Rocket,
  ship: Ship,
  sailboat: Sailboat,
  submarine: Submarine,
}
