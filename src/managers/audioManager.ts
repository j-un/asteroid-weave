let audioContext: AudioContext | null = null;
let backgroundMusicBuffer: AudioBuffer | null = null;
let backgroundMusicSource: AudioBufferSourceNode | null = null;
let gainNode: GainNode | null = null;

export async function initializeAudioManager(): Promise<void> {
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const response = await fetch('/bgm.mp3');
    const arrayBuffer = await response.arrayBuffer();
    backgroundMusicBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (e) {
    console.error('Error loading background music:', e);
  }
}

export function playBackgroundMusic(): void {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  if (backgroundMusicBuffer && audioContext) {
    if (backgroundMusicSource) {
      backgroundMusicSource.stop();
      backgroundMusicSource.disconnect();
    }

    backgroundMusicSource = audioContext.createBufferSource();
    backgroundMusicSource.buffer = backgroundMusicBuffer;
    backgroundMusicSource.loop = true;

    if (!gainNode) {
      gainNode = audioContext.createGain();
      gainNode.gain.value = 0.5;
    }

    backgroundMusicSource.connect(gainNode);
    gainNode.connect(audioContext.destination);

    backgroundMusicSource.start(0);
  }
}

export function stopBackgroundMusic(): void {
  if (backgroundMusicSource) {
    backgroundMusicSource.stop();
    backgroundMusicSource.disconnect();
    backgroundMusicSource = null;
  }
}

export function cleanupAudioManager(): void {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}

export function isMusicPlaying(): boolean {
  return backgroundMusicSource !== null;
}
