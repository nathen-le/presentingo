/**
 * Real-Time Web Audio API Analyzer for Volume, Pitch, and Silence/Pause Detection.
 */

export interface AudioAnalysisSnapshot {
  volume: number; // 0 - 100 relative
  pitch: number | null; // Hz or null if unpitched/silent
  isSpeaking: boolean;
  rms: number;
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private buffer: Float32Array = new Float32Array(0);
  private isInitialized = false;

  public async start(stream: MediaStream): Promise<void> {
    this.mediaStream = stream;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AudioContextClass();

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.sourceNode = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    this.sourceNode.connect(this.analyser);
    this.buffer = new Float32Array(this.analyser.fftSize);
    this.isInitialized = true;
  }

  public getSnapshot(): AudioAnalysisSnapshot {
    if (!this.isInitialized || !this.analyser || !this.audioContext) {
      return { volume: 0, pitch: null, isSpeaking: false, rms: 0 };
    }

    (this.analyser as any).getFloatTimeDomainData(this.buffer);

    // 1. Calculate RMS Volume
    let sumSquares = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      const val = this.buffer[i];
      sumSquares += val * val;
    }
    const rms = Math.sqrt(sumSquares / this.buffer.length);

    // Map RMS (0 to ~0.3) to 0-100 scale
    // 0.005 threshold for quiet noise floor
    const minRms = 0.005;
    const maxRms = 0.25;
    let volume = 0;

    if (rms > minRms) {
      const normalized = Math.min(1, (rms - minRms) / (maxRms - minRms));
      volume = Math.round(Math.pow(normalized, 0.75) * 100);
    }

    const isSpeaking = volume > 8;

    // 2. Pitch Detection (Autocorrelation) if speaking
    let pitch: number | null = null;
    if (isSpeaking) {
      pitch = this.autoCorrelate(this.buffer, this.audioContext.sampleRate);
    }

    return { volume, pitch, isSpeaking, rms };
  }

  /**
   * Autocorrelation algorithm to find fundamental frequency f0
   */
  private autoCorrelate(buffer: Float32Array, sampleRate: number): number | null {
    const SIZE = buffer.length;
    let sumSquares = 0;
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      sumSquares += val * val;
    }

    const rootMeanSquare = Math.sqrt(sumSquares / SIZE);
    if (rootMeanSquare < 0.01) {
      return null; // Signal too weak for reliable pitch
    }

    // Trim leading/trailing zeroes or quiet edges
    let r1 = 0;
    let r2 = SIZE - 1;
    const thres = 0.2;

    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < thres) {
        r2 = SIZE - i;
        break;
      }
    }

    const buf = buffer.slice(r1, r2);
    const bufSize = buf.length;

    // Autocorrelation
    const c = new Float32Array(bufSize);
    for (let i = 0; i < bufSize; i++) {
      for (let j = 0; j < bufSize - i; j++) {
        c[i] += buf[j] * buf[j + i];
      }
    }

    // Find first local minimum after zero-lag peak
    let d = 0;
    while (c[d] > c[d + 1] && d < bufSize - 1) {
      d++;
    }

    // Find highest peak in valid human speech frequency range (70 Hz to 450 Hz)
    const minLag = Math.floor(sampleRate / 450); // ~106 samples at 48kHz
    const maxLag = Math.floor(sampleRate / 70);  // ~685 samples at 48kHz

    let maxValue = -1;
    let maxIndex = -1;

    for (let i = d; i < bufSize; i++) {
      if (i >= minLag && i <= maxLag) {
        if (c[i] > maxValue) {
          maxValue = c[i];
          maxIndex = i;
        }
      }
    }

    if (maxIndex === -1 || maxValue / c[0] < 0.35) {
      return null; // Low periodicity / unpitched sound (whisper/fricative)
    }

    // Parabolic interpolation for fine frequency estimation
    const x1 = c[maxIndex - 1];
    const x2 = c[maxIndex];
    const x3 = c[maxIndex + 1];

    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;

    let adjustedLag = maxIndex;
    if (a !== 0) {
      adjustedLag = maxIndex - b / (2 * a);
    }

    const frequency = sampleRate / adjustedLag;
    if (frequency >= 75 && frequency <= 450) {
      return Math.round(frequency);
    }

    return null;
  }

  public stop(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
  }
}
