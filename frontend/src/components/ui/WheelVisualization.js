export default function WheelVisualization({
  aspects,
  onClick,
  hideCenterText = false,
  className = "max-w-[340px]",
}) {
  const totalAspects = aspects ? aspects.length : 0;
  
  if (totalAspects === 0) {
    return (
      <div className="w-80 h-80 mx-auto flex items-center justify-center border-2 border-dashed border-gray-200 rounded-full">
        <span className="text-gray-400 font-medium">Select aspects to display wheel</span>
      </div>
    );
  }

  const angleStep = 360 / totalAspects;
  const center = 130;
  const maxRadius = 115;
  const innerRadius = 30;
  
  const getSegmentPath = (index, radius) => {
    const startAngle = index * angleStep - 90;
    const endAngle = (index + 1) * angleStep - 90;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    
    const largeArcFlag = angleStep > 180 ? 1 : 0;
    
    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  const getShortName = (name) => {
    if (name.includes('&')) {
      return name.split('&')[0].trim();
    }
    if (name === 'Personal Growth') return 'Growth';
    return name;
  };

  return (
    <div className={`relative w-full aspect-square mx-auto ${className}`}>
      <svg viewBox="0 0 260 260" className="w-full h-full overflow-visible">
        {/* Concentric grid lines */}
        {[2, 4, 6, 8, 10].map((r) => (
          <circle
            key={`grid-${r}`}
            cx={center}
            cy={center}
            r={(r / 10) * maxRadius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="0.75"
            strokeDasharray="2,2"
          />
        ))}

        {/* Radial spoke lines */}
        {aspects.map((_, index) => {
          const angle = index * angleStep - 90;
          const rad = (angle * Math.PI) / 180;
          const x = center + maxRadius * Math.cos(rad);
          const y = center + maxRadius * Math.sin(rad);
          return (
            <line
              key={`spoke-${index}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#E5E7EB"
              strokeWidth="0.75"
            />
          );
        })}

        {/* Colored aspects segments */}
        {aspects.map((aspect, index) => {
          const score = aspect.score || 5;
          const scoreRadius = (score / 10) * maxRadius;
          const path = getSegmentPath(index, scoreRadius);
          
          return (
            <path
              key={aspect.name}
              d={path}
              fill={score >= 7 ? '#6366f1' : score >= 4 ? '#f97316' : '#ec4899'}
              fillOpacity={0.85}
              stroke="white"
              strokeWidth="1.5"
              className="cursor-pointer transition-all duration-300 hover:opacity-100 origin-center"
              onClick={() => onClick?.(aspect.name)}
            />
          );
        })}
        
        {/* White inner center mask */}
        {!hideCenterText && <circle cx={center} cy={center} r={innerRadius} fill="white" />}
        
        {/* Aspect text labels inside wheel levels */}
        {aspects.map((aspect, index) => {
          const angle = index * angleStep + angleStep / 2 - 90;
          const rad = (angle * Math.PI) / 180;
          
          // Place label at 65% of maxRadius (inside the segment)
          const labelRadius = maxRadius * 0.65;
          const x = center + labelRadius * Math.cos(rad);
          const y = center + labelRadius * Math.sin(rad);
          
          let rotation = angle;
          if (x < center) {
            rotation += 180;
          }

          return (
            <text
              key={`label-${aspect.name}`}
              x={x}
              y={y}
              transform={`rotate(${rotation}, ${x}, ${y})`}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[9px] font-black fill-white select-none tracking-tight pointer-events-none drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]"
            >
              {getShortName(aspect.name)}
            </text>
          );
        })}
      </svg>
      
      {/* Absolute center average text */}
      {!hideCenterText && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-2xl font-black text-primary leading-none">
            {Math.round(aspects.reduce((sum, a) => sum + (a.score || 0), 0) / totalAspects)}
          </div>
          <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-1">Average</div>
        </div>
      )}
    </div>
  );
}
