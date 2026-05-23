import WheelVisualization from '../components/ui/WheelVisualization.js';
import { useWheel } from '../hooks/useWheel.js';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Wheel() {
  const navigate = useNavigate();
  const { aspects } = useWheel();
  const [selectedAspect, setSelectedAspect] = useState(null);
  
  const aspect = aspects.find((a) => a.name === selectedAspect);

  return (
    <div className="min-h-screen bg-light-gray py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider bg-white/60 px-3 py-1.5 rounded-xl border border-gray-100/50 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Previous
          </button>
        </div>

        <h1 className="text-3xl font-bold text-primary mb-8">Wheel of Life</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
            <WheelVisualization
              aspects={aspects}
              editable={false}
              onClick={setSelectedAspect}
            />
          </div>

          <div className="space-y-6">
            {aspect ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-baseline mb-4">
                  <h2 className="text-2xl font-bold text-primary">{aspect.name}</h2>
                  <span className="text-2xl font-black text-gold bg-gold/10 px-3 py-1 rounded-xl">
                    {aspect.score || 5}/10
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
                      Vision
                    </h3>
                    <p className="text-sm font-semibold text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-gray-100 italic">
                      "{aspect.vision || 'No vision stated yet.'}"
                    </p>
                  </div>

                  {aspect.actionSteps && (
                    <div>
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
                        Action Steps
                      </h3>
                      <p className="text-sm font-medium text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-gray-100 whitespace-pre-line">
                        {aspect.actionSteps}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 text-[10px] text-gray-400 font-bold bg-amber-50/40 border border-amber-100/40 p-3 rounded-xl flex items-start gap-1.5">
                    <span className="text-sm leading-none">💡</span>
                    <span>This rating and vision is dynamically updated by the AI Coach (Riley) based on your coaching session transcripts.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <p className="text-gray-500">Select an aspect from the wheel to view details</p>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-primary mb-4">All Aspects</h2>
              <div className="space-y-3">
                {aspects.map((a) => (
                  <div
                    key={a.name}
                    onClick={() => setSelectedAspect(a.name)}
                    className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                      selectedAspect === a.name 
                        ? 'border-gold bg-gold/5' 
                        : 'border-gray-100 hover:border-gold bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-primary">{a.name}</h3>
                      <span className="text-2xl font-bold text-gold">
                        {a.score || 5}/10
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
