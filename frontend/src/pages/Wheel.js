import WheelVisualization from '../components/ui/WheelVisualization.js';
import { useWheel } from '../hooks/useWheel.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Wheel() {
  const navigate = useNavigate();
  const { aspects, updateAspect } = useWheel();
  const [selectedAspect, setSelectedAspect] = useState(null);
  
  const aspect = aspects.find((a) => a.name === selectedAspect);
  
  const [localScore, setLocalScore] = useState(5);
  const [localVision, setLocalVision] = useState('');
  const [localActionSteps, setLocalActionSteps] = useState('');

  useEffect(() => {
    if (aspect) {
      setLocalScore(aspect.score || 5);
      setLocalVision(aspect.vision || '');
      setLocalActionSteps(aspect.actionSteps || '');
    }
  }, [selectedAspect, aspect]);

  const handleSave = () => {
    if (selectedAspect) {
      updateAspect(selectedAspect, {
        score: localScore,
        vision: localVision,
        actionSteps: localActionSteps,
      });
    }
  };

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
              editable={true}
              onClick={setSelectedAspect}
            />
          </div>

          <div className="space-y-6">
            {selectedAspect ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-primary mb-4">{selectedAspect}</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Score (1-10): <span className="font-bold text-gold">{localScore}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={localScore}
                      onChange={(e) => setLocalScore(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vision
                    </label>
                    <input
                      type="text"
                      value={localVision}
                      onChange={(e) => setLocalVision(e.target.value)}
                      placeholder="Enter your vision for this aspect..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action Steps
                    </label>
                    <textarea
                      value={localActionSteps}
                      onChange={(e) => setLocalActionSteps(e.target.value)}
                      placeholder="What actions will you take to improve this aspect?"
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-gold text-primary font-bold rounded-lg hover:bg-gold-dark"
                  >
                    Save Changes
                  </button>
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
                {aspects.map((aspect) => (
                  <div
                    key={aspect.name}
                    onClick={() => setSelectedAspect(aspect.name)}
                    className="p-4 border rounded-lg cursor-pointer hover:border-gold transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-primary">{aspect.name}</h3>
                      <span className="text-2xl font-bold text-gold">
                        {aspect.score || 5}/10
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
