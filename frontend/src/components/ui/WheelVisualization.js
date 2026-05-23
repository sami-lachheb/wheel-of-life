import { Briefcase, Heart, Users, Lightbulb, Coins, Smile, Home, PiggyBank } from 'lucide-react';

export const CANONICAL_ASPECTS = [
  { name: 'Career', dbKeys: ['Career & Work', 'Career'], color: '#2196F3', icon: Briefcase },
  { name: 'Health & Wellness', dbKeys: ['Health & Fitness', 'Health & Wellness'], color: '#4CAF50', icon: Heart },
  { name: 'Relationships', dbKeys: ['Relationships & Family', 'Relationships', 'Partner & Love'], color: '#FF9800', icon: Users },
  { name: 'Personal Growth', dbKeys: ['Personal Growth'], color: '#FFC107', icon: Lightbulb },
  { name: 'Finance', dbKeys: ['Finance & Wealth', 'Finance'], color: '#E91E63', icon: Coins },
  { name: 'Joy & Leisure', dbKeys: ['Fun & Recreation', 'Joy & Leisure'], color: '#9C27B0', icon: Smile },
  { name: 'Physical Environment', dbKeys: ['Environment', 'Physical Environment'], color: '#009688', icon: Home },
  { name: 'Budgeting & Giving', dbKeys: ['Budgeting & Giving', 'Community', 'Spirituality'], color: '#FFA726', icon: PiggyBank },
];

export function getNormalizedAspects(dbAspects = []) {
  return CANONICAL_ASPECTS.map((canonical, index) => {
    const match = dbAspects.find((a) =>
      canonical.dbKeys.some(key => a.name.toLowerCase() === key.toLowerCase())
    );
    return {
      name: canonical.name,
      originalName: match ? match.name : canonical.name,
      score: match ? (match.score || 5) : 5,
      vision: match ? (match.vision || '') : '',
      actionSteps: match ? (match.actionSteps || '') : '',
      color: canonical.color,
      Icon: canonical.icon,
      index: index + 1
    };
  });
}

