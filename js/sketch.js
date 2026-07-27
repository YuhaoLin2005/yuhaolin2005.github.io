// ── 繁·园 · P5 Sketch ─────────────────────────────────────
// 四级视觉层次：雨帘(氛围) < 花枝(生长) < 地面花(根基词) < 燕子(顿悟大词)
// 燕子：纯 V 形翅膀 → 变大 → 鸟/词交替 → 大词留屏 → 淡出
// 花枝：纯视觉隐喻——花开花谢即信号，不显示文字
// 底部花：地面花朵舒展开放→留词→淡出→再生（顺序轮转关键词不重复）

const Sketch = {
  p: null,
  rainLines: [], branches: [], swallows: [], drops: [], groundBlooms: [],
  emotionMul: { swayAmp: 1, gravity: 1, speed: 1, flutter: 1 },
  w: 0, h: 0, _gbKwIdx: 0,  // ground bloom keyword cycling
  breathPhase: 0,            // 6s breathing light cycle phase

  init(containerId) {
    const self = this;
    new p5(function(p) {
      self.p = p;
      p.setup = function() {
        const c = p.createCanvas(p.windowWidth, p.windowHeight);
        c.parent(containerId);
        self.w = p.width; self.h = p.height;
        self._initRain(); self._initSwallows(); self._initGroundBlooms();
        p.frameRate(60); p.textFont("serif");
      };
      p.draw = function() {
        self.w = p.width; self.h = p.height;
        p.background(245, 240, 232);
        p.noStroke();

        // ── Breathing light cycle (6s, ±8%) + Audio sub-cycle (3s, warm/cool) ──
        self.breathPhase += 0.001047; // 2*PI/360 frames at 60fps = 6s cycle
        var breath = 1 + Math.sin(self.breathPhase) * 0.08;
        self._breath = breath; // store for Branch/Swallow/ground bloom glow
        var audioShift = Math.sin(self.breathPhase * 2) * 0.04; // 3s sub-cycle

        // ── Ambient gradient overlay (江南阴天漫射天光) ──
        var ctx = p.drawingContext;
        var grad = ctx.createLinearGradient(0, 0, p.width, p.height);
        var ar = 255 + Math.floor(audioShift * 20);
        var ag = 252 + Math.floor(audioShift * 10);
        var ab = 245 - Math.floor(audioShift * 10);
        var cr = 235 - Math.floor(audioShift * 10);
        var cg = 238 + Math.floor(audioShift * 5);
        var cb = 242 + Math.floor(audioShift * 15);
        grad.addColorStop(0, 'rgba(' + ar + ',' + ag + ',' + ab + ',' + (0.06 * breath).toFixed(3) + ')');
        grad.addColorStop(0.5, 'rgba(248,245,238,' + (0.03 * breath).toFixed(3) + ')');
        grad.addColorStop(1, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (0.06 * breath).toFixed(3) + ')');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, p.width, p.height);

        // ── Soft noise blobs (atmosphere) ──
        for (var i = 0; i < 8; i++) {
          p.fill(235, 230, 222, 18);
          p.ellipse(p.width * p.noise(i, p.frameCount * 0.001), p.height * p.noise(i + 10, p.frameCount * 0.001), p.width * 0.3, p.height * 0.2);
        }
        self._drawRain(); self._drawGroundBlooms(); self._drawBranches(); self._drawSwallows(); self._drawDrops();
      };
      p.windowResized = function() {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        self.w = p.width; self.h = p.height; self._initRain();
      };
    }, document.getElementById(containerId));
  },

  addKeyword: function(keyword) {
    var cfg = CONFIG.branch;
    if (this.branches.length >= cfg.maxBranches) this.branches.shift();
    this.branches.push(new Branch(this.w * 0.12 + Math.random() * this.w * 0.76, this.h * 0.9, -Math.PI / 2, 1, keyword));
  },
  updateEmotion: function(mul) { this.emotionMul = mul; },
  triggerFission: function() {
    var self = this;
    this.emotionMul.flutter = Math.min(3, this.emotionMul.flutter + 0.6);
    setTimeout(function() { self.emotionMul.flutter = Math.max(0.3, self.emotionMul.flutter - 0.6); }, 800);
  },

  // Prevent keyword overlap: only one big keyword on screen at a time
  _isBigKeywordActive: function() {
    for (var i = 0; i < this.swallows.length; i++) {
      var s = this.swallows[i];
      if (s.phase === 'display' || s.phase === 'fade') return true;
    }
    return false;
  },

  // ── Rain ──────────────────────────────────────────────────
  _initRain: function() {
    var cfg = CONFIG.rain; this.rainLines = [];
    var sp = this.w / (cfg.lineCount + 1);
    for (var i = 1; i <= cfg.lineCount; i++) {
      var x = sp * i, drops = [];
      var ct = Math.floor(cfg.dropsPerLineMin + Math.random() * (cfg.dropsPerLineMax - cfg.dropsPerLineMin));
      for (var j = 0; j < ct; j++) drops.push({ y: Math.random() * this.h * cfg.lineLength, size: cfg.dropSizeMin + Math.random() * (cfg.dropSizeMax - cfg.dropSizeMin) });
      drops.sort(function(a, b) { return a.y - b.y; });
      this.rainLines.push({ x: x, baseX: x, drops: drops });
    }
  },
  _drawRain: function() {
    var cfg = CONFIG.rain, p = this.p, sw = cfg.swayBase * this.emotionMul.swayAmp;
    p.strokeWeight(1);
    for (var li = 0; li < this.rainLines.length; li++) {
      var l = this.rainLines[li];
      var off = Math.sin(p.frameCount * 0.02 + l.baseX * 0.01) * sw * 15, x = l.baseX + off;
      p.stroke(cfg.lineColor[0], cfg.lineColor[1], cfg.lineColor[2], cfg.lineAlpha);
      p.line(x, 0, x, this.h * cfg.lineLength);
      for (var di = 0; di < l.drops.length; di++) {
        var d = l.drops[di];
        d.y += cfg.gravity * this.emotionMul.gravity;
        if (d.y > this.h * cfg.lineLength) {
          d.y = 0;
          if (Math.random() < cfg.detachProb * this.emotionMul.gravity)
            this.drops.push({ x: x, y: this.h * cfg.lineLength, vy: 1.5 + Math.random() * 4, vx: (Math.random() - 0.5) * 1.5, size: d.size, life: 40 + Math.random() * 40, maxLife: 80 });
        }
        var a = 100 + Math.floor(100 * (1 - d.y / (this.h * cfg.lineLength)));
        p.fill(cfg.dropColor[0], cfg.dropColor[1], cfg.dropColor[2], a); p.noStroke();
        p.ellipse(x, d.y, d.size, d.size * 1.3);
      }
    }
  },
  _drawDrops: function() {
    var p = this.p, alive = [];
    for (var i = 0; i < this.drops.length; i++) {
      var d = this.drops[i]; d.x += d.vx; d.y += d.vy; d.vy += 0.08; d.life--;
      if (d.life <= 0) continue;
      p.fill(80, 100, 140, Math.floor(180 * d.life / d.maxLife)); p.noStroke();
      p.ellipse(d.x, d.y, d.size * 0.6, d.size * 0.8); alive.push(d);
    }
    this.drops = alive;
  },

  // ── Ground Bloom ──────────────────────────────────────────
  _initGroundBlooms: function() {
    var cfg = CONFIG.groundBloom; this.groundBlooms = [];
    for (var i = 0; i < cfg.count; i++) {
      var jx = (Math.random() - 0.5) * 2 * cfg.posJitter;
      var x = this.w * (cfg.positions[i] + jx);
      var y = this.h * cfg.yBase;
      var stemLen = cfg.stemMaxLen[i] || cfg.stemMaxLen[0];
      this.groundBlooms.push(new GroundBloom(x, y, stemLen, i * 5000 + Math.random() * 3000));
    }
  },
  _drawGroundBlooms: function() {
    var p = this.p, now = p.millis();
    for (var i = 0; i < this.groundBlooms.length; i++)
      this.groundBlooms[i].draw(p, now, this.emotionMul);
  },

  // ── Branches ──────────────────────────────────────────────
  _drawBranches: function() {
    for (var i = 0; i < this.branches.length; i++)
      this.branches[i].draw(this.p, this.emotionMul);
  },

  // ── Swallows ──────────────────────────────────────────────
  _initSwallows: function() {
    var cfg = CONFIG.swallow; this.swallows = [];
    var cycle = cfg.waitMin + cfg.approachMs + cfg.displayMs + cfg.fadeMs;
    var gap = cycle / cfg.flockSize;
    for (var i = 0; i < cfg.flockSize; i++)
      this.swallows.push(new Swallow(i * gap * 1000 + Math.random() * 3000));
  },
  _drawSwallows: function() {
    var p = this.p, now = p.millis();
    for (var i = 0; i < this.swallows.length; i++)
      this.swallows[i].draw(p, now, this.emotionMul, this.w, this.h);
  },
};

