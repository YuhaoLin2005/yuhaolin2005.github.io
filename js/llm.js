// ── 繁·园 · LLM Client ────────────────────────────────────
class LLMClient {
  constructor(workerUrl) { this.workerUrl = workerUrl; this.busy = false; }
  async expandKeyword(keyword, count = 3) {
    if (this.busy) return [];
    this.busy = true;
    try {
      const c = await this._call(`将概念"${keyword}"拆分为${count}个相关的子概念。每个不超过8字，换行分隔。只输出子概念列表。`);
      return c ? c.split("\n").map(s=>s.replace(/^[\d.\-•·\s]+/,"").trim()).filter(s=>s.length&&s.length<=20).slice(0,count) : [];
    } catch { return []; } finally { this.busy = false; }
  }
  async suggestDirections(active) {
    if (this.busy||!active.length) return [];
    this.busy = true;
    try {
      const c = await this._call(`当前思考关键词：${active.slice(0,5).join("、")}。提出2-3个全新的相关思考方向，每方向不超过10字，换行分隔。`);
      return c ? c.split("\n").map(s=>s.replace(/^[\d.\-•·\s]+/,"").trim()).filter(s=>s.length&&s.length<=20) : [];
    } catch { return []; } finally { this.busy = false; }
  }
  async _call(userContent) {
    const resp = await fetch(`${this.workerUrl}/v1/chat/completions`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ model:"Qwen/Qwen2.5-7B-Instruct", messages:[
        {role:"system",content:"你是概念关联引擎。只输出简洁关键词/短语列表。"},
        {role:"user",content:userContent}
      ], max_tokens:80, temperature:0.8 }),
    });
    if (!resp.ok) return null;
    return (await resp.json()).choices?.[0]?.message?.content || null;
  }
}
