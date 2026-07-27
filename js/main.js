// ── 繁·园 · Main — GitHub 名片：纯观赏，自动舒展 ────────────
(function() {
  var cntEl = document.getElementById("node-count");
  Sketch.init("canvas-container");

  // Staggered branch unfold — 自然无为，舒展
  setTimeout(function() {
    CONFIG.defaultKeywords.forEach(function(kw, i) {
      setTimeout(function() {
        Sketch.addKeyword(kw);
        if (cntEl) cntEl.textContent = i + 1;
      }, i * 2200);
    });
  }, 1500);
})();
