/**
 * Synthesizes procedural ambient audio using Web Audio API.
 * Zero external audio files, zero 404 risks.
 */
class AudioManager {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private chimeTimer: number | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // AudioContext not supported or blocked
    }
  }

  public start() {
    this.init();
    if (!this.ctx || this.isPlaying) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;

    // Create dual ambient drone oscillators (gentle celestial pad: D and A)
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.001, t);
    this.droneGain.gain.exponentialRampToValueAtTime(0.12, t + 3.0);

    // Warm low filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);

    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'triangle';
    this.droneOsc1.frequency.setValueAtTime(146.83, t); // D3

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'sine';
    this.droneOsc2.frequency.setValueAtTime(220.00, t); // A3

    this.droneOsc1.connect(filter);
    this.droneOsc2.connect(filter);
    filter.connect(this.droneGain);

    if (this.masterGain) {
      this.droneGain.connect(this.masterGain);
    }

    this.droneOsc1.start();
    this.droneOsc2.start();

    // Occasional gentle ethereal chime
    this.scheduleNextChime();

    this.isPlaying = true;
  }

  public stop() {
    if (!this.isPlaying || !this.ctx) return;
    const t = this.ctx.currentTime;

    if (this.droneGain) {
      this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, t);
      this.droneGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
    }

    if (this.chimeTimer) {
      window.clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }

    setTimeout(() => {
      try {
        this.droneOsc1?.stop();
        this.droneOsc2?.stop();
        this.droneOsc1?.disconnect();
        this.droneOsc2?.disconnect();
      } catch {
        // already stopped
      }
      this.droneOsc1 = null;
      this.droneOsc2 = null;
      this.isPlaying = false;
    }, 1100);
  }

  public playChime(note = 587.33) {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, t);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 2.6);
    } catch {
      // Audio playback failed safely
    }
  }

  public playInteractSound() {
    this.playChime(880); // High A chime
  }

  private scheduleNextChime = () => {
    if (!this.isPlaying) return;
    const notes = [587.33, 659.25, 783.99, 880.00, 1046.50]; // D, E, G, A, C (Pentatonic)
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    this.playChime(randomNote);

    const delay = 4000 + Math.random() * 6000;
    this.chimeTimer = window.setTimeout(this.scheduleNextChime, delay);
  };

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const soundManager = new AudioManager();
