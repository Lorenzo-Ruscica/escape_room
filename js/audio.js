// Sintetizzatore Web Audio procedurale: drone sotterraneo, gocce d'acqua e foley meccanici

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambientGain = null;
    this.powerHumGain = null;
    this.muted = false;
    this.started = false;
    this.dripTimer = null;
  }

  init() {
    if (this.started) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.72;
    this.master.connect(this.ctx.destination);

    this.startAmbience();
    this.started = true;
  }

  toggleMute() {
    this.init();
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.72, this.ctx.currentTime, 0.08);
    }
    return this.muted;
  }

  startAmbience() {
    const ctx = this.ctx;
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0.001;
    this.ambientGain.connect(this.master);
    this.ambientGain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 2.2);

    // Drone cavernoso profondo
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.value = 43.65; // F1
    osc2.frequency.value = 65.41; // C2 leggero battimento
    osc2.detune.value = -7;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 135;
    lowpass.Q.value = 3.2;

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.09;
    lfoGain.gain.value = 38;
    lfo.connect(lfoGain);
    lfoGain.connect(lowpass.frequency);

    osc1.connect(lowpass);
    osc2.connect(lowpass);
    lowpass.connect(this.ambientGain);

    osc1.start();
    osc2.start();
    lfo.start();

    // Ronzio trasformatore (attivo solo quando la corrente è ripristinata)
    this.powerHumGain = ctx.createGain();
    this.powerHumGain.gain.value = 0.0001;
    const hum = ctx.createOscillator();
    hum.type = 'sawtooth';
    hum.frequency.value = 100;
    const humFilter = ctx.createBiquadFilter();
    humFilter.type = 'bandpass';
    humFilter.frequency.value = 180;
    humFilter.Q.value = 4;
    hum.connect(humFilter);
    humFilter.connect(this.powerHumGain);
    this.powerHumGain.connect(this.master);
    hum.start();

    this.scheduleDrip();
  }

  setPowerHum(active) {
    if (!this.ctx || !this.powerHumGain) return;
    this.powerHumGain.gain.setTargetAtTime(active ? 0.032 : 0.0001, this.ctx.currentTime, 0.4);
  }

  scheduleDrip() {
    if (!this.ctx) return;
    const delay = 2600 + Math.random() * 4800;
    this.dripTimer = window.setTimeout(() => {
      if (!this.muted && this.ctx && this.ctx.state === 'running') {
        this.playWaterDrip();
      }
      this.scheduleDrip();
    }, delay);
  }

  createNoiseBuffer(duration = 0.5) {
    const length = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playWaterDrip() {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const base = 780 + Math.random() * 420;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(base * 1.65, t + 0.075);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.045, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playSoftHover() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    g.gain.setValueAtTime(0.012, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  playPickup() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [392, 523.25].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);
      g.gain.setValueAtTime(0.08, t + idx * 0.07);
      g.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.07 + 0.28);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.3);
    });
  }

  playDialTick(pitch = 1) {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(620 * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(180 * pitch, t + 0.045);
    g.gain.setValueAtTime(0.085, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.055);
  }

  playPaper() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(0.18);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1650;
    filter.Q.value = 1.4;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  playMetalSnap() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(0.35);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(920, t);
    bp.Q.value = 5.5;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.26, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);

    const thud = this.ctx.createOscillator();
    const tg = this.ctx.createGain();
    thud.type = 'sawtooth';
    thud.frequency.setValueAtTime(145, t);
    thud.frequency.exponentialRampToValueAtTime(42, t + 0.22);
    tg.gain.setValueAtTime(0.22, t);
    tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);

    src.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    thud.connect(tg);
    tg.connect(this.master);
    src.start(t);
    thud.start(t);
    thud.stop(t + 0.25);
  }

  playDoorTransition() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(92, t);
    osc.frequency.linearRampToValueAtTime(64, t + 0.42);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.11, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
    osc.connect(lp);
    lp.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  playSteamValve() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Cigolio metallico + soffio vapore
    const squeak = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    squeak.type = 'sine';
    squeak.frequency.setValueAtTime(540, t);
    squeak.frequency.linearRampToValueAtTime(790, t + 0.14);
    sg.gain.setValueAtTime(0.04, t);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    squeak.connect(sg);
    sg.connect(this.master);
    squeak.start(t);
    squeak.stop(t + 0.17);

    const hiss = this.ctx.createBufferSource();
    hiss.buffer = this.createNoiseBuffer(0.38);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800;
    const hg = this.ctx.createGain();
    hg.gain.setValueAtTime(0.09, t + 0.04);
    hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
    hiss.connect(hp);
    hp.connect(hg);
    hg.connect(this.master);
    hiss.start(t + 0.04);
  }

  playDrain() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(1.5);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(480, t);
    bp.frequency.exponentialRampToValueAtTime(110, t + 1.45);
    bp.Q.value = 3.5;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.48);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  playSwitchSpark() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.playMetalSnap();
    const spark = this.ctx.createBufferSource();
    spark.buffer = this.createNoiseBuffer(0.45);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2600;
    bp.Q.value = 2.4;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.22, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    spark.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    spark.start(t + 0.05);
    this.setPowerHum(true);
  }

  playScrape() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(0.42);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1200, t);
    bp.frequency.linearRampToValueAtTime(2100, t + 0.35);
    bp.Q.value = 2.2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  playVaultOpen() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const sub = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(55, t);
    sub.frequency.linearRampToValueAtTime(38, t + 3.2);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 140;
    sg.gain.setValueAtTime(0.01, t);
    sg.gain.linearRampToValueAtTime(0.26, t + 0.35);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
    sub.connect(lp);
    lp.connect(sg);
    sg.connect(this.master);
    sub.start(t);
    sub.stop(t + 3.45);

    const rumble = this.ctx.createBufferSource();
    rumble.buffer = this.createNoiseBuffer(3.2);
    const rlp = this.ctx.createBiquadFilter();
    rlp.type = 'lowpass';
    rlp.frequency.value = 320;
    const rg = this.ctx.createGain();
    rg.gain.setValueAtTime(0.16, t);
    rg.gain.exponentialRampToValueAtTime(0.0001, t + 3.15);
    rumble.connect(rlp);
    rlp.connect(rg);
    rg.connect(this.master);
    rumble.start(t);
  }
}

export const sound = new SoundEngine();
