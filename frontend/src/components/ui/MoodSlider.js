import { useState } from 'react';

export default function MoodSlider({
  initialPleasantness = 3,
  onChange,
}) {
  const [pleasantness, setPleasantness] = useState(initialPleasantness);

  const moodMap = { 1: 'rough', 2: 'low', 3: 'okay', 4: 'good', 5: 'great' };

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setPleasantness(val);
    if (onChange) {
      onChange(moodMap[val] || 'okay', val);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
        <span>Rough</span>
        <span className="opacity-60">Okay</span>
        <span>Great</span>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        value={pleasantness}
        onChange={handleSliderChange}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-rose-400 via-amber-350 to-emerald-450 focus:outline-none"
        style={{
          WebkitAppearance: 'none',
        }}
      />
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #1e293b;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        input[type='range']::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #1e293b;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