export default function WheelVisualization({
  aspects = [],
  onClick,
  hideCenterText = false,
  className = "",
  avatarUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100",
}) {
  const normalizedAspects = getNormalizedAspects(aspects);
  
  const cx = 180;
  const cy = 180;
  const maxRadius = 110;
  const r_inner = 28;
  const r_text = 114;
  const r_badge = 142;

  const getSegmentPath = (centerAngle, score) => {
    const startAngle = centerAngle - 22.5;
    const endAngle = centerAngle + 22.5;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    // Scale score from 0-10 between r_inner and maxRadius
    const r_score = r_inner + (score / 10) * (maxRadius - r_inner);
    
    const x_out_start = cx + r_score * Math.cos(startRad);
    const y_out_start = cy + r_score * Math.sin(startRad);
    const x_out_end = cx + r_score * Math.cos(endRad);
    const y_out_end = cy + r_score * Math.sin(endRad);
    
    const x_in_start = cx + r_inner * Math.cos(startRad);
    const y_in_start = cy + r_inner * Math.sin(startRad);
    const x_in_end = cx + r_inner * Math.cos(endRad);
    const y_in_end = cy + r_inner * Math.sin(endRad);
    
    return `M ${x_in_start} ${y_in_start} L ${x_out_start} ${y_out_start} A ${r_score} ${r_score} 0 0 1 ${x_out_end} ${y_out_end} L ${x_in_end} ${y_in_end} A ${r_inner} ${r_inner} 0 0 0 ${x_in_start} ${y_in_start} Z`;
  };

  const getTextPathD = (startAngle, endAngle, radius) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    
    // Bottom half needs counter-clockwise path to remain upright
    const centerAngle = (startAngle + endAngle) / 2;
    const isBottomHalf = centerAngle >= 22.5 && centerAngle <= 202.5;
    
    if (isBottomHalf) {
      return `M ${x2} ${y2} A ${radius} ${radius} 0 0 0 ${x1} ${y1}`;
    } else {
      return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
    }
  };

  return (
    <div className={`relative w-full max-w-[360px] aspect-square mx-auto ${className}`}>
      <svg viewBox="0 0 360 360" className="w-full h-full overflow-visible">
        <defs>
          <clipPath id="avatar-clip">
            <circle cx={cx} cy={cy} r={r_inner - 2} />
          </clipPath>
          <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.15" />
          </filter>
          <filter id="center-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
          </filter>
          
          {/* Text Paths definitions */}
          {normalizedAspects.map((aspect) => {
            const angle = -90 + (aspect.index - 1) * 45;
            const startAngle = angle - 22.5;
            const endAngle = angle + 22.5;
            const pathD = getTextPathD(startAngle, endAngle, r_text);
            return (
              <path
                key={`textpath-path-${aspect.name}`}
                id={`textpath-${aspect.name}`}
                d={pathD}
                fill="none"
              />
            );
          })}
        </defs>

        {/* Concentric grid lines (2, 4, 6, 8, 10) */}
        {[2, 4, 6, 8, 10].map((level) => {
          const r = r_inner + (level / 10) * (maxRadius - r_inner);
          return (
            <circle
              key={`grid-${level}`}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis scale numbers along the vertical spoke (12 o'clock axis) */}
        {Array.from({ length: 10 }, (_, idx) => {
          const level = idx + 1;
          const r = r_inner + (level / 10) * (maxRadius - r_inner);
          return (
            <text
              key={`scale-num-${level}`}
              x={cx + 3}
              y={cy - r + 2.5}
              className="text-[6.5px] font-black fill-slate-300 select-none"
            >
              {level}
            </text>
          );
        })}

        {/* Dotted spoke divider lines */}
        {normalizedAspects.map((_, idx) => {
          const angle = -90 + idx * 45 - 22.5;
          const rad = (angle * Math.PI) / 180;
          const xStart = cx + r_inner * Math.cos(rad);
          const yStart = cy + r_inner * Math.sin(rad);
          const xEnd = cx + maxRadius * Math.cos(rad);
          const yEnd = cy + maxRadius * Math.sin(rad);
          return (
            <line
              key={`spoke-${idx}`}
              x1={xStart}
              y1={yStart}
              x2={xEnd}
              y2={yEnd}
              stroke="#E2E8F0"
              strokeWidth="0.75"
              strokeDasharray="2,2"
            />
          );
        })}

        {/* Filled Aspect Segments */}
        {normalizedAspects.map((aspect) => {
          const angle = -90 + (aspect.index - 1) * 45;
          const path = getSegmentPath(angle, aspect.score);
          
          return (
            <g key={aspect.name}>
              <path
                d={path}
                fill={aspect.color}
                fillOpacity={0.82}
                stroke="white"
                strokeWidth="1.5"
                className="cursor-pointer transition-all duration-300 hover:fill-opacity-95 origin-center"
                onClick={() => onClick?.(aspect.originalName)}
              />
            </g>
          );
        })}

        {/* Curved Segment Text Labels */}
        {normalizedAspects.map((aspect) => {
          const angle = -90 + (aspect.index - 1) * 45;
          const isBottomHalf = angle >= 22.5 && angle <= 202.5;
          return (
            <text
              key={`text-${aspect.name}`}
              fill="#475569"
              className="text-[7.5px] font-black select-none tracking-tight"
              dy={isBottomHalf ? "6" : "-1"}
            >
              <textPath
                href={`#textpath-${aspect.name}`}
                startOffset="50%"
                textAnchor="middle"
              >
                {aspect.index}. {aspect.name}
              </textPath>
            </text>
          );
        })}

        {/* Numerical Score Circles Inside Filled Segments */}
        {normalizedAspects.map((aspect) => {
          const angle = -90 + (aspect.index - 1) * 45;
          const rad = (angle * Math.PI) / 180;
          
          // Position at the center of the filled area
          const r_score = r_inner + (aspect.score / 10) * (maxRadius - r_inner);
          const r_center = r_inner + (r_score - r_inner) / 2;
          
          const x = cx + r_center * Math.cos(rad);
          const y = cy + r_center * Math.sin(rad);
          
          // Don't render score badge if score is extremely low (clipping risk)
          if (aspect.score < 2.5) return null;
          
          return (
            <g key={`score-badge-${aspect.name}`} className="pointer-events-none">
              <circle
                cx={x}
                cy={y}
                r={10}
                fill="white"
                filter="url(#badge-shadow)"
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[8px] font-black fill-slate-700"
              >
                {aspect.score.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Outer Icon Badges */}
        {normalizedAspects.map((aspect) => {
          const angle = -90 + (aspect.index - 1) * 45;
          const rad = (angle * Math.PI) / 180;
          
          const x = cx + r_badge * Math.cos(rad);
          const y = cy + r_badge * Math.sin(rad);
          
          return (
            <g
              key={`badge-${aspect.name}`}
              className="cursor-pointer"
              onClick={() => onClick?.(aspect.originalName)}
            >
              <circle
                cx={x}
                cy={y}
                r={13}
                fill={aspect.color}
                filter="url(#badge-shadow)"
              />
              <foreignObject x={x - 8} y={y - 8} width={16} height={16} className="pointer-events-none">
                <aspect.Icon className="text-white w-4 h-4" />
              </foreignObject>
            </g>
          );
        })}

        {/* White Center Mask with Shadow and Clip Avatar */}
        {!hideCenterText && (
          <>
            <circle
              cx={cx}
              cy={cy}
              r={r_inner}
              fill="white"
              filter="url(#center-shadow)"
            />
            <g clipPath="url(#avatar-clip)">
              <image
                href={avatarUrl}
                x={cx - r_inner + 1}
                y={cy - r_inner + 1}
                width={(r_inner - 1) * 2}
                height={(r_inner - 1) * 2}
                preserveAspectRatio="xMidYMid slice"
              />
            </g>
          </>
        )}
      </svg>
    </div>
  );
}
