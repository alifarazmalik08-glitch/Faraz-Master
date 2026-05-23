/* ============================================================
   FARAZ MASTER — LANGUAGE SYSTEM (Urdu / English / Punjabi)
============================================================ */
'use strict';
window.FM = window.FM || {};

FM.language = {
  current: 'en',

  strings: {
    ur: {
      nav_chat: 'چیٹ', nav_tasks: 'کام', nav_news: 'خبریں', nav_memory: 'یادداشت',
      nav_files: 'فائلیں', nav_analytics: 'تجزیہ', nav_settings: 'ترتیبات',
      tasks_title: 'کام مینیجر', news_title: 'تازہ خبریں', files_title: 'فائلیں',
      settings_title: 'ترتیبات',
      chip_briefing: '📋 آج کا خلاصہ', chip_news: '📰 تازہ خبریں',
      chip_tasks: '✅ میرے کام', chip_research: '🔍 تحقیق', chip_weather: '🌤️ موسم',
      qa_briefing: 'مجھے آج کا مکمل briefing دو — موسم، خبریں، کیلنڈر سب',
      qa_news: 'تازہ ترین اہم خبریں بتاؤ',
      qa_tasks: 'میرے آج کے کام کیا ہیں؟',
      qa_research: 'مجھے اس موضوع پر تحقیق کرنی ہے:',
      qa_weather: 'آج کا موسم کیسا ہے؟',
      error_ai: 'معذرت، کچھ مسئلہ ہوا۔ دوبارہ کوشش کریں۔',
      thinking: 'سوچ رہا ہوں...',
      speaking: 'بول رہا ہوں...',
      listening: 'سن رہا ہوں...',
      welcome_title_m: 'السلام علیکم',
      welcome_sub_m: 'میں آپ کا AI ایجنٹ ہوں۔ بولیں یا ٹائپ کریں، میں حاضر ہوں۔',
      proactive_idle: 'کیا آپ ٹھیک ہیں؟ کچھ کام ہے میرا؟',
      proactive_morning: 'صبح بخیر! آج کا کام شروع کرتے ہیں؟',
      proactive_evening: 'شام ہو گئی — آج کا کوئی کام باقی ہے؟',
      lang_switched: 'جی بالکل، اب میں اردو میں بات کروں گا',
    },
    en: {
      nav_chat: 'Chat', nav_tasks: 'Tasks', nav_news: 'News', nav_memory: 'Memory',
      nav_files: 'Files', nav_analytics: 'Analytics', nav_settings: 'Settings',
      tasks_title: 'Task Manager', news_title: 'Live News', files_title: 'Files',
      settings_title: 'Settings',
      chip_briefing: '📋 Today\'s Briefing', chip_news: '📰 Latest News',
      chip_tasks: '✅ My Tasks', chip_research: '🔍 Research', chip_weather: '🌤️ Weather',
      qa_briefing: 'Give me my full morning briefing — weather, news, calendar, tasks.',
      qa_news: 'What are the most important news right now?',
      qa_tasks: 'What are my tasks for today?',
      qa_research: 'I need research on:',
      qa_weather: 'What is the weather like today?',
      error_ai: 'Sorry, something went wrong. Please try again.',
      thinking: 'Thinking...',
      speaking: 'Speaking...',
      listening: 'Listening...',
      welcome_title_m: 'Welcome back!',
      welcome_sub_m: 'I\'m your personal AI agent. Speak or type — I\'m here.',
      proactive_idle: 'Everything okay? Need anything?',
      proactive_morning: 'Good morning! Shall we start your day?',
      proactive_evening: 'Good evening — any pending tasks for today?',
      lang_switched: 'Got it, switching to English.',
    },
    pn: {
      nav_chat: 'ਗੱਲਬਾਤ', nav_tasks: 'ਕੰਮ', nav_news: 'ਖ਼ਬਰਾਂ', nav_memory: 'ਯਾਦਾਂ',
      nav_files: 'ਫ਼ਾਈਲਾਂ', nav_analytics: 'ਵਿਸ਼ਲੇਸ਼ਣ', nav_settings: 'ਸੈਟਿੰਗਾਂ',
      tasks_title: 'ਕੰਮ ਮੈਨੇਜਰ', news_title: 'ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ', files_title: 'ਫ਼ਾਈਲਾਂ',
      settings_title: 'ਸੈਟਿੰਗਾਂ',
      chip_briefing: '📋 ਅੱਜ ਦਾ ਸਾਰ', chip_news: '📰 ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ',
      chip_tasks: '✅ ਮੇਰੇ ਕੰਮ', chip_research: '🔍 ਖੋਜ', chip_weather: '🌤️ ਮੌਸਮ',
      qa_briefing: 'ਮੈਨੂੰ ਅੱਜ ਦੀ ਪੂਰੀ ਜਾਣਕਾਰੀ ਦਿਓ',
      qa_news: 'ਹੁਣ ਦੀਆਂ ਮਹੱਤਵਪੂਰਨ ਖ਼ਬਰਾਂ ਕੀ ਹਨ?',
      qa_tasks: 'ਅੱਜ ਮੇਰੇ ਕੀ ਕੰਮ ਹਨ?',
      qa_research: 'ਮੈਨੂੰ ਇਸ ਬਾਰੇ ਖੋਜ ਕਰਨੀ ਹੈ:',
      qa_weather: 'ਅੱਜ ਮੌਸਮ ਕਿਹੋ ਜਿਹਾ ਹੈ?',
      error_ai: 'ਮਾਫ਼ ਕਰਨਾ, ਕੁਝ ਗਲਤੀ ਹੋਈ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
      thinking: 'ਸੋਚ ਰਿਹਾ ਹਾਂ...',
      speaking: 'ਬੋਲ ਰਿਹਾ ਹਾਂ...',
      listening: 'ਸੁਣ ਰਿਹਾ ਹਾਂ...',
      welcome_title_m: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ!',
      welcome_sub_m: 'ਮੈਂ ਤੁਹਾਡਾ AI ਏਜੰਟ ਹਾਂ। ਬੋਲੋ ਜਾਂ ਟਾਈਪ ਕਰੋ।',
      proactive_idle: 'ਸਭ ਠੀਕ ਹੈ? ਕੁਝ ਕੰਮ ਹੈ?',
      proactive_morning: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਅੱਜ ਦਾ ਕੰਮ ਸ਼ੁਰੂ ਕਰੀਏ?',
      proactive_evening: 'ਸ਼ਾਮ ਹੋ ਗਈ — ਕੋਈ ਕੰਮ ਬਾਕੀ ਹੈ?',
      lang_switched: 'ਠੀਕ ਹੈ, ਹੁਣ ਪੰਜਾਬੀ ਵਿੱਚ ਗੱਲ ਕਰਾਂਗਾ।',
    }
  },

  t(key) {
    return this.strings[this.current]?.[key] || this.strings.en[key] || key;
  },

  apply(lang) {
    if (lang) this.current = lang;
    else this.current = FM.config.get('language', 'en');

    // Body class
    document.body.classList.remove('lang-ur', 'lang-en', 'lang-pn');
    document.body.classList.add(`lang-${this.current}`);

    // Update active lang buttons
    ['ur', 'en', 'pn'].forEach(l => {
      document.getElementById(`lang-${l}`)?.classList.toggle('active', l === this.current);
    });

    // Apply data-i18n strings
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (this.strings[this.current]?.[key]) el.textContent = this.strings[this.current][key];
    });

    // Chat placeholder
    const ta = document.getElementById('chat-input');
    if (ta) {
      ta.placeholder = this.current === 'ur' ? 'ٹائپ کریں یا بولیں...' :
                       this.current === 'pn' ? 'ਟਾਈਪ ਕਰੋ ਜਾਂ ਬੋਲੋ...' : 'Type or speak...';
    }

    FM.config.set('language', this.current);
    this.updateWelcome();
  },

  updateWelcome() {
    const config = FM.config.load();
    const name = config.ownerName || '';
    const agentName = config.agentName || 'Faraz Master';
    const gender = config.agentGender || 'male';
    const titleKey = gender === 'female' ? 'welcome_title_f' : 'welcome_title_m';
    const subKey = gender === 'female' ? 'welcome_sub_f' : 'welcome_sub_m';
    const t = this.strings[this.current];
    const s = this.strings.en;
    const title = (t?.[titleKey] || s[titleKey] || s['welcome_title_m']) + (name ? (this.current === 'ur' ? '، ' : ', ') + name + '!' : '!');
    const sub = (t?.[subKey] || s[subKey] || s['welcome_sub_m']).replace('Faraz Master', agentName);
    const wt = document.getElementById('welcome-title');
    const ws = document.getElementById('welcome-sub');
    if (wt) wt.textContent = title;
    if (ws) ws.textContent = sub;
  },

  detectCommand(text) {
    const t = text.toLowerCase().trim();
    const commands = {
      ur: ['اردو بولو', 'اردو میں بات کرو', 'اردو', 'urdu'],
      en: ['speak english', 'english mein baat karo', 'english'],
      pn: ['punjabi', 'ਪੰਜਾਬੀ', 'punjabi ch', 'punjabi mein']
    };
    for (const [lang, triggers] of Object.entries(commands)) {
      if (triggers.some(tr => t.includes(tr))) {
        this.apply(lang);
        const confirmMsg = this.t('lang_switched');
        appendMessage('agent', confirmMsg);
        FM.voice.speak(confirmMsg);
        return true;
      }
    }
    return false;
  }
};

function switchLanguage(lang) {
  FM.language.apply(lang);
  updateGreeting();
  showWelcome();
  showToast(`Language: ${lang === 'ur' ? 'اردو' : lang === 'pn' ? 'ਪੰਜਾਬੀ' : 'English'}`);
}
