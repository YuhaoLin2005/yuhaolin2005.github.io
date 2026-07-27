// ── 繁·园 · Audio Engine ──────────────────────────────────
// Buddhist 梵呗 + Taoist 古琴 inspired procedural audio.
// 虚·远·淡·静 | 大音希声 | 声断意连 | 留白
// References: 梵呗 五声+变宫调式, 一板三眼, 散板起腔, 一领众和
//             道家古琴 散音/泛音/按音, 余韵, 留白
// Zero copyright — all synthesized via Web Audio API.

const AudioEngine = {
  ctx: null, masterGain: null, unlocked: false, playing: false,
  params: { bpm: 44, complexity: 0.15, reverb: 0.6, brightness: -0.2 },
  _scale: [], _chords: [], _seqTimer: null,
  _chordIdx: 0, _barCount: 0, _nextBellT: 0, _nextNoteT: 0,
  _droneOsc: null, _droneGain: null,

  init() {
    // 五声调式 + 变宫 (六声): C D E G A + B
    const C4 = 261.63, ratios = [1, 9/8, 5/4, 3/2, 5/3]; // pentatonic
    this._scale = [];
    for (let o = 0; o < 3; o++) for (const r of ratios) this._scale.push(C4 * Math.pow(2,o) * r);
    // 变宫 (B) — occasional Buddhist flavor
    this._biangong = [];
    const bRatios = [15/8]; // B = C * 15/8
    for (let o = 0; o < 3; o++) for (const r of bRatios) this._biangong.push(C4 * Math.pow(2,o) * r);
    // 梵呗风格和弦: sparse, open voicings
    this._chords = [
      [0, 3],       // C-G  (open fifth, 空)
      [3, 5],       // G-A  (suspended, 虚)
      [0, 2, 3],    // C-E-G (gentle resolution, 淡)
      [0, 4],       // C-A  (open sixth, 远)
    ];
  },

  unlock() {
    if (this.unlocked) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.ctx.destination);

      // Reverb: longer, deeper — temple hall acoustics
      const rv = this.ctx.createGain(); rv.gain.value = 0.55;
      const dl1 = this.ctx.createDelay(1.2); dl1.delayTime.value = 0.45;
      const dl2 = this.ctx.createDelay(1.2); dl2.delayTime.value = 0.72;
      const fb = this.ctx.createGain(); fb.gain.value = 0.25;
      rv.connect(dl1); dl1.connect(dl2); dl2.connect(fb); fb.connect(dl1);
      dl1.connect(this.masterGain); dl2.connect(this.masterGain);
      this._reverb = rv;

      this._dry = this.ctx.createGain(); this._dry.gain.value = 1;
      this._dry.connect(this.masterGain);

      // Deep drone (地声/散音): C3 — constant, barely audible
      this._droneGain = this.ctx.createGain();
      this._droneGain.gain.value = 0;
      this._droneGain.connect(this.masterGain);

      this.unlocked = true;
    } catch(e) { console.warn("Audio:", e); }
  },

  start(profile) {
    if (!this.unlocked) this.unlock();
    if (!this.unlocked || this.playing) return;
    this.playing = true;
    this.updateParams(profile);
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 3);
    // Start drone
    this._startDrone();
    this._chordIdx = 0; this._barCount = 0;
    this._schedule();
  },

  stop() {
    this.playing = false;
    if (this._seqTimer) clearTimeout(this._seqTimer);
    if (this._droneOsc) { try { this._droneOsc.stop(); } catch(e) {} }
    if (this.ctx) this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
  },

  updateParams(profile) {
    if (!profile) return;
    const ap = EmotionMapper.toAudioParams(profile);
    for (const k of ["bpm","complexity","reverb","brightness"])
      this.params[k] += (ap[k] - this.params[k]) * 0.03;
  },

  // ── Deep drone (地声) — 梵呗基底 ────────────────────────
  _startDrone() {
    if (this._droneOsc) return;
    const now = this.ctx.currentTime;
    this._droneOsc = this.ctx.createOscillator();
    this._droneOsc.type = "sine";
    this._droneOsc.frequency.value = 65.41; // C2 — deep earth tone
    const filt = this.ctx.createBiquadFilter();
    filt.type = "lowpass"; filt.frequency.value = 120;
    this._droneOsc.connect(filt);
    filt.connect(this._droneGain);
    this._droneGain.gain.setValueAtTime(0, now);
    this._droneGain.gain.linearRampToValueAtTime(0.04, now + 4);
    this._droneOsc.start(now);
  },

  // ── Scheduling: 一板三眼 (4/4, very slow) ────────────────
  _schedule() {
    if (!this.playing) return;
    const now = this.ctx.currentTime, beat = 60 / this.params.bpm, bar = beat * 4;

    // Bell strike at bar boundaries (法器: 大磬)
    if (now >= (this._nextBellT || 0)) {
      this._nextBellT = now + bar * (1.5 + Math.random());
      this._playBell();
    }

    // Chord pad: every 2-4 bars (留白: silence between)
    if (this._barCount % (3 + Math.floor(this.params.complexity * 2)) === 0) {
      if (now >= (this._nextNoteT || 0)) {
        this._nextNoteT = now + bar * 2;
        this._playPad(bar * 1.5);
        this._chordIdx = (this._chordIdx + 1) % this._chords.length;
      }
    }

    // Melody note: sparse, 一领众和 pattern
    const noteGap = beat * (4 + (1 - this.params.complexity) * 8); // 4-12 beats between notes
    if (now >= (this._nextNoteT || 0)) {
      this._nextNoteT = now + noteGap + Math.random() * beat * 2;
      this._playNote();
      // Response note (众和): quieter echo after leader note
      setTimeout(() => {
        if (this.playing) this._playResponseNote();
      }, beat * 2 * 1000);
    }

    this._barCount++;
    this._seqTimer = setTimeout(() => this._schedule(), Math.max(100, beat * 1000));
  },

  // ── Bell (法器: 引磬/大磬) — 泛音 天声 ──────────────────
  _playBell() {
    const now = this.ctx.currentTime;
    const freq = this._scale[7 + Math.floor(Math.random() * 3)]; // Higher pentatonic
    this._bellStrike(freq, 0.07, 3.5, now);
    // Occasional double bell
    if (Math.random() < 0.3) {
      const f2 = this._scale[5 + Math.floor(Math.random() * 4)];
      setTimeout(() => { if (this.playing) this._bellStrike(f2, 0.04, 2.5, this.ctx.currentTime); }, 400 + Math.random() * 600);
    }
  },

  _bellStrike(freq, vol, decaySec, now) {
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    // Bell timbre: triangle + slight inharmonic FM
    osc.type = "triangle";
    osc.frequency.value = freq;
    // Inharmonic overtone for bell character
    const osc2 = this.ctx.createOscillator(), g2 = this.ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = freq * 2.76; // Slightly off 3rd harmonic → bell quality
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(vol * 0.3, now + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + decaySec * 0.4);
    osc2.connect(g2); g2.connect(this._reverb);

    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 300;
    osc.connect(hp); hp.connect(g);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + decaySec);
    g.connect(this._dry); g.connect(this._reverb);
    osc.start(now); osc.stop(now + decaySec + 0.1);
    osc2.start(now); osc2.stop(now + decaySec * 0.4 + 0.1);
  },

  // ── Chord pad (和弦铺底) — 淡、虚 ───────────────────────
  _playPad(dur) {
    const now = this.ctx.currentTime, ch = this._chords[this._chordIdx];
    for (const i of ch) {
      const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = this._scale[i];
      const vol = CONFIG.audio.padVolume * (0.4 + Math.random() * 0.3);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol, now + 1.2); // Slow attack
      g.gain.setValueAtTime(vol * 0.7, now + dur - 0.8);
      g.gain.linearRampToValueAtTime(0, now + dur);
      const filt = this.ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = Math.max(150, 300 + this.params.brightness * 600);
      osc.connect(filt); filt.connect(g);
      g.connect(this._dry); g.connect(this._reverb);
      osc.start(now); osc.stop(now + dur + 0.1);
    }
  },

  // ── Melody note (领唱) — 一字多音 余韵 ──────────────────
  _playNote() {
    const now = this.ctx.currentTime, ch = this._chords[this._chordIdx];
    const base = ch[Math.floor(Math.random() * ch.length)];
    // 散音/按音 style: narrow range movement
    const idx = Math.max(0, Math.min(this._scale.length - 1, base + Math.floor(Math.random() * 3) - 1));
    this._noteStrike(this._scale[idx], CONFIG.audio.melodyVolume * 1.2, 2.0 + Math.random() * 3, now);
  },

  // ── Response note (众和) — quieter echo ──────────────────
  _playResponseNote() {
    if (!this.playing) return;
    const now = this.ctx.currentTime;
    const baseIdx = 2 + Math.floor(Math.random() * 6);
    const note = this._scale[Math.max(0, Math.min(this._scale.length - 1, baseIdx))];
    this._noteStrike(note, CONFIG.audio.melodyVolume * 0.5, 1.5 + Math.random() * 2, now);
    // 变宫: occasionally add the 6th tone (B) for Buddhist character
    if (Math.random() < 0.25) {
      const bg = this._biangong[2 + Math.floor(Math.random() * 2)];
      this._noteStrike(bg, CONFIG.audio.melodyVolume * 0.25, 1.2 + Math.random(), now + 0.3);
    }
  },

  _noteStrike(freq, vol, decaySec, now) {
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    // Warm 按音 (human voice) timbre
    osc.type = Math.random() > 0.5 ? "sine" : "triangle";
    osc.frequency.value = freq;
    const filt = this.ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 400 + this.params.brightness * 1200;
    osc.connect(filt); filt.connect(g);
    // Gentle attack, long decay (余韵: like guqin string decay)
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0005, now + decaySec);
    g.connect(this._dry); g.connect(this._reverb);
    osc.start(now); osc.stop(now + decaySec + 0.3);
  },

  // ── SFX ──────────────────────────────────────────────────
  playFission() {
    if (!this.unlocked || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Ripple of bell-like tones (裂变涟漪)
    for (let i = 0; i < 3; i++) {
      const freq = this._scale[4 + Math.floor(Math.random() * 5)];
      setTimeout(() => {
        if (!this.playing) return;
        this._bellStrike(freq, 0.05, 1.2 + Math.random(), this.ctx.currentTime);
      }, i * 250);
    }
  },

  playGrowth() {
    if (!this.unlocked || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Rising pentatonic (生长: ascending like a plant reaching)
    const notes = [2, 4, 5, 9]; // E4 A4 C5 E5
    for (let i = 0; i < notes.length; i++) {
      const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = this._scale[notes[i]];
      const t = now + i * 0.15;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.04, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 1.2);
      const filt = this.ctx.createBiquadFilter();
      filt.type = "lowpass"; filt.frequency.value = 600;
      osc.connect(filt); filt.connect(g);
      g.connect(this._dry); g.connect(this._reverb);
      osc.start(t); osc.stop(t + 1.3);
    }
  },
};
