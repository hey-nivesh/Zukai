/**
 * ZUKAI PLAYBACK STORE TESTS
 */

import { usePlaybackStore } from '../src/features/playback/playbackStore';

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn().mockResolvedValue(undefined),
          pauseAsync: jest.fn().mockResolvedValue(undefined),
          stopAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
          setPositionAsync: jest.fn().mockResolvedValue(undefined),
          setRateAsync: jest.fn().mockResolvedValue(undefined),
        },
        status: { isLoaded: true, isPlaying: true, durationMillis: 60000 },
      }),
    },
  },
}));

// Mock tracksApi & playbackApi
jest.mock('../src/features/tracks/api/tracksApi', () => ({
  fetchChapters: jest.fn().mockResolvedValue([
    { id: 'c1', track_id: 't1', position: 1, title: 'Chapter 1', start_seconds: 0, end_seconds: 30, summary: null },
    { id: 'c2', track_id: 't1', position: 2, title: 'Chapter 2', start_seconds: 30, end_seconds: 60, summary: null },
  ]),
  fetchTranscript: jest.fn().mockResolvedValue({
    track_id: 't1',
    raw_text: 'Hello world. This is Zukai.',
    segments: [
      { start_ms: 0, end_ms: 5000, text: 'Hello world.' },
      { start_ms: 5000, end_ms: 10000, text: 'This is Zukai.' },
    ],
    created_at: new Date().toISOString(),
  }),
  getSignedAudioUrl: jest.fn().mockResolvedValue('https://example.com/audio.m4a'),
}));

jest.mock('../src/features/playback/api/playbackApi', () => ({
  updatePlaybackProgress: jest.fn().mockResolvedValue({}),
  fetchPlaybackProgress: jest.fn().mockResolvedValue({
    user_id: 'u1',
    track_id: 't1',
    position_seconds: 15,
    speed: 1.25,
    completed: false,
    updated_at: new Date().toISOString(),
  }),
}));

describe('PlaybackStore', () => {
  beforeEach(() => {
    usePlaybackStore.setState({
      activeTrack: null,
      isPlaying: false,
      isBuffering: false,
      positionMs: 0,
      durationMs: 0,
      speed: 1.0,
      chapters: [],
      transcript: null,
    });
  });

  it('initializes with default idle state', () => {
    const state = usePlaybackStore.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.positionMs).toBe(0);
    expect(state.speed).toBe(1.0);
    expect(state.activeTrack).toBeNull();
  });

  it('updates speed through setSpeed', async () => {
    const { setSpeed } = usePlaybackStore.getState();
    await setSpeed(1.5);
    expect(usePlaybackStore.getState().speed).toBe(1.5);
  });

  it('clamps skipBy position between 0 and duration', async () => {
    usePlaybackStore.setState({ positionMs: 10000, durationMs: 60000 });
    const { skipBy } = usePlaybackStore.getState();

    await skipBy(15);
    expect(usePlaybackStore.getState().positionMs).toBe(25000);

    await skipBy(-40);
    expect(usePlaybackStore.getState().positionMs).toBe(0);
  });

  it('loads track and sets up state in playTrack', async () => {
    const mockTrack = {
      id: 't1',
      job_id: 'j1',
      document_id: 'd1',
      owner_id: 'u1',
      org_id: null,
      storage_path: 'audio/u1/j1/final.m4a',
      duration_seconds: 60,
      format: 'm4a',
      bitrate_kbps: 128,
      file_size_bytes: 1000000,
      created_at: new Date().toISOString(),
    };

    await usePlaybackStore.getState().playTrack(mockTrack, 'Test Document');

    const state = usePlaybackStore.getState();
    expect(state.activeTrack?.id).toBe('t1');
    expect(state.documentTitle).toBe('Test Document');
    expect(state.chapters.length).toBe(2);
    expect(state.transcript).not.toBeNull();
  });
});

