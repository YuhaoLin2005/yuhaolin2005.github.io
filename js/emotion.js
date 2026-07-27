// ── 繁·园 · Emotion Mapper ─────────────────────────────────
// Chinese keyword → 6-dimension emotion profile
// Maps token semantics to visual/audio parameters

const EmotionMapper = {
  // ── 情绪词典 ─────────────────────────────────────────────
  lexicon: {
    // 平静系
    静:[1,0.5,0,0,0.3,0], 安:[1,0.3,0,0,0.2,0.1], 宁:[0.9,0.4,0,0,0.3,0.1],
    定:[0.8,0.2,0,0,0.4,0.2], 松:[0.7,0.6,0.1,0,0.1,0], 淡:[0.8,0.2,0,0,0.3,0.3],
    空:[0.6,0.4,0,0,0.2,0.5], 禅:[0.9,0.4,0,0,0.5,0.2], 止:[0.7,0.1,0,0,0.4,0.4],
    // 舒展系
    开:[0.2,1,0.3,0,0,0], 展:[0.3,1,0.2,0,0,0], 阔:[0.4,0.9,0.1,0,0,0.1],
    放:[0.1,0.9,0.4,0.1,0,0], 舒:[0.4,0.9,0.1,0,0,0], 畅:[0.3,0.8,0.4,0,0,0],
    扬:[0.2,0.8,0.5,0.1,0,0], 升:[0.2,0.7,0.5,0.1,0,0.1],
    // 活跃系
    动:[0,0.3,1,0.2,0,0], 活:[0,0.4,0.9,0.1,0,0], 跳:[0,0.2,0.9,0.3,0,0],
    飞:[0,0.5,0.8,0.2,0,0], 热:[0,0.3,0.8,0.3,0,0], 燃:[0,0.2,0.7,0.5,0,0],
    快:[0,0.3,0.8,0.2,0,0], 奔:[0,0.4,0.7,0.4,0,0],
    // 激荡系
    激:[0,0,0.3,1,0,0], 荡:[0,0,0.2,1,0.1,0], 涌:[0,0.1,0.3,0.9,0,0],
    冲:[0,0,0.4,0.9,0,0], 破:[0,0,0.3,0.9,0.1,0.1], 裂:[0,0,0.2,0.9,0.1,0.2],
    怒:[0,0,0.2,1,0,0.1], 暴:[0,0,0.3,1,0,0.2],
    // 内敛系
    思:[0.4,0,0.1,0,0.9,0.2], 想:[0.3,0.2,0.1,0,0.8,0.2], 沉:[0.5,0,0,0,0.8,0.3],
    深:[0.4,0.1,0,0,0.8,0.2], 默:[0.6,0,0,0,0.7,0.4], 独:[0.3,0,0,0,0.6,0.6],
    藏:[0.4,0,0,0,0.6,0.5], 谜:[0.3,0.1,0.1,0,0.6,0.4],
    // 疏离系
    远:[0.2,0.2,0,0,0.3,0.8], 离:[0.2,0,0,0.1,0.3,0.8], 冷:[0.4,0,0,0,0.2,0.9],
    孤:[0.2,0,0,0,0.5,0.8], 寂:[0.5,0,0,0,0.4,0.7], 寞:[0.3,0,0,0,0.4,0.8],
    虚:[0.4,0.1,0,0,0.3,0.7], 漂:[0.1,0.3,0.1,0,0.2,0.7],
    // 常见词组
    思考:[0.3,0.2,0.2,0,0.8,0.1], 生长:[0.2,0.8,0.3,0,0.1,0],
    流动:[0.4,0.6,0.4,0,0.1,0], 自由:[0.1,0.8,0.6,0.1,0.1,0.1],
    未来:[0.1,0.6,0.5,0.2,0.4,0.2], 迷茫:[0.1,0.1,0,0.1,0.7,0.5],
    孤独:[0.2,0,0,0,0.5,0.8], 希望:[0.1,0.7,0.5,0.1,0.2,0],
    梦想:[0.1,0.7,0.6,0.2,0.3,0.1], 平静:[1,0.3,0,0,0.2,0.1],
    焦虑:[0,0,0.4,0.7,0.4,0.2], 勇气:[0,0.5,0.7,0.5,0.2,0],
    温暖:[0.4,0.6,0.3,0,0.1,0], 遗憾:[0.2,0,0,0.2,0.6,0.5],
    初心:[0.4,0.3,0.2,0,0.5,0.1],
  },

  dims: ["calm","expansive","active","agitated","introspective","detached"],

  // ── 分析关键词，返回情绪画像 ─────────────────────────────
  analyze(keywords) {
    const p = { calm:0, expansive:0, active:0, agitated:0, introspective:0, detached:0 };
    let hits = 0;
    for (const kw of keywords) {
      if (this.lexicon[kw]) { this._add(p, this.lexicon[kw]); hits++; continue; }
      for (const ch of kw) {
        if (this.lexicon[ch]) { this._add(p, this.lexicon[ch]); hits++; }
      }
    }
    if (hits > 0) for (const d of this.dims) p[d] = Math.min(1, p[d] / hits);
    const def = CONFIG.emotion.defaultProfile;
    for (const d of this.dims) if (p[d] < 0.05) p[d] = def[d] * 0.3;
    return p;
  },

  // ── 情绪 → 视觉乘数 ─────────────────────────────────────
  toVisualMultipliers(p) {
    const m = CONFIG.emotion.visualMapping, r = { swayAmp:1, gravity:1, speed:1, flutter:1 };
    for (const [dim, w] of Object.entries(p)) {
      const v = m[dim]; if (!v) continue;
      for (const [k, val] of Object.entries(v)) r[k] += (val - 1) * w;
    }
    return r;
  },

  // ── 情绪 → 音频参数 ─────────────────────────────────────
  toAudioParams(p) {
    return {
      bpm: Math.round(CONFIG.audio.baseBpm
        + p.active * CONFIG.audio.emotionBpmShift
        + p.agitated * CONFIG.audio.emotionBpmShift * 2
        - p.calm * CONFIG.audio.emotionBpmShift * 0.8
        - p.introspective * CONFIG.audio.emotionBpmShift * 0.5),
      complexity: Math.min(1, p.active*0.6 + p.agitated*1.0 + p.expansive*0.3),
      reverb: Math.min(0.7, p.detached*0.5 + p.introspective*0.4 + p.calm*0.2),
      brightness: Math.max(-1, Math.min(1, p.active*0.5 + p.expansive*0.4 - p.detached*0.3)),
    };
  },

  dominantEmotion(p) { return Object.entries(p).reduce((a,b) => b[1]>a[1]?b:a, ["calm",0])[0]; },

  _add(p, v) { for (let i=0;i<this.dims.length;i++) p[this.dims[i]] += v[i]; },
};