// ═══════════════ Branch ════════════════════════════════════

function Branch(x, y, angle, level, keyword) {
  this.x = x; this.y = y; this.angle = angle; this.level = level; this.keyword = keyword;
  this.segments = []; this.flowers = []; this.growIdx = 0; this.branching = []; this.age = 0;
  this.kwShow = true; this.kwTimer = 0; this.kwIdx = 0;
  this._gen();
}
Branch.prototype._gen = function() {
  var cfg = CONFIG.branch, cx = this.x, cy = this.y, a = this.angle;
  var total = 8 + Math.floor(Math.random() * 6);
  for (var i = 0; i < total; i++) {
    var len = cfg.segmentLen * (1 - i * 0.04), nx = cx + Math.cos(a) * len, ny = cy + Math.sin(a) * len;
    this.segments.push({ x1: cx, y1: cy, x2: nx, y2: ny, angle: a });
    cx = nx; cy = ny;
    if (i > 2 && i < total - 3 && Math.random() < 0.2 && this.branching.length < 3)
      this.branching.push({ startIdx: i, angle: a + (Math.random() > 0.5 ? 1 : -1) * cfg.branchAngle * (1 + Math.random()), segs: [], cx: cx, cy: cy });
    a += (Math.random() - 0.5) * 0.3;
  }
  for (var bi = 0; bi < this.branching.length; bi++) {
    var br = this.branching[bi], bx = br.cx, by = br.cy, ba = br.angle;
    var ct = 4 + Math.floor(Math.random() * 5);
    for (var i = 0; i < ct; i++) {
      var len2 = cfg.segmentLen * 0.7 * (1 - i * 0.06);
      var nx = bx + Math.cos(ba) * len2, ny = by + Math.sin(ba) * len2;
      br.segs.push({ x1: bx, y1: by, x2: nx, y2: ny, angle: ba });
      bx = nx; by = ny; ba += (Math.random() - 0.5) * 0.4;
    }
  }
};
Branch.prototype.draw = function(p, mul) {
  this.age++;
  var cfg = CONFIG.branch;
  this.growIdx = Math.min(this.growIdx + cfg.growthSpeed * mul.speed * 0.5, this.segments.length);
  var vis = Math.floor(this.growIdx);

  for (var i = 0; i < vis; i++) {
    var seg = this.segments[i]; if (!seg || seg.hasFlower) continue;
    if (Math.random() < cfg.flowerProb * mul.speed * 0.5) {
      seg.hasFlower = true;
      this.flowers.push({
        x: (seg.x1 + seg.x2) / 2, y: (seg.y1 + seg.y2) / 2,
        dia: cfg.flowerMaxDia * (0.4 + Math.random() * 0.6),
        phase: 0, bloomed: false, fading: false, alpha: 255,
        color: Math.random() > 0.4 ? cfg.flowerColor : cfg.flowerColorAlt,
      });
    }
  }
  // Flower lifecycle
  for (var fi = this.flowers.length - 1; fi >= 0; fi--) {
    var f = this.flowers[fi];
    if (!f.bloomed) {
      f.phase = Math.min(f.phase + 0.6, cfg.bloomDuration);
      if (f.phase >= cfg.bloomDuration) f.bloomed = true;
    } else if (!f.fading) {
      f.life = (f.life || 0) + 1;
      if (f.life > cfg.flowerLife) { f.fading = true; f.phase = 0; }
    } else {
      f.phase++;
      f.alpha = Math.max(0, 255 * (1 - f.phase / cfg.flowerFadeTime));
      if (f.alpha <= 0) {
        var si = -1;
        for (var j = 0; j < this.segments.length; j++) {
          var sx = (this.segments[j].x1 + this.segments[j].x2) / 2;
          var sy = (this.segments[j].y1 + this.segments[j].y2) / 2;
          if (Math.abs(sx - f.x) < 5 && Math.abs(sy - f.y) < 5) { si = j; break; }
        }
        if (si >= 0) this.segments[si].hasFlower = false;
        this.flowers.splice(fi, 1);
      }
    }
  }

  // ── Draw ──────────────────────────────────────────────
  p.push();
  // Depth: older branches fade into the mist (景深)
  var depthAlpha = Math.max(0.72, 1 - this.age / 15000);
  var breath = Sketch._breath || 1;
  p.strokeWeight(this.level === 1 ? 2 : 1.2);
  var swA = cfg.swayAmp * mul.swayAmp * 0.6;

  for (var i = 0; i < vis; i++) {
    var seg = this.segments[i]; if (!seg) continue;
    var off = Math.sin(p.frameCount * 0.012 + seg.y1 * 0.005) * swA;
    var col = this.level === 1 ? cfg.branchColor : cfg.branchColorLight;
    p.stroke(col[0], col[1], col[2], Math.floor(220 * depthAlpha));
    p.line(seg.x1 + off, seg.y1, seg.x2 + off, seg.y2);
  }
  for (var bi = 0; bi < this.branching.length; bi++) {
    var br = this.branching[bi]; if (vis <= br.startIdx) continue;
    var bv = Math.min(vis - br.startIdx, br.segs.length);
    for (var i = 0; i < bv; i++) {
      var bseg = br.segs[i];
      var off2 = Math.sin(p.frameCount * 0.012 + bseg.y1 * 0.005) * swA * 0.5;
      p.stroke(cfg.branchColorLight[0], cfg.branchColorLight[1], cfg.branchColorLight[2], Math.floor(180 * depthAlpha));
      p.line(bseg.x1 + off2, bseg.y1, bseg.x2 + off2, bseg.y2);
    }
  }

  // Flowers
  for (var fi = 0; fi < this.flowers.length; fi++) {
    var f = this.flowers[fi];
    var bt = Math.min(1, f.phase / cfg.bloomDuration), dia = f.dia * bt;
    var off3 = Math.sin(p.frameCount * 0.004 + f.y * 0.003) * swA * 0.06;
    var cx = f.x + off3, cy = f.y;
    // ── Glow — faint radial light (节点径向光晕) ──
    var glowA = Math.floor(14 * bt * breath);
    if (glowA > 2) {
      p.fill(f.color[0], f.color[1], f.color[2], glowA);
      p.noStroke();
      p.ellipse(cx, cy, dia * 2.2, dia * 2);
    }
    for (var pi = 0; pi < 5; pi++) {
      var a = pi / 5 * Math.PI * 2 + bt * 0.5;
      p.fill(f.color[0], f.color[1], f.color[2], f.alpha * bt); p.noStroke();
      p.ellipse(cx + Math.cos(a) * dia * 0.45, cy + Math.sin(a) * dia * 0.45, dia * 0.5, dia * 0.4);
    }
    var cc = f.color[0] === cfg.flowerColor[0] ? [255, 220, 100] : [255, 180, 140];
    p.fill(cc[0], cc[1], cc[2], f.alpha * bt); p.ellipse(cx, cy, dia * 0.25, dia * 0.25);
  }

  // Branch keywords removed — branches are pure visual metaphor
  p.pop();
};

