/* ============================================================
   FARAZ MASTER — PROACTIVE CONVERSATIONS
   Agent speaks first: idle detection, scheduled messages, events
============================================================ */
'use strict';
window.FM = window.FM || {};

FM.proactive = {
  idleTimer: null,
  scheduledTimers: [],
  lastActivity: Date.now(),
  active: false,

  start() {
    if (!FM.config.get('proactive', true)) return;
    this.active = true;
    this._trackActivity();
    this._scheduleDaily();
    this._startIdleWatch();
  },

  stop() {
    this.active = false;
    clearTimeout(this.idleTimer);
    this.scheduledTimers.forEach(t => clearTimeout(t));
    this.scheduledTimers = [];
  },

  // Track last activity time
  _trackActivity() {
    const update = () => { this.lastActivity = Date.now(); };
    document.addEventListener('keydown', update);
    document.addEventListener('click', update);
    document.addEventListener('mousemove', update, { passive: true });
    document.getElementById('chat-input')?.addEventListener('input', update);
  },

  // Watch for idle and speak
  _startIdleWatch() {
    const idleMin = parseInt(FM.config.get('idleMinutes', 5));
    const idleMs = idleMin * 60 * 1000;
    setInterval(() => {
      if (!this.active) return;
      if (FM.voice.isSpeaking) return;
      const idle = Date.now() - this.lastActivity;
      if (idle >= idleMs) {
        this.lastActivity = Date.now(); // reset so it doesn't repeat every second
        this._speak('idle');
      }
    }, 30000); // check every 30 seconds
  },

  // Schedule morning briefing and evening wrap-up
  _scheduleDaily() {
    const morning = FM.config.get('morningTime', '07:00');
    const evening = FM.config.get('eveningTime', '21:00');
    this._scheduleAt(morning, 'morning');
    this._scheduleAt(evening, 'evening');
  },

  _scheduleAt(timeStr, type) {
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
    if (target <= now) target.setDate(target.getDate() + 1); // tomorrow if already passed
    const delay = target - now;
    const t = setTimeout(async () => {
      this._speak(type);
      // Reschedule for next day
      setTimeout(() => this._scheduleAt(timeStr, type), 1000);
    }, delay);
    this.scheduledTimers.push(t);
  },

  async _speak(trigger) {
    if (!this.active || FM.voice.isSpeaking) return;
    let msg = '';
    const lang = FM.language.current;
    const name = FM.config.get('ownerName', '');
    const suffix = name ? (lang === 'ur' ? '، ' + name : ', ' + name) : '';
    const agentName = FM.config.get('agentName', 'Faraz Master');

    try {
      if (trigger === 'idle') {
        msg = await this._getIdleMessage(lang, suffix);
      } else if (trigger === 'morning') {
        msg = await FM.agent.morningBriefing();
      } else if (trigger === 'evening') {
        msg = await this._getEveningMessage(lang, suffix);
      }

      if (msg) {
        appendMessage('agent', msg);
        FM.voice.speak(msg);
        FM.analytics.increment('proactiveMessages');
        addNotification(agentName, msg.substring(0, 60), 'info');
      }
    } catch(e) {
      // Fallback without AI
      const fallbacks = {
        idle: { ur: `${suffix} — سب ٹھیک ہے؟ کچھ کام ہے میرا؟`, en: `${suffix} — everything okay? Need anything?` },
        morning: { ur: `صبح بخیر${suffix}! آج کا کام شروع کریں؟`, en: `Good morning${suffix}! Ready to start your day?` },
        evening: { ur: `شام بخیر${suffix}! آج کا کوئی کام باقی ہے؟`, en: `Good evening${suffix}! Any pending tasks?` }
      };
      msg = fallbacks[trigger]?.[lang] || fallbacks[trigger]?.en || '';
      if (msg) { appendMessage('agent', msg); FM.voice.speak(msg); }
    }
  },

  async _getIdleMessage(lang, suffix) {
    const idleMessages = {
      ur: [
        `${suffix}، کچھ دیر سے آپ خاموش ہیں — سب ٹھیک ہے؟`,
        `${suffix}، کیا آپ کسی چیز میں مدد چاہتے ہیں؟`,
        `اگر کوئی کام ہو تو بتائیں — میں یہاں ہوں۔`,
        `${suffix}، ابھی خبریں دیکھیں؟ کچھ اہم ہے۔`,
        `${suffix}، کوئی research یا کام کروانا ہے؟`
      ],
      en: [
        `${suffix}, you've been quiet — everything okay?`,
        `Need any help with anything?`,
        `${suffix}, shall I pull up the latest news?`,
        `Any tasks you'd like me to work on?`,
        `I'm here if you need anything, ${suffix}.`
      ],
      pn: [
        `${suffix}، ਕੀ ਹਾਲ ਹੈ? ਕੁਝ ਕੰਮ ਹੈ?`,
        `ਜੇ ਕੋਈ ਮਦਦ ਚਾਹੀਦੀ ਹੈ ਤਾਂ ਦੱਸੋ।`
      ]
    };
    const list = idleMessages[lang] || idleMessages.en;
    return list[Math.floor(Math.random() * list.length)];
  },

  async _getEveningMessage(lang, suffix) {
    const tasks = FM.tasks.getTodayTasks();
    const pendingCount = tasks.length;
    const msgs = {
      ur: pendingCount > 0
        ? `شام بخیر${suffix}! آج کے ${pendingCount} کام ابھی باقی ہیں۔ کچھ نمٹانا ہے؟`
        : `شام بخیر${suffix}! آج کے تمام کام مکمل! بہت خوب 🎉`,
      en: pendingCount > 0
        ? `Good evening${suffix}! You have ${pendingCount} task(s) still pending. Shall we tackle them?`
        : `Good evening${suffix}! All tasks for today are done — great work! 🎉`,
      pn: pendingCount > 0
        ? `ਸ਼ਾਮ ਦਾ ਸਲਾਮ${suffix}! ${pendingCount} ਕੰਮ ਬਾਕੀ ਹਨ।`
        : `ਸ਼ਾਮ ਦਾ ਸਲਾਮ${suffix}! ਸਾਰੇ ਕੰਮ ਪੂਰੇ! 🎉`
    };
    return msgs[lang] || msgs.en;
  }
};
