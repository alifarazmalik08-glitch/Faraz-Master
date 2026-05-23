/* ============================================================
   FARAZ MASTER — MEMORY SYSTEM
   Stores conversations in Firebase + local fallback
============================================================ */
'use strict';
window.FM = window.FM || {};

FM.memory = {
  _local: 'fm_memories',
  _convos: 'fm_conversations',
  items: [],

  save(userMsg, agentResponse) {
    const mem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      user: userMsg.substring(0, 300),
      agent: agentResponse.substring(0, 500),
      summary: this._summarize(userMsg, agentResponse),
      category: this._categorize(userMsg),
      language: FM.language.current,
      emotion: FM.emotion.state,
      tags: this._extractTags(userMsg)
    };

    // Local save
    const list = this._loadLocal();
    list.push(mem);
    if (list.length > 500) list.splice(0, list.length - 500);
    localStorage.setItem(this._local, JSON.stringify(list));

    // Firebase save (if available)
    FM.storage?.saveDoc?.('memories', mem.id, mem);

    FM.analytics.increment('memoriesStored');
    this._updateStats();
    return mem;
  },

  _summarize(user, agent) {
    const combined = user + ' ' + agent;
    return combined.substring(0, 120).trim() + (combined.length > 120 ? '...' : '');
  },

  _categorize(text) {
    const t = text.toLowerCase();
    if (t.match(/task|kaam|کام|ਕੰਮ|to.?do|remind/i)) return '✅ Task';
    if (t.match(/news|khabar|خبر|ਖ਼ਬਰ/i)) return '📰 News';
    if (t.match(/research|tahqeeq|تحقیق|ਖੋਜ/i)) return '🔍 Research';
    if (t.match(/weather|mausam|موسم|ਮੌਸਮ/i)) return '🌤️ Weather';
    if (t.match(/code|program|script|function|class/i)) return '💻 Code';
    if (t.match(/health|sehat|صحت|doctor|medicine/i)) return '🏥 Health';
    if (t.match(/money|paise|پیسے|finance|rupee|rupay/i)) return '💰 Finance';
    return '💬 Chat';
  },

  _extractTags(text) {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 5);
    return words;
  },

  _loadLocal() {
    try { return JSON.parse(localStorage.getItem(this._local) || '[]'); } catch { return []; }
  },

  getRecent(n = 5) {
    return this._loadLocal().slice(-n).reverse();
  },

  search(query) {
    if (!query) { this.render(); return; }
    const q = query.toLowerCase();
    const all = this._loadLocal();
    const filtered = all.filter(m =>
      m.user?.toLowerCase().includes(q) ||
      m.agent?.toLowerCase().includes(q) ||
      m.summary?.toLowerCase().includes(q) ||
      m.tags?.some(t => t.includes(q))
    ).reverse();
    this._renderList(filtered);
  },

  render() {
    const list = document.getElementById('memory-list');
    if (!list) return;
    const all = this._loadLocal().reverse();
    this._renderList(all);
    this._updateStats();
  },

  _renderList(items) {
    const list = document.getElementById('memory-list');
    if (!list) return;
    if (!items.length) { list.innerHTML = '<div style="color:var(--text-muted);padding:2rem">No memories yet. Start chatting!</div>'; return; }
    list.innerHTML = items.slice(0, 50).map(m => `
      <div class="memory-item" onclick="FM.memory.expand('${m.id}')">
        <div class="memory-category">${m.category} • ${m.emotion}</div>
        <div class="memory-content">${m.summary}</div>
        <div class="memory-date">${new Date(m.timestamp).toLocaleString()}</div>
      </div>`).join('');
  },

  expand(id) {
    const m = this._loadLocal().find(x => x.id === id);
    if (!m) return;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `<div class="modal-box" style="max-width:600px">
      <div class="memory-category">${m.category}</div>
      <p style="margin:.8rem 0;font-weight:600;font-size:.9rem">You said:</p>
      <p style="color:var(--text-secondary);font-size:.9rem;margin-bottom:1rem">${m.user}</p>
      <p style="margin:.8rem 0;font-weight:600;font-size:.9rem">${FM.config.get('agentName')||'Agent'} replied:</p>
      <p style="color:var(--text-secondary);font-size:.9rem;margin-bottom:1rem">${m.agent}</p>
      <div style="font-size:.75rem;color:var(--text-muted)">${new Date(m.timestamp).toLocaleString()}</div>
      <button class="btn-ghost mt-4" onclick="this.closest('.modal').remove()">Close</button>
    </div>`;
    document.body.appendChild(modal);
  },

  _updateStats() {
    const all = this._loadLocal();
    const setEl = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    setEl('mem-total', all.length);
    setEl('stat-memories', all.length);
    const days = new Set(all.map(m => m.timestamp?.substring(0,10))).size;
    setEl('mem-days', days);
  }
};