// ═══════════════ Swallow — Pure V-wing ════════════════════

function Swallow(delay) {
  this.phase = 'wait';         // 'wait' | 'approach' | 'display' | 'fade'
  this.tw = 0;                 // phase elapsed ms
  this.ts = 0;                 // phase start ms
  this.x = 0; this.y = 0;
  this.sx = 0; this.sy = 0;    // start position
  this.sc = 0.12;              // current scale
  this.kw = '';                // keyword
  this.fa = 255;               // fade alpha
  this.dly = delay;            // initial stagger
  this.loaded = false;         // first wait completed
}
Swallow.prototype._enter = function(ph, now) {
  this.phase = ph; this.ts = now; this.tw = 0;
};
Swallow.prototype.draw = function(p, now, mul, w, h) {
  var cfg = CONFIG.swallow, c = cfg.birdColor;
  this.tw = now - this.ts;

  if (this.phase === 'wait') {
    if (!this.loaded) {
      this.loaded = true;
      this.ts = now - this.dly; // apply stagger
      this.tw = this.dly;
    }
    if (this.tw < cfg.waitMin + Math.random() * (cfg.waitMax - cfg.waitMin)) return;
    // Prevent overlap: only one big keyword at a time
    if (Sketch._isBigKeywordActive()) return;
    // Enter approach
    this.kw = CONFIG.defaultKeywords[Math.floor(Math.random() * CONFIG.defaultKeywords.length)];
    this.sx = w * (0.2 + Math.random() * 0.6);
    this.sy = h * (0.2 + Math.random() * 0.2);
    this.x = this.sx; this.y = this.sy;
    this._enter('approach', now);
    return;
  }

  if (this.phase === 'approach') {
    var prog = Math.min(1, this.tw / cfg.approachMs);
    var ep = prog < 0.5 ? 2 * prog * prog : 1 - Math.pow(-2 * prog + 2, 2) / 2;
    this.sc = cfg.minScale + ep * (cfg.maxScale - cfg.minScale);
    // Gentle drift toward center
    this.x = this.sx + (w * 0.5 - this.sx) * ep * 0.15;
    this.y = this.sy + (h * 0.4 - this.sy) * ep * 0.15;
    // Subtle wing pulse
    var wing = Math.sin(now * 0.005 * mul.flutter) * 0.08;

    // Bird ↔ keyword toggle
    var showBird = Math.floor(this.tw / cfg.toggleMs) % 2 === 0;

    if (showBird) {
      // ── Pure V-shape wings (lines only) ──
      p.push(); p.translate(this.x, this.y);
      p.rotate(wing);
      var sc = this.sc, breath = Sketch._breath || 1;
      // ── Soft outline glow (轮廓柔光) ──
      var glowA = Math.floor(20 * Math.min(sc, 1.5) * breath);
      if (glowA > 3) {
        p.stroke(c[0], c[1], c[2], glowA);
        p.strokeWeight(3.5 * Math.min(sc, 1.5));
        p.noFill();
        p.beginShape(); p.vertex(0,0); p.quadraticVertex(-5*sc,-3*sc,-10*sc,-7*sc); p.endShape();
        p.beginShape(); p.vertex(0,0); p.quadraticVertex(5*sc,-3*sc,10*sc,-7*sc); p.endShape();
      }
      // ── Main wings ──
      p.stroke(c[0], c[1], c[2], 180);
      p.strokeWeight(Math.max(0.8, 1.4 * Math.min(sc, 2.0)));
      p.noFill();

      // Left wing — sweeping curve from center
      p.beginShape();
      p.vertex(0, 0);
      p.quadraticVertex(-5 * sc, -3 * sc, -10 * sc, -7 * sc);
      p.endShape();

      // Right wing — sweeping curve from center
      p.beginShape();
      p.vertex(0, 0);
      p.quadraticVertex(5 * sc, -3 * sc, 10 * sc, -7 * sc);
      p.endShape();

      p.pop();
    } else {
      // Keyword during approach — small, flickering
      var ka = 150 + Math.sin(this.tw * 0.008) * 40;
      p.fill(70, 55, 40, Math.floor(ka));
      p.noStroke(); p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12 + this.sc * 2.5); p.textStyle(p.ITALIC);
      p.text(this.kw, this.x, this.y);
    }

    if (prog >= 1) this._enter('display', now);
    return;
  }

  if (this.phase === 'display' || this.phase === 'fade') {
    if (this.phase === 'display') {
      if (this.tw >= cfg.displayMs) { this._enter('fade', now); this.tw = 0; }
    }
    var alpha = this.phase === 'display'
      ? Math.floor(230 + Math.sin(this.tw * 0.0015) * 20)
      : Math.floor(255 * Math.max(0, 1 - this.tw / cfg.fadeMs));
    if (alpha < 8) { this._enter('wait', now); this.loaded = false; return; }

    // Large keyword on screen — the calling card
    var sz = cfg.bigWordSize + Math.min(1, this.tw / 400) * cfg.bigWordGrow;
    p.fill(70, 55, 40, alpha);
    p.noStroke(); p.textAlign(p.CENTER, p.CENTER);
    p.textSize(sz); p.textStyle(p.ITALIC);
    p.text(this.kw, this.x, this.y);

    if (this.phase === 'fade' && this.tw >= cfg.fadeMs) {
      this._enter('wait', now); this.loaded = false;
    }
  }
};

