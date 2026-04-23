import { APP_CONFIG } from '../config';

/**
 * Determines whether the next target should be Real or Synthetic.
 * Uses a weighted probability.
 * @returns {'Real' | 'Synthetic'}
 */
export function getNextTargetType() {
    const isSynthetic = Math.random() < APP_CONFIG.SYNTHETIC_PROBABILITY;
    return isSynthetic ? 'Synthetic' : 'Real';
}

/**
 * Helper to select the image source based on the type.
 * @param {Object} caseData - The triple { real: string, synthetic: string, input: string }
 * @param {'Real' | 'Synthetic'} type
 * @returns {string} - The URL of the target image
 */
export function getTargetImage(caseData, type) {
    if (type === 'Real') return caseData.real;
    if (type === 'Synthetic') return caseData.synthetic;
    throw new Error(`Invalid target type: ${type}`);
}
