export function validateVision(vision) {
  if (!vision || vision.trim().length < 10) {
    return { valid: false, error: 'Vision must be at least 10 characters' };
  }
  if (vision.length > 500) {
    return { valid: false, error: 'Vision must be less than 500 characters' };
  }
  return { valid: true };
}

export function validateAspectCount(aspects) {
  if (aspects.length < 3) {
    return { valid: false, error: 'Please select at least 3 life aspects' };
  }
  if (aspects.length > 10) {
    return { valid: false, error: 'Maximum 10 life aspects allowed' };
  }
  return { valid: true };
}

export function validateScore(score) {
  return score >= 1 && score <= 10;
}
