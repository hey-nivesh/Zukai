/**
 * ZUKAI VOICE CONFIGURATION
 * Location: /zukai/src/features/jobs/voicesConfig.ts
 * Description: Voice presets mapped to Gemini TTS personas
 */

export interface VoiceOption {
  id: string;
  name: string;
  role: string;
  tone: string;
  gender: 'neutral' | 'masculine' | 'feminine';
  geminiVoiceName: string; // Used by Phase 6 backend worker
  description: string;
}

export const VOICES: VoiceOption[] = [
  {
    id: 'alloy',
    name: 'Alloy',
    role: 'Lead Mentor',
    tone: 'Crisp & Engaging',
    gender: 'neutral',
    geminiVoiceName: 'Puck',
    description: 'Energetic, modern, and exceptionally clear for complex technical topics.',
  },
  {
    id: 'echo',
    name: 'Echo',
    role: 'Executive Analyst',
    tone: 'Warm & Authoritative',
    gender: 'masculine',
    geminiVoiceName: 'Charon',
    description: 'Deep, deliberate cadence ideal for business briefs and whitepapers.',
  },
  {
    id: 'fable',
    name: 'Fable',
    role: 'Academic Tutor',
    tone: 'Expressive & Narrative',
    gender: 'feminine',
    geminiVoiceName: 'Kore',
    description: 'Approachable, warm pacing that makes dense textbooks easy to follow.',
  },
  {
    id: 'onyx',
    name: 'Onyx',
    role: 'Deep Thinker',
    tone: 'Calm & Measured',
    gender: 'masculine',
    geminiVoiceName: 'Fenrir',
    description: 'Subtle and focused tone tailored for late-night study and philosophical texts.',
  },
];

export const DEFAULT_VOICE_ID = 'alloy';

