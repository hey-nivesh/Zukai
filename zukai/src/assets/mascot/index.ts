/**
 * ZUKAI MASCOT ASSET INDEX
 * Maps each pose name to its require'd PNG image.
 * Update this file as new poses are added.
 */

export type MascotPose =
  | 'base'
  | 'welcome'
  | 'uploading'
  | 'thinking'
  | 'listening'
  | 'success'
  | 'error'
  | 'empty'
  | 'paywall'
  | 'offline';

// Image requires — Metro bundler resolves static require() at build time
// Poses not yet generated fall back to the base asset.
export const mascotImages: Record<MascotPose, number> = {
  base: require('./_base.png'),
  // These will be replaced once individual pose PNGs are generated:
  welcome: require('./_base.png'),
  uploading: require('./_base.png'),
  thinking: require('./_base.png'),
  listening: require('./_base.png'),
  success: require('./_base.png'),
  error: require('./_base.png'),
  empty: require('./_base.png'),
  paywall: require('./_base.png'),
  offline: require('./_base.png'),
};

