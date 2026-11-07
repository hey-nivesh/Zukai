/**
 * ZUKAI DESIGN SYSTEM - MOTION & HAPTICS
 * Configured for React Native Reanimated, CSS Transitions, and Expo Haptics.
 */

export const motion = {
  // Duration Scale (in milliseconds)
  duration: {
    instant: 100,
    fast: 180,       // Hover, button press
    normal: 280,     // Card fade, dropdown open
    slow: 450,       // Modal presentation, sheet slide
    deliberate: 700, // Mascot entrance, celebration
    shimmerSweep: 1200, // Light-sweep animation across shiny button
    shimmerInterval: 4000, // Pause between idle button shimmers
  },

  // Easing Curves (Cubic Bezier)
  easing: {
    // Apple standard spring-like decelerate
    decelerate: 'cubic-bezier(0.16, 1, 0.3, 1)',
    // Standard acceleration for exits
    accelerate: 'cubic-bezier(0.7, 0, 0.84, 0)',
    // Balanced ease for generic transitions
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Linear for continuous audio waveforms and progress loops
    linear: 'linear',
  },

  // React Native Reanimated Spring Configs
  spring: {
    snappy: {
      mass: 0.8,
      damping: 15,
      stiffness: 220,
    },
    smooth: {
      mass: 1.0,
      damping: 22,
      stiffness: 140,
    },
    bouncy: {
      mass: 0.6,
      damping: 9,
      stiffness: 180,
    },
    sheet: {
      mass: 1.2,
      damping: 24,
      stiffness: 160,
    },
  },

  // Interactive Scale Shifts
  scale: {
    pressed: 0.97,    // Primary & secondary buttons on touch down
    cardPressed: 0.985,
    activeTab: 1.05,
  },

  // Haptics Trigger Map (for Expo Haptics porting)
  haptics: {
    buttonPress: 'ImpactFeedbackStyle.Medium',
    pillToggle: 'ImpactFeedbackStyle.Light',
    scrubberTick: 'SelectionAsync',
    audioCompleted: 'NotificationFeedbackType.Success',
    uploadError: 'NotificationFeedbackType.Error',
    warningLimit: 'NotificationFeedbackType.Warning',
  },
} as const;

export type Motion = typeof motion;

