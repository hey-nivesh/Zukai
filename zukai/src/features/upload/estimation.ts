/**
 * ZUKAI AUDIO ESTIMATION ENGINE
 * Location: /zukai/src/features/upload/estimation.ts
 * Description: Estimates word count and audio duration across depth modes
 */

import { DepthMode } from '@/types/database';

export interface DepthEstimate {
  depth: DepthMode;
  label: string;
  description: string;
  estimatedMinutes: number;
  durationLabel: string;
  spokenWords: number;
}

/**
 * Approximates source document word count based on file format and size
 */
export function estimateSourceWords(fileSizeBytes: number, extension: string): number {
  if (fileSizeBytes <= 0) return 0;

  let bytesPerWord = 20; // default PDF average
  const ext = extension.toLowerCase();

  if (ext === 'txt') {
    bytesPerWord = 6;
  } else if (ext === 'docx') {
    bytesPerWord = 35;
  } else if (ext === 'pptx') {
    bytesPerWord = 90;
  } else if (ext === 'pdf') {
    bytesPerWord = 22;
  }

  const rawEstimate = Math.round(fileSizeBytes / bytesPerWord);
  // Clamp between realistic document ranges
  return Math.max(100, Math.min(rawEstimate, 250000));
}

/**
 * Calculates audio explanation length per depth mode
 * Guidelines: Quick = 3-5m, Standard = 10-15m, Deep = 20-30m
 */
export function calculateDepthEstimates(sourceWords: number): Record<DepthMode, DepthEstimate> {
  // Scaling factors based on document density
  const scale = Math.log10(Math.max(500, sourceWords)) / Math.log10(5000);
  const clampedScale = Math.max(0.8, Math.min(scale, 1.4));

  const quickMin = Math.round(4 * clampedScale);
  const stdMin = Math.round(12 * clampedScale);
  const deepMin = Math.round(25 * clampedScale);

  return {
    quick: {
      depth: 'quick',
      label: 'Quick Summary',
      description: 'Key takeaways and executive summary in a brisk breakdown.',
      estimatedMinutes: quickMin,
      durationLabel: `~${quickMin} min audio`,
      spokenWords: quickMin * 140,
    },
    standard: {
      depth: 'standard',
      label: 'Standard Overview',
      description: 'Balanced conceptual explanations with real-world examples.',
      estimatedMinutes: stdMin,
      durationLabel: `~${stdMin} min audio`,
      spokenWords: stdMin * 140,
    },
    deep: {
      depth: 'deep',
      label: 'Deep Dive',
      description: 'Comprehensive section-by-section masterclass with details.',
      estimatedMinutes: deepMin,
      durationLabel: `~${deepMin} min audio`,
      spokenWords: deepMin * 140,
    },
  };
}

