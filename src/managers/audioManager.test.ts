import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as AudioManager from './audioManager';

// --- Mocks ---
const mockAudioBuffer = {} as AudioBuffer;

const mockAudioContext = {
  decodeAudioData: vi.fn().mockResolvedValue(mockAudioBuffer),
  createBufferSource: vi.fn().mockReturnValue({
    buffer: null,
    loop: false,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
  }),
  createGain: vi.fn().mockReturnValue({
    gain: { value: 0 },
    connect: vi.fn(),
  }),
  close: vi.fn(),
  destination: {} as AudioDestinationNode,
  currentTime: 0,
  sampleRate: 44100,
  listener: {} as AudioListener,
  state: 'running' as const,
  resume: vi.fn(),
  suspend: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  createOscillator: vi.fn(),
  createPeriodicWave: vi.fn(),
  createDelay: vi.fn(),
  createBiquadFilter: vi.fn(),
  createWaveShaper: vi.fn(),
  createPanner: vi.fn(),
  createConvolver: vi.fn(),
  createDynamicsCompressor: vi.fn(),
  createAnalyser: vi.fn(),
  createScriptProcessor: vi.fn(),
  createStereoPanner: vi.fn(),
  createChannelSplitter: vi.fn(),
  createChannelMerger: vi.fn(),
  createMediaElementSource: vi.fn(),
  createMediaStreamSource: vi.fn(),
  createMediaStreamDestination: vi.fn(),
};

const fetchSpy = vi.spyOn(globalThis, 'fetch');

window.AudioContext = vi.fn().mockImplementation(function () {
  return mockAudioContext;
});
window.webkitAudioContext = window.AudioContext;

// --- Tests ---
describe('AudioManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      } as Response)
    );
    // Reset internal state for each test
    AudioManager.cleanupAudioManager();
  });

  describe('initializeAudioManager', () => {
    it('should initialize AudioContext and fetch/decode BGM', async () => {
      await AudioManager.initializeAudioManager();
      expect(window.AudioContext).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith('/bgm.mp3');
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
    });

    it('should handle errors during initialization', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fetchSpy.mockRejectedValueOnce(new Error('Fetch failed'));
      await AudioManager.initializeAudioManager();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading background music:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('playBackgroundMusic', () => {
    it('should play music if initialized', async () => {
      await AudioManager.initializeAudioManager();
      AudioManager.playBackgroundMusic();
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
      const source = mockAudioContext.createBufferSource();
      expect(source.start).toHaveBeenCalledWith(0);
    });

    it('should create a new AudioContext if not initialized', () => {
      AudioManager.playBackgroundMusic();
      expect(window.AudioContext).toHaveBeenCalledTimes(1);
    });
  });

  describe('stopBackgroundMusic', () => {
    it('should stop the music if it is playing', async () => {
      await AudioManager.initializeAudioManager();
      AudioManager.playBackgroundMusic();
      const source = mockAudioContext.createBufferSource();
      expect(AudioManager.isMusicPlaying()).toBe(true);
      AudioManager.stopBackgroundMusic();
      expect(source.stop).toHaveBeenCalled();
      expect(AudioManager.isMusicPlaying()).toBe(false);
    });
  });

  describe('cleanupAudioManager', () => {
    it('should close the audio context', async () => {
      await AudioManager.initializeAudioManager();
      AudioManager.cleanupAudioManager();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  describe('isMusicPlaying', () => {
    it('should return false initially', () => {
      expect(AudioManager.isMusicPlaying()).toBe(false);
    });

    it('should return true after playing music', async () => {
      await AudioManager.initializeAudioManager();
      AudioManager.playBackgroundMusic();
      expect(AudioManager.isMusicPlaying()).toBe(true);
    });

    it('should return false after stopping music', async () => {
      await AudioManager.initializeAudioManager();
      AudioManager.playBackgroundMusic();
      AudioManager.stopBackgroundMusic();
      expect(AudioManager.isMusicPlaying()).toBe(false);
    });
  });
});
