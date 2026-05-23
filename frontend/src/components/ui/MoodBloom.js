export const PALETTES = {
  rough: { primary: '#f43f5e', secondary: '#ec4899', glow: 'rgba(244,63,94,0.3)' },
  low: { primary: '#f59e0b', secondary: '#f97316', glow: 'rgba(245,158,11,0.3)' },
  okay: { primary: '#94a3b8', secondary: '#64748b', glow: 'rgba(148,163,184,0.2)' },
  good: { primary: '#8b5cf6', secondary: '#a78bfa', glow: 'rgba(139,92,246,0.3)' },
  great: { primary: '#10b981', secondary: '#2dd4bf', glow: 'rgba(16,185,129,0.3)' },
};

export function getMoodTheme(mood) {
  const themes = {
    rough: {
      bg: 'bg-gradient-to-br from-rose-50/80 to-pink-100/60',
      border: 'border-rose-200/40',
      ring: 'ring-rose-100/40',
      shadow: 'shadow-rose-200/30',
      text: 'text-rose-700',
      label: 'text-rose-500',
    },
    low: {
      bg: 'bg-gradient-to-br from-amber-50/80 to-orange-100/60',
      border: 'border-amber-200/40',
      ring: 'ring-amber-100/40',
      shadow: 'shadow-amber-200/30',
      text: 'text-amber-700',
      label: 'text-amber-500',
    },
    okay: {
      bg: 'bg-gradient-to-br from-slate-50/80 to-gray-100/60',
      border: 'border-slate-200/40',
      ring: 'ring-slate-100/40',
      shadow: 'shadow-slate-200/30',
      text: 'text-slate-700',
      label: 'text-slate-500',
    },
    good: {
      bg: 'bg-gradient-to-br from-violet-50/80 to-indigo-100/60',
      border: 'border-violet-200/40',
      ring: 'ring-violet-100/40',
      shadow: 'shadow-violet-200/30',
      text: 'text-violet-700',
      label: 'text-violet-500',
    },
    great: {
      bg: 'bg-gradient-to-br from-emerald-50/80 to-teal-100/60',
      border: 'border-emerald-200/40',
      ring: 'ring-emerald-100/40',
      shadow: 'shadow-emerald-200/30',
      text: 'text-emerald-700',
      label: 'text-emerald-500',
    },
  };
  return themes[mood] || themes.okay;
}

