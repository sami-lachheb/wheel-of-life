import { useCallback } from 'react';
import { useUser } from '../contexts/UserContext.js';

export function useWheel() {
  const { state, dispatch } = useUser();
  
  const updateAspect = useCallback((aspectName, updates) => {
    dispatch({
      type: 'UPDATE_ASPECT',
      payload: { name: aspectName, ...updates },
    });
  }, [dispatch]);

  const updateAspectScore = useCallback((aspectName, score) => {
    updateAspect(aspectName, { score });
  }, [updateAspect]);
  
  const updateAspectVision = useCallback((aspectName, vision) => {
    updateAspect(aspectName, { vision });
  }, [updateAspect]);
  
  const getAverageScore = useCallback(() => {
    if (state.aspects.length === 0) return 0;
    const total = state.aspects.reduce((sum, a) => sum + (a.score || 0), 0);
    return Math.round(total / state.aspects.length);
  }, [state.aspects]);
  
  return {
    aspects: state.aspects,
    currentWheel: state.currentWheel,
    updateAspect,
    updateAspectScore,
    updateAspectVision,
    getAverageScore,
  };
}