// ═══════════════ Ground Bloom — 底部花舒展开放留词 ══════════

function GroundBloom(x, yBase, stemLen, delay) {
  this.x = x;
  this.yBase = yBase;
  this.stemMax = stemLen;
  this.delay = delay;
  this.phase = 'wait';  // wait → grow → bloom → display → fade → wait
  this.tw = 0; this.ts = 0;
  this.loaded = false;
  this.stemLen = 0;
  this.petalOpen = 0;
  this.alpha = 255;
  this.kw = '';
  this.flowerColor = Math.random() > 0.4 ? CONFIG.branch.flowerColor : CONFIG.branch.flowerColorAlt;
}
GroundBloom.prototype._enter = function(ph, now) {
  this.phase = ph; this.ts = now; this.tw = 0;
};
GroundBloom.prototype.draw = function(p, now, mul) {
  var cfg = CONFIG.groundBloom;
  this.tw = now - this.ts;

  if (this.phase === 'wait') {
    if (!this.loaded) {
      this.loaded = true;
      this.ts = now - this.delay;
      this.tw = this.delay;
    }
    if (this.tw < cfg.waitMin + Math.random() * (cfg.waitMax - cfg.waitMin)) return;
    // Sequential cycling: each ground flower shows the next keyword in order
    this.kw = CONFIG.defaultKeywords[Sketch._gbKwIdx % CONFIG.defaultKeywords.length];
    Sketch._gbKwIdx++;
    this._enter('grow', now);
    return;
  }

  if (this.phase === 'grow') {
    var gp = Math.min(1, this.tw / cfg.growMs);
    // ease-out
    this.stemLen = this.stemMax * (1 - Math.pow(1 - gp, 2));
    if (gp >= 1) this._enter('bloom', now);
  }

  if (this.phase === 'bloom') {
    this.stemLen = this.stemMax;
    var bp = Math.min(1, this.tw / cfg.bloomMs);
    this.petalOpen = bp < 0.5 ? 2 * bp * bp : 1 - Math.pow(-2 * bp + 2, 2) / 2;
    this.alpha = 255;
    if (bp >= 1) this._enter('display', now);
  }

  if (this.phase === 'display') {
    this.stemLen = this.stemMax;
    this.petalOpen = 1;
    this.alpha = 210 + Math.sin(this.tw * 0.0015) * 20;
    if (this.tw >= cfg.displayMs) this._enter('fade', now);
  }

  if (this.phase === 'fade') {
    this.stemLen = this.stemMax;
    this.petalOpen = 1;
    this.alpha = Math.floor(255 * Math.max(0, 1 - this.tw / cfg.fadeMs));
    if (this.alpha < 8) {
      this.stemLen = 0; this.petalOpen = 0;
      this._enter('wait', now); this.loaded = false;
      return;
    }
  }

  if (this.phase === 'wait' && !this.loaded) return; // nothing to draw

  // ── Draw ──────────────────────────────────────────────
  var sway = Math.sin(now * 0.0025 + this.x * 0.01) * 2.5;
  var fx = this.x + sway * 0.3;
  var fy = this.yBase - this.stemLen;

  // Stem — subtle curve
  if (this.stemLen > 1) {
    p.stroke(90, 75, 60, this.alpha * 0.5);
    p.strokeWeight(1.2);
    p.noFill();
    p.beginShape();
    p.vertex(this.x, this.yBase);
    p.quadraticVertex(this.x + sway, this.yBase - this.stemLen * 0.5, fx, fy);
    p.endShape();
  }

  // Flower petals
  if (this.petalOpen > 0.01) {
    var dia = cfg.flowerMaxDia * this.petalOpen;
    var fc = this.flowerColor;
    for (var pi = 0; pi < 5; pi++) {
      var a = pi / 5 * Math.PI * 2 + this.petalOpen * 0.5;
      p.fill(fc[0], fc[1], fc[2], this.alpha * this.petalOpen); p.noStroke();
      p.ellipse(fx + Math.cos(a) * dia * 0.5, fy + Math.sin(a) * dia * 0.5, dia * 0.5, dia * 0.4);
    }
    var cc = fc[0] === CONFIG.branch.flowerColor[0] ? [255, 220, 100] : [255, 180, 140];
    p.fill(cc[0], cc[1], cc[2], this.alpha * this.petalOpen); p.noStroke();
    p.ellipse(fx, fy, dia * 0.25, dia * 0.25);
  }

  // Keyword above flower
  if (this.petalOpen > 0.6 && this.alpha > 20 && this.kw) {
    var kwAlpha = Math.floor(this.alpha * Math.min(1, this.petalOpen));
    p.fill(70, 55, 40, kwAlpha);
    p.noStroke(); p.textAlign(p.CENTER);
    p.textSize(cfg.keywordSize); p.textStyle(p.ITALIC);
    p.text(this.kw, fx, fy - cfg.flowerMaxDia - 8);
  }
};
