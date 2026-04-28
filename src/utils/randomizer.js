import { APP_CONFIG } from '../config';

/**
 * Determines whether the next target should be Acquired or Synthetic.
 * Uses a weighted probability.
 * @returns {'Acquired' | 'Synthetic'}
 */
export function getNextTargetType() {
    const isSynthetic = Math.random() < APP_CONFIG.SYNTHETIC_PROBABILITY;
    return isSynthetic ? 'Synthetic' : 'Acquired';
}

/**
 * Helper to select the image source based on the type.
 * @param {Object} caseData - The triple { acquired: string, synthetic: string, input: string }
 * @param {'Acquired' | 'Synthetic'} type
 * @returns {string} - The URL of the target image
 */
export function getTargetImage(caseData, type) {
    if (type === 'Acquired') return caseData.acquired;
    if (type === 'Synthetic') return caseData.synthetic;
    throw new Error(`Invalid target type: ${type}`);
}
