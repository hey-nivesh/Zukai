/**
 * ZUKAI DESIGN SYSTEM - GRADIENT RECIPES
 * Configured as structured objects directly consumable by expo-linear-gradient
 * and custom canvas/radial mesh backgrounds in React Native & Web.
 */

export interface LinearGradientRecipe {
  colors: readonly string[];
  locations?: readonly number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export interface RadialGlow {
  color: string;
  cx: string; // e.g. '80%', '20%'
  cy: string; // e.g. '15%', '85%'
  radius: number | string; // e.g. 350, '400px'
  opacity: number;
}

export interface BackgroundMeshRecipe {
  baseColor: string;
  glows: readonly RadialGlow[];
}

export const gradients = {
  // -------------------------------------------------------------
  // 1. BUTTON GRADIENTS (with gloss reflection)
  // -------------------------------------------------------------
  button: {
    primary: {
      colors: ['#A4F924', '#92F702', '#75CE00'],
      locations: [0, 0.5, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    } as LinearGradientRecipe,

    primaryHover: {
      colors: ['#B8F95F', '#A4F924', '#85E300'],
      locations: [0, 0.5, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    } as LinearGradientRecipe,

    primaryPressed: {
      colors: ['#85E300', '#75CE00', '#5BA300'],
      locations: [0, 0.5, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    } as LinearGradientRecipe,

    // Upper 45% gloss highlight overlay
    shineOverlay: {
      colors: ['rgba(255, 255, 255, 0.40)', 'rgba(255, 255, 255, 0.00)'],
      locations: [0, 1],
      start: { x: 0.5, y: 0 },
      end: { x: 0.5, y: 1 },
    } as LinearGradientRecipe,

    secondaryGlass: {
      colors: ['rgba(255, 255, 255, 0.10)', 'rgba(255, 255, 255, 0.03)'],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    } as LinearGradientRecipe,

    destructive: {
      colors: ['#FF5E8A', '#FF3D71', '#D41E52'],
      locations: [0, 0.5, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    } as LinearGradientRecipe,
  },

  // -------------------------------------------------------------
  // 2. CARD & ELEMENT GRADIENTS
  // -------------------------------------------------------------
  card: {
    surface: {
      colors: ['rgba(19, 40, 48, 0.75)', 'rgba(13, 30, 36, 0.65)'],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    } as LinearGradientRecipe,

    highlightBorder: {
      colors: ['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.05)', 'rgba(146, 247, 2, 0.30)'],
      locations: [0, 0.6, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    } as LinearGradientRecipe,

    progressRing: {
      colors: ['#92F702', '#0BF807', '#00B0FF'],
      locations: [0, 0.6, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    } as LinearGradientRecipe,
  },

  // -------------------------------------------------------------
  // 3. BACKGROUND MESH RECIPES FOR ALL SCREENS
  // -------------------------------------------------------------
  screenMesh: {
    splash: {
      baseColor: '#050D10',
      glows: [
        { color: '#92F702', cx: '50%', cy: '45%', radius: 320, opacity: 0.22 },
        { color: '#0BF807', cx: '50%', cy: '55%', radius: 420, opacity: 0.15 },
        { color: '#00B0FF', cx: '50%', cy: '85%', radius: 250, opacity: 0.08 },
      ],
    } as BackgroundMeshRecipe,

    onboarding: {
      baseColor: '#09161B',
      glows: [
        { color: '#92F702', cx: '85%', cy: '15%', radius: 360, opacity: 0.18 },
        { color: '#0BF807', cx: '15%', cy: '60%', radius: 320, opacity: 0.14 },
        { color: '#132830', cx: '50%', cy: '90%', radius: 400, opacity: 0.40 },
      ],
    } as BackgroundMeshRecipe,

    home: {
      baseColor: '#09161B',
      glows: [
        { color: '#92F702', cx: '85%', cy: '12%', radius: 340, opacity: 0.16 },
        { color: '#0BF807', cx: '10%', cy: '40%', radius: 300, opacity: 0.10 },
        { color: '#00E676', cx: '90%', cy: '80%', radius: 320, opacity: 0.08 },
      ],
    } as BackgroundMeshRecipe,

    upload: {
      baseColor: '#09161B',
      glows: [
        { color: '#92F702', cx: '50%', cy: '25%', radius: 380, opacity: 0.18 },
        { color: '#0BF807', cx: '20%', cy: '75%', radius: 340, opacity: 0.12 },
        { color: '#00B0FF', cx: '80%', cy: '85%', radius: 280, opacity: 0.10 },
      ],
    } as BackgroundMeshRecipe,

    processing: {
      baseColor: '#071216',
      glows: [
        { color: '#92F702', cx: '50%', cy: '40%', radius: 420, opacity: 0.24 },
        { color: '#0BF807', cx: '50%', cy: '50%', radius: 300, opacity: 0.20 },
        { color: '#00E676', cx: '20%', cy: '80%', radius: 360, opacity: 0.12 },
      ],
    } as BackgroundMeshRecipe,

    player: {
      baseColor: '#050D10',
      glows: [
        { color: '#92F702', cx: '50%', cy: '30%', radius: 400, opacity: 0.22 },
        { color: '#0BF807', cx: '80%', cy: '60%', radius: 350, opacity: 0.15 },
        { color: '#09161B', cx: '20%', cy: '85%', radius: 450, opacity: 0.50 },
      ],
    } as BackgroundMeshRecipe,

    library: {
      baseColor: '#09161B',
      glows: [
        { color: '#92F702', cx: '15%', cy: '15%', radius: 300, opacity: 0.12 },
        { color: '#0BF807', cx: '90%', cy: '50%', radius: 320, opacity: 0.09 },
        { color: '#132830', cx: '50%', cy: '90%', radius: 380, opacity: 0.35 },
      ],
    } as BackgroundMeshRecipe,

    paywall: {
      baseColor: '#050D10',
      glows: [
        { color: '#92F702', cx: '50%', cy: '20%', radius: 420, opacity: 0.28 },
        { color: '#FFD600', cx: '85%', cy: '45%', radius: 320, opacity: 0.15 },
        { color: '#0BF807', cx: '15%', cy: '75%', radius: 350, opacity: 0.18 },
      ],
    } as BackgroundMeshRecipe,

    settings: {
      baseColor: '#09161B',
      glows: [
        { color: '#92F702', cx: '80%', cy: '15%', radius: 280, opacity: 0.10 },
        { color: '#0BF807', cx: '15%', cy: '70%', radius: 300, opacity: 0.08 },
      ],
    } as BackgroundMeshRecipe,
  },
} as const;

