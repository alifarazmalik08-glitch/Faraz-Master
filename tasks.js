/* ============================================================
   FARAZ MASTER — TASK MANAGER
============================================================ */
'use strict';
window.FM = window.FM || {};

FM.tasks = {
  _key: 'fm_tasks',

  _load() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]'); } catch { return []; }
  },

  _save(list) {
    localStorage.setItem(this._key, JSON.stringify(list));
    FM.storage?.saveDoc?.('tasks', 'list', { items: list, updated: new Date().toISOString() });
  },

  create(data) {
    const task = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      title: data.title,
      priority: data.priority || 'medium',
      status: 'queued',
      createdAt: new Date().toISOString(),
      scheduledFor: data.scheduledFor || null,
      completedAt: null,
      notes: data.notes || ''
    };
    const list = this._load();
    list.push(task);
    this._save(list);
    this.render();
    this._updateBadge();
    addNotification('Task Created', task.title, 'info');
    return task;
  },

  update(id, changes) {
    const list = this._load();
    const idx = list.findIndex(t => t.id === id);
    if (idx < 0) return;
    Object.assign(list[idx], changes);
    if (changes.status === 'done' && !list[idx].completedAt) {
      list[idx].completedAt = new Date().toISOString();
      FM.analytics.increment('tasksDone');
      this._celebrate(list[idx].title);
    }
    this._save(list);
    this.render();
    this._updateBadge();
  },

  delete(id) {
    const list = this._load().filter(t => t.id !== id);
    this._save(list);
    this.render();
    this._updateBadge();
  },

  getTodayTasks() {
    const today = new Date().toDateString();
    return this._load().filter(t => {
      if (t.status === 'done') return false;
      if (!t.scheduledFor) return t.status !== 'done';
      return new Date(t.scheduledFor).toDateString() === today;
    });
  },

  loadAll() {
    this.render();
    this._updateBadge();
    this._checkScheduled();
    setInterval(() => this._checkScheduled(), 60000);
  },

  _checkScheduled() {
    const now = Date.now();
    const list = this._load();
    let changed = false;
    list.forEach(t => {
      if (t.scheduledFor && t.status === 'queued') {
        if (new Date(t.scheduledFor).getTime() <= now) {
          t.status = 'running';
          changed = true;
          addNotification('⚡ Task Started', t.title, 'info');
          const msg = FM.language.current === 'ur'
            ? `یاد دہانی: "${t.title}" — یہ کام شروع ہونے کا وقت ہے!`
            : `Reminder: "${t.title}" — time to start this task!`;
          appendMessage('agent', msg);
          FM.voice.speak(msg);
        }
      }
    });
    if (changed) this._save(list);
  },

  render() {
    const cols = { queued: [], running: [], done: [] };
    this._load().forEach(t => {
      if (cols[t.status]) cols[t.status].push(t);
    });

    const priorityOrder = { critical:0, high:1, medium:2, low:3 };
    Object.values(cols).forEach(arr => arr.sort((a,b) => (priorityOrder[a.priority]||9) - (priorityOrder[b.priority]||9)));

    ['queued','running','done'].forEach(status => {
      const col = document.getElementById(`col-${status}`);
      const count = document.getElementById(`${status}-count`);
      if (!col) return;
      if (count) count.textContent = cols[status].length;
      col.innerHTML = cols[status].slice(0, 30).map(t => `
        <div class="task-card" data-id="${t.id}">
          <div class="task-title">${t.title}</div>
          <div class="task-meta">
            <span class="priority-badge priority-${t.priority}">${t.priority.toUpperCase()}</span>
            ${t.scheduledFor ? `<span class="task-time">📅 ${new Date(t.scheduledFor).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>` : ''}
          </div>
          <div class="task-actions" style="display:flex;gap:.3rem;margin-top:.5rem;flex-wrap:wrap">
            ${status !== 'running' ? `<button onclick="FM.tasks.update('${t.id}',{status:'running'})" style="font-size:.7rem;padding:2px 6px;background:var(--bg-input);border:1px solid var(--border);border-radius:4px;color:var(--warning)">▶ Start</button>` : ''}
            ${status !== 'done' ? `<button onclick="FM.tasks.update('${t.id}',{status:'done'})" style="font-size:.7rem;padding:2px 6px;background:var(--bg-input);border:1px solid var(--border);border-radius:4px;color:var(--success)">✓ Done</button>` : ''}
            <button onclick="FM.tasks.askAgent('${t.id}')" style="font-size:.7rem;padding:2px 6px;background:var(--bg-input);border:1px solid var(--border);border-radius:4px;color:var(--accent)">🤖 Ask</button>
            <button onclick="FM.tasks.delete('${t.id}')" style="font-size:.7rem;padding:2px 6px;background:var(--bg-input);border:1px solid var(--border);border-radius:4px;color:var(--danger)">✕</button>
          </div>
        </div>`).join('') || `<div style="color:var(--text-muted);font-size:.8rem;padding:.5rem">Empty</div>`;
    });
  },

  _updateBadge() {
    const active = this._load().filter(t => t.status !== 'done').length;
    const badge = document.getElementById('tasks-badge');
    if (badge) { badge.textContent = active || ''; badge.style.display = active ? '' : 'none'; }
  },

  _celebrate(title) {
    showToast(`✅ Task done: ${title}`);
    // Confetti
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.cssText = `left:${Math.random()*100}vw;top:-10px;background:hsl(${Math.random()*360},80%,60%);border-radius:${Math.random()>0.5?'50%':'2px'};animation-delay:${Math.random()*0.5}s`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2500);
      }, i * 50);
    }
  },

  askAgent(id) {
    const task = this._load().find(t => t.id === id);
    if (!task) return;
    const lang = FM.language.current;
    const msg = lang === 'ur' ? `اس کام کو کیسے کریں: "${task.title}"` : `How should I do this task: "${task.title}"?`;
    switchPanel('chat');
    sendMessage(msg);
  }
};