function RoughShape({ cx, cy, r, color }) {
  const layers = 5;
  return Array.from({ length: layers }, (_, i) => {
    const layerR = r * 0.3 + (r * 0.6 * (i / (layers - 1)));
    const points = 12;
    const d = Array.from({ length: points }, (_, j) => {
      const angle = (j / points) * Math.PI * 2;
      const wobble = layerR + Math.sin(angle * 6 + i) * (r * 0.06);
      const x = cx + Math.cos(angle) * wobble;
      const y = cy + Math.sin(angle) * wobble;
      return `${j === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ') + 'Z';
    return (
      <path
        key={i}
        d={d}
        fill="none"
        stroke={color.primary}
        strokeWidth={1.2}
        opacity={0.25 + (i * 0.15)}
      />
    );
  });
}

function LowShape({ cx, cy, r, color }) {
  const layers = 6;
  return Array.from({ length: layers }, (_, i) => {
    const s = r * 0.25 + (r * 0.6 * (i / (layers - 1)));
    const angle = i * 30;
    return (
      <rect
        key={i}
        x={cx - s}
        y={cy - s}
        width={s * 2}
        height={s * 2}
        rx={s * 0.15}
        fill="none"
        stroke={color.primary}
        strokeWidth={1.2}
        opacity={0.2 + i * 0.12}
        transform={`rotate(${angle} ${cx} ${cy})`}
      />
    );
  });
}

function OkayShape({ cx, cy, r, color }) {
  const layers = 5;
  return Array.from({ length: layers }, (_, i) => (
    <circle
      key={i}
      cx={cx}
      cy={cy}
      r={r * 0.2 + (r * 0.6 * (i / (layers - 1)))}
      fill="none"
      stroke={color.primary}
      strokeWidth={1.5}
      opacity={0.15 + i * 0.15}
    />
  ));
}

function GoodShape({ cx, cy, r, color }) {
  const petals = 12;
  return Array.from({ length: petals }, (_, i) => {
    const angle = (i / petals) * 360;
    return (
      <ellipse
        key={i}
        cx={cx}
        cy={cy - r * 0.22}
        rx={r * 0.28}
        ry={r * 0.55}
        fill={color.primary}
        fillOpacity={0.12}
        stroke={color.secondary}
        strokeWidth={0.8}
        strokeOpacity={0.5}
        transform={`rotate(${angle} ${cx} ${cy})`}
      />
    );
  });
}

function GreatShape({ cx, cy, r, color }) {
  const leaves = 10;
  return (
    <>
      {Array.from({ length: leaves }, (_, i) => {
        const angle = (i / leaves) * 360;
        const tipX = cx + Math.cos((angle * Math.PI) / 180) * r * 0.75;
        const tipY = cy + Math.sin((angle * Math.PI) / 180) * r * 0.75;
        const cp1x = cx + Math.cos(((angle - 12) * Math.PI) / 180) * r * 0.4;
        const cp1y = cy + Math.sin(((angle - 12) * Math.PI) / 180) * r * 0.4;
        const cp2x = cx + Math.cos(((angle + 12) * Math.PI) / 180) * r * 0.4;
        const cp2y = cy + Math.sin(((angle + 12) * Math.PI) / 180) * r * 0.4;
        return (
          <g key={i}>
            <path
              d={`M${cx},${cy} Q${cp1x},${cp1y} ${tipX},${tipY} Q${cp2x},${cp2y} ${cx},${cy}`}
              fill={color.primary}
              fillOpacity={0.15}
              stroke={color.secondary}
              strokeWidth={0.8}
              strokeOpacity={0.6}
            />
            <circle
              cx={tipX}
              cy={tipY}
              r={1.5}
              fill={color.primary}
              opacity={0.9}
              className="bloom-great-dot"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          </g>
        );
      })}
    </>
  );
}

export default function MoodBloom({ mood = 'okay', size = 64 }) {
  const p = PALETTES[mood] || PALETTES.okay;
  const r = size / 2;
  const uid = `bloom-${mood}-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={`glow-${uid}`}>
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <style>{`
        @keyframes bloom-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
        @keyframes bloom-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bloom-spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes bloom-pulse-dot {
          0%, 100% { r: 1.5; opacity: 0.9; }
          50% { r: 2.5; opacity: 1; }
        }
        .bloom-rough {
          animation: bloom-breathe 4s ease-in-out infinite;
          transform-origin: ${r}px ${r}px;
        }
        .bloom-low {
          animation: bloom-spin 20s linear infinite;
          transform-origin: ${r}px ${r}px;
        }
        .bloom-okay {
          animation: bloom-breathe 5s ease-in-out infinite;
          transform-origin: ${r}px ${r}px;
        }
        .bloom-good {
          animation: bloom-spin-reverse 25s linear infinite;
          transform-origin: ${r}px ${r}px;
        }
        .bloom-great {
          animation: bloom-spin 18s linear infinite;
          transform-origin: ${r}px ${r}px;
        }
        .bloom-great-dot {
          animation: bloom-pulse-dot 2s ease-in-out infinite;
        }
      `}</style>
      <g filter={`url(#glow-${uid})`} className={`bloom-${mood}`}>
        {mood === 'rough' && <RoughShape cx={r} cy={r} r={r} color={p} />}
        {mood === 'low' && <LowShape cx={r} cy={r} r={r} color={p} />}
        {mood === 'okay' && <OkayShape cx={r} cy={r} r={r} color={p} />}
        {mood === 'good' && <GoodShape cx={r} cy={r} r={r} color={p} />}
        {mood === 'great' && <GreatShape cx={r} cy={r} r={r} color={p} />}
      </g>
    </svg>
  );
}
