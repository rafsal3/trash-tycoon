/*
 * Procedural WebAudio sound effects + light background music (no audio files needed).
 * Output is muted whenever YouTube disables audio, the game is paused, or the player toggles it off.
 */
(function () {
  'use strict';

  const A = {
    ctx: null,
    master: null,
    sfxBus: null,
    musicBus: null,
    sysEnabled: true,   // controlled by ytgame.system audio setting
    paused: false,      // controlled by ytgame onPause/onResume
    sfxOn: true,        // in-game setting
    musicOn: true,      // in-game setting
    _nextNote: 0,
    _step: 0,
    _timer: null,
    _lastPlay: {},

    init() {
      if (this.ctx) { this.apply(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch (e) { return; }
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.connect(this.master);
      this.apply();
      this._timer = setInterval(() => this._schedule(), 90);
    },

    get audible() { return this.sysEnabled && !this.paused; },

    apply() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.master.gain.setTargetAtTime(this.audible ? 1 : 0, t, 0.02);
      this.sfxBus.gain.setTargetAtTime(this.sfxOn ? 0.55 : 0, t, 0.02);
      this.musicBus.gain.setTargetAtTime(this.musicOn ? 0.16 : 0, t, 0.05);
      if (this.audible && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      } else if (!this.audible && this.ctx.state === 'running') {
        // Small delay lets the fade-out finish before suspending.
        setTimeout(() => { if (!this.audible && this.ctx.state === 'running') this.ctx.suspend().catch(() => {}); }, 80);
      }
    },

    setSystemEnabled(v) { this.sysEnabled = !!v; this.apply(); },
    setPaused(v) { this.paused = !!v; this.apply(); },
    setSfx(v) { this.sfxOn = !!v; this.apply(); },
    setMusic(v) { this.musicOn = !!v; this.apply(); },

    _ok() { return this.ctx && this.audible && this.ctx.state === 'running'; },

    tone(freq, dur, opts = {}) {
      if (!this._ok()) return;
      const c = this.ctx;
      const t0 = c.currentTime + (opts.delay || 0);
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = opts.type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (opts.slide) osc.frequency.exponentialRampToValueAtTime(opts.slide, t0 + dur);
      const vol = opts.vol == null ? 0.4 : opts.vol;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(opts.bus || this.sfxBus);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    },

    noise(dur, opts = {}) {
      if (!this._ok()) return;
      const c = this.ctx;
      const len = Math.floor(c.sampleRate * dur);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource();
      src.buffer = buf;
      const f = c.createBiquadFilter();
      f.type = opts.filter || 'bandpass';
      f.frequency.value = opts.freq || 1200;
      const g = c.createGain();
      g.gain.value = opts.vol || 0.3;
      src.connect(f); f.connect(g); g.connect(this.sfxBus);
      src.start();
    },

    play(name, p = 0) {
      if (!this._ok()) return;
      const now = performance.now();
      const minGap = { pick: 35, botcoin: 160, full: 400 }[name] || 0;
      if (minGap && now - (this._lastPlay[name] || 0) < minGap) return;
      this._lastPlay[name] = now;

      const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
      switch (name) {
        case 'pick': {
          const step = PENTA[Math.min(p, PENTA.length - 1)];
          const f = 520 * Math.pow(2, step / 12);
          this.tone(f, 0.09, { type: 'triangle', vol: 0.35 });
          this.tone(f * 2, 0.06, { type: 'sine', vol: 0.12 });
          break;
        }
        case 'golden':
          [0, 4, 7, 12].forEach((s, i) => this.tone(880 * Math.pow(2, s / 12), 0.12, { type: 'triangle', vol: 0.3, delay: i * 0.05 }));
          break;
        case 'deposit':
          this.noise(0.12, { freq: 900, vol: 0.25 });
          [0, 7, 12, 16].forEach((s, i) => this.tone(660 * Math.pow(2, s / 12), 0.18, { type: 'square', vol: 0.09, delay: 0.04 + i * 0.06 }));
          break;
        case 'botcoin':
          this.tone(1320, 0.08, { type: 'square', vol: 0.04 });
          this.tone(1760, 0.1, { type: 'square', vol: 0.04, delay: 0.05 });
          break;
        case 'full':
          this.tone(220, 0.18, { type: 'sawtooth', vol: 0.12, slide: 150 });
          break;
        case 'buy':
          [0, 4, 7, 12, 16].forEach((s, i) => this.tone(523 * Math.pow(2, s / 12), 0.14, { type: 'triangle', vol: 0.3, delay: i * 0.045 }));
          break;
        case 'deny':
          this.tone(180, 0.15, { type: 'square', vol: 0.1 });
          break;
        case 'unlock':
          [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(392 * Math.pow(2, s / 12), 0.22, { type: 'triangle', vol: 0.28, delay: i * 0.08 }));
          break;
        case 'click':
          this.tone(900, 0.04, { type: 'sine', vol: 0.2 });
          break;
        case 'open':
          this.tone(600, 0.08, { type: 'sine', vol: 0.2, slide: 900 });
          break;
      }
    },

    // Simple, gentle looping tune scheduled ahead of time.
    _schedule() {
      if (!this.ctx || this.ctx.state !== 'running' || !this.audible) { this._nextNote = 0; return; }
      const c = this.ctx;
      const stepDur = 60 / 104 / 2; // eighth notes @ 104 bpm
      if (this._nextNote < c.currentTime) this._nextNote = c.currentTime + 0.05;
      const chords = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]]; // C, Am, F, G
      const melody = [12, 16, 19, 16, 14, 12, 9, 7, 9, 12, 14, 12, 7, 9, 4, 7];
      while (this._nextNote < c.currentTime + 0.35) {
        const t = this._nextNote - c.currentTime;
        const bar = Math.floor(this._step / 8) % 4;
        const chord = chords[bar];
        const base = 261.63;
        // arpeggio
        const n = chord[this._step % 3];
        this.tone(base * Math.pow(2, n / 12), stepDur * 0.9, { type: 'triangle', vol: 0.18, delay: t, bus: this.musicBus });
        // bass on beats
        if (this._step % 4 === 0) {
          this.tone(base / 4 * Math.pow(2, chord[0] / 12), stepDur * 3.5, { type: 'sine', vol: 0.45, delay: t, bus: this.musicBus });
        }
        // sparse melody
        if (this._step % 2 === 0 && (this._step >> 3) % 2 === 1) {
          const m = melody[(this._step >> 1) % melody.length];
          this.tone(base * Math.pow(2, m / 12), stepDur * 1.6, { type: 'sine', vol: 0.16, delay: t, bus: this.musicBus });
        }
        this._step++;
        this._nextNote += stepDur;
      }
    },
  };

  window.AudioSys = A;
})();
