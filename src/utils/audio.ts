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

  // Bird chirp synthesis using quick frequency modulation
  public playBirdChirp() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, t);
      osc.frequency.exponentialRampToValueAtTime(3400, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(2600, t + 0.16);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.035, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch {}
  }

  // Water splash / fountain ripple chime
  public playWaterSplash() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(1250, t + 0.15);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.52);
    } catch {}
  }

  // Friendly soft chord for NPC conversation initiation
  public playNPCGreeting() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);

        gain.gain.setValueAtTime(0.045, t + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.05 + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx!.destination);

        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + 0.65);
      });
    } catch {}
  }

  // Feedback for player gestures (Wave, Cheer, Sit)
  public playGestureSound(gesture: string = 'wave') {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    try {
      if (gesture === 'wave') {
        this.playChime(783.99); // G5 chime
      } else if (gesture === 'cheer') {
        this.playChime(1046.50); // High C6 chime
      } else if (gesture === 'sit') {
        this.playChime(440.00); // A4 grounding tone
      } else if (gesture === 'dance') {
        this.playChime(880.00);
      }
    } catch {}
  }

  private scheduleNextChime = () => {
    if (!this.isPlaying) return;
    const notes = [587.33, 659.25, 783.99, 880.00, 1046.50]; // D, E, G, A, C (Pentatonic)
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    this.playChime(randomNote);

    const delay = 4000 + Math.random() * 6000;
    this.chimeTimer = window.setTimeout(this.scheduleNextChime, delay);
  };

  // Weather-specific audio: procedural gentle rainfall
  private rainNoiseNode: AudioBufferSourceNode | null = null;
  private rainGainNode: GainNode | null = null;

  public setWeatherSound(mode: 'clear' | 'rain' | 'snow' | 'fog') {
    if (!this.ctx || !this.isPlaying) return;

    if (mode === 'rain') {
      if (this.rainNoiseNode) return;
      try {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02; // Pink-ish filter
          lastOut = data[i];
          data[i] *= 3.5;
        }

        this.rainNoiseNode = this.ctx.createBufferSource();
        this.rainNoiseNode.buffer = buffer;
        this.rainNoiseNode.loop = true;

        const rainFilter = this.ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);

        this.rainGainNode = this.ctx.createGain();
        this.rainGainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
        this.rainGainNode.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 2.0);

        this.rainNoiseNode.connect(rainFilter);
        rainFilter.connect(this.rainGainNode);
        if (this.masterGain) {
          this.rainGainNode.connect(this.masterGain);
        }
        this.rainNoiseNode.start();
      } catch {}
    } else {
      if (this.rainNoiseNode && this.rainGainNode) {
        try {
          const t = this.ctx.currentTime;
          this.rainGainNode.gain.setValueAtTime(this.rainGainNode.gain.value, t);
          this.rainGainNode.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
          setTimeout(() => {
            this.rainNoiseNode?.stop();
            this.rainNoiseNode?.disconnect();
            this.rainNoiseNode = null;
            this.rainGainNode = null;
          }, 1100);
        } catch {
          this.rainNoiseNode = null;
          this.rainGainNode = null;
        }
      }
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const soundManager = new AudioManager();

export const playBirdChirp = () => soundManager.playBirdChirp();
export const playWaterSplash = () => soundManager.playWaterSplash();
export const playNPCGreeting = () => soundManager.playNPCGreeting();
export const playGestureSound = (gesture: string = 'wave') => soundManager.playGestureSound(gesture);
