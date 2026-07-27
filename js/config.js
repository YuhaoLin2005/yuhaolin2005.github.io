// ── 繁·园 · Configuration ──────────────────────────────────
// 佛道审美：静（空/寂）、舒展（自然/无为）、规律（呼吸节奏）
// All tunable parameters.

const CONFIG = {
  // ── 画布 ───────────────────────────────────────────────────
  bgColor: "#f5f0e8",

  // ── 雨帘 Rain Curtain — 纯氛围，几乎看不见 ──────────────────
  rain: {
    lineCount: 12,              // 极疏
    lineColor: [140, 130, 120],
    lineAlpha: 45,              // 极淡
    lineLength: 0.72,
    dropsPerLineMin: 2,
    dropsPerLineMax: 5,
    dropSizeMin: 2.0,
    dropSizeMax: 4.0,
    dropColor: [80, 100, 140],
    gravity: 0.07,              // 极慢
    detachProb: 0.025,
    swayBase: 0.25,
  },

  // ── 花枝 Branch — 纯视觉，无文字，花开花谢即信号 ──────────
  branch: {
    branchColor: [90, 75, 60],
    branchColorLight: [120, 100, 80],
    growthSpeed: 2.0,                 // 更慢舒展
    maxLevel: 5,
    branchAngle: 0.45,
    segmentLen: 18,
    flowerColor: [232, 120, 130],
    flowerColorAlt: [245, 200, 180],
    flowerMaxDia: 12,
    bloomDuration: 80,                // 更慢绽放
    flowerProb: 0.012,                // 极稀疏
    flowerLife: 3000,                 // 花更持久 (~50s)
    flowerFadeTime: 800,              // 更慢谢落
    swayAmp: 2.5,                     // 微摇
    swayFreq: 0.006,
    maxBranches: 5,
    // 枝上不显示文字 — 花枝是"思考生长"的纯视觉隐喻
  },

  // ── 飞燕 Swallow — 顿悟时刻：长静默→飞来→大词→淡出 ───────
  swallow: {
    flockSize: 3,
    birdColor: [40, 35, 45],
    approachMs: 3500,
    displayMs: 3000,            // 大字停留稍长
    fadeMs: 3500,
    waitMin: 32000,             // 更长静默 (~32-48s)
    waitMax: 48000,
    toggleMs: 800,
    minScale: 0.10,
    maxScale: 2.2,
    bigWordSize: 42,            // 大字略小更精致
    bigWordGrow: 12,
  },

  // ── 底部花 Ground Bloom — 根基：地面花朵舒展开放留词 ──────
  groundBloom: {
    count: 3,
    positions: [0.16, 0.5, 0.84], // x 位置（会加随机偏移）
    posJitter: 0.06,               // 位置随机偏移 ±6%
    growMs: 3000,
    bloomMs: 2500,
    displayMs: 6000,               // 词停留更久
    fadeMs: 3000,
    waitMin: 10000,
    waitMax: 18000,
    stemMaxLen: [30, 40, 35],      // 每朵不同茎长
    flowerMaxDia: 10,
    keywordSize: 13,
    yBase: 0.93,
  },

  // ── 情绪映射 Emotion Mapping ───────────────────────────────
  emotion: {
    defaultProfile: {
      calm: 0.7,
      expansive: 0.5,
      active: 0.3,
      agitated: 0.1,
      introspective: 0.4,
      detached: 0.2,
    },
    visualMapping: {
      calm:           { swayAmp: 0.5,  gravity: 0.6,  speed: 0.7,  flutter: 0.6  },
      expansive:      { swayAmp: 1.0,  gravity: 0.8,  speed: 1.0,  flutter: 1.0  },
      active:         { swayAmp: 1.4,  gravity: 1.1,  speed: 1.3,  flutter: 1.5  },
      agitated:       { swayAmp: 2.2,  gravity: 1.6,  speed: 1.8,  flutter: 2.4  },
      introspective:  { swayAmp: 0.4,  gravity: 0.5,  speed: 0.5,  flutter: 0.3  },
      detached:       { swayAmp: 0.25, gravity: 0.3,  speed: 0.3,  flutter: 0.15 },
    },
  },

  // ── 音频 Audio ──────────────────────────────────────────────
  audio: {
    baseBpm: 44,
    rootNote: "C2",
    chordProgression: ["I", "V", "vi", "IV"],
    reverbMix: 0.55,
    padVolume: 0.10,
    melodyVolume: 0.14,
    emotionBpmShift: 10,
  },

  // ── LLM ─────────────────────────────────────────────────────
  llmWorkerUrl: "https://fu-proxy.YOURNAME.workers.dev",
  llmEnabled: true,
  llmFissionProb: 0.5,
  llmSuggestInterval: 800,

  // ── 系统 ───────────────────────────────────────────────────
  maxKeywords: 12,
  keywordLifetime: 1800,

  // 身份关键词 — 动词比名词真。这是林宇浩做的事，不是他给自己贴的标签
  defaultKeywords: [
    "build in public",
    "question → test",
    "self-falsify",
    "honest failure",
    "systems not tools",
    "measure everything",
    "write to think",
    "design from first principles",
  ],
};
