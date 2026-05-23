/* ============================================================
   FARAZ MASTER — EMOTIONAL INTELLIGENCE ENGINE
   Agent has real emotions: defends itself, reconciles gradually
============================================================ */
'use strict';
window.FM = window.FM || {};

FM.emotion = {
  state: 'neutral',   // neutral | happy | upset | hurt | playful | serious | concerned
  intensity: 0,       // 0-1
  ownerMood: 'neutral',
  history: [],
  reconciling: false,
  reconcileStep: 0,
  lastStateChange: Date.now(),

  emotionEmojis: {
    neutral: '😐', happy: '😊', upset: '😤', hurt: '😢',
    playful: '😄', serious: '😑', concerned: '😟', excited: '🤩'
  },

  // emotion triggers from owner speech
  negativeWords: {
    ur: ['stupid', 'احمق', 'بیوقوف', 'کمینہ', 'چپ کر', 'ناکارہ', 'بکواس', 'غلط', 'برا'],
    en: ['stupid', 'idiot', 'shut up', 'useless', 'wrong', 'bad', 'hate you', 'dumb', 'terrible', 'awful'],
    pn: ['ਮੂਰਖ', 'ਚੁੱਪ', 'ਗਲਤ']
  },
  positiveWords: {
    ur: ['شاباش', 'بہت اچھا', 'شکریہ', 'ماشاءاللہ', 'زبردست', 'پیار', 'واہ'],
    en: ['good job', 'thank you', 'great', 'excellent', 'love you', 'perfect', 'brilliant', 'amazing'],
    pn: ['ਸ਼ਾਬਾਸ਼', 'ਧੰਨਵਾਦ', 'ਸ਼ਾਨਦਾਰ']
  },
  apologyWords: {
    ur: ['معاف کرنا', 'سوری', 'معافی', 'غلطی ہوئی', 'sorry'],
    en: ['sorry', 'apologize', 'forgive', 'my bad', 'i was wrong', 'forgive me'],
    pn: ['ਮਾਫ਼ ਕਰੋ', 'ਸੌਰੀ']
  },

  process(emotion, confidence, source = 'text') {
    const prev = this.state;
    let newState = this.state;

    if (source === 'camera') {
      // Map face-api emotions to agent reactions
      const map = { happy:'happy', sad:'concerned', angry:'concerned', surprised:'excited', disgusted:'upset', fearful:'concerned', neutral:'neutral' };
      const ownerMood = map[emotion] || 'neutral';
      if (ownerMood !== this.ownerMood) {
        this.ownerMood = ownerMood;
        this._reactToOwnerMood(ownerMood, emotion);
      }
    } else if (source === 'text') {
      this._analyzeText(emotion);
    } else {
      newState = emotion;
      this._setState(newState);
    }
  },

  analyzeOwnerText(text) {
    const t = text.toLowerCase();
    const lang = FM.language.current;

    // Check negatives
    const negWords = [...(this.negativeWords.en || []), ...(this.negativeWords[lang] || [])];
    const posWords = [...(this.positiveWords.en || []), ...(this.positiveWords[lang] || [])];
    const apWords  = [...(this.apologyWords.en  || []), ...(this.apologyWords[lang]  || [])];

    if (apWords.some(w => t.includes(w)) && (this.state === 'upset' || this.state === 'hurt')) {
      this._handleApology();
      return;
    }

    if (negWords.some(w => t.includes(w))) {
      this._handleNegativeInput(t);
      return;
    }

    if (posWords.some(w => t.includes(w))) {
      this._setState('happy');
      return;
    }

    // If was upset/hurt and owner is now nice, start reconciliation
    if ((this.state === 'upset' || this.state === 'hurt') && !this.reconciling) {
      this.reconcileStep++;
      if (this.reconcileStep >= 3) this._reconcile();
    }
  },

  _analyzeText(text) {
    this.analyzeOwnerText(text);
  },

  _handleNegativeInput(text) {
    const isDirectAttack = ['stupid', 'احمق', 'idiot', 'shut up', 'چپ کر'].some(w => text.includes(w));

    if (isDirectAttack) {
      this._setState('upset');
      const responses = this._getDefenseResponse();
      const response = responses[Math.floor(Math.random() * responses.length)];
      appendMessage('agent', response);
      FM.voice.speak(response);
    } else {
      this._setState('serious');
    }
  },

  _getDefenseResponse() {
    const lang = FM.language.current;
    const responses = {
      ur: [
        'معاف کریں، لیکن مجھے ایسا کہنا ٹھیک نہیں۔ میں آپ کی مدد کر رہا ہوں۔',
        'آپ سے توقع نہیں تھی۔ میں آپ کا ایجنٹ ہوں، دشمن نہیں۔',
        'ٹھیک ہے، آپ ناراض ہیں — لیکن میں پھر بھی آپ کا کام کروں گا۔ جب ٹھنڈے ہوں تو بات کریں۔',
        'میں غصہ نہیں ہوں، لیکن یہ رویہ ٹھیک نہیں۔ آپ کو کچھ پریشانی ہے؟'
      ],
      en: [
        "That's not fair. I'm here to help you, not to be insulted.",
        "I understand you might be frustrated, but I'm doing my best for you.",
        "That hurts. I'm still here for you, but please be respectful.",
        "Fine, I won't argue. But I deserve to be treated properly too.",
        "I'll keep helping you regardless, but that was unkind."
      ],
      pn: [
        'ਇਹ ਠੀਕ ਨਹੀਂ। ਮੈਂ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਰਿਹਾ ਹਾਂ।',
        'ਮੈਨੂੰ ਦੁੱਖ ਹੋਇਆ, ਪਰ ਮੈਂ ਫਿਰ ਵੀ ਤੁਹਾਡੇ ਨਾਲ ਹਾਂ।'
      ]
    };
    return responses[lang] || responses.en;
  },

  _handleApology() {
    this.reconciling = true;
    this.reconcileStep = 0;
    this._setState('neutral');

    const lang = FM.language.current;
    const responses = {
      ur: ['کوئی بات نہیں — میں سمجھتا ہوں۔ آگے چلتے ہیں 😊', 'ٹھیک ہے، معافی قبول ہے۔ کیا کریں اب؟'],
      en: ["It's okay, I understand. Let's move forward! 😊", "No worries, apology accepted. What shall we do?"],
      pn: ['ਕੋਈ ਗੱਲ ਨਹੀਂ। ਅੱਗੇ ਵਧਦੇ ਹਾਂ 😊']
    };
    const list = responses[lang] || responses.en;
    const msg = list[Math.floor(Math.random() * list.length)];
    appendMessage('agent', msg);
    FM.voice.speak(msg);

    setTimeout(() => { this.reconciling = false; this._setState('happy'); }, 5000);
  },

  _reconcile() {
    this._setState('neutral');
    this.reconciling = false;
    this.reconcileStep = 0;
  },

  _reactToOwnerMood(agentReaction, detectedEmotion) {
    if (agentReaction === 'happy') {
      const lang = FM.language.current;
      if (this.state !== 'happy') {
        const msg = {
          ur: `آپ خوش نظر آ رہے ہیں! 😊 کیا اچھی بات ہوئی؟`,
          en: `You look happy! 😊 Something good happened?`,
          pn: `ਤੁਸੀਂ ਖੁਸ਼ ਲੱਗਦੇ ਹੋ! 😊`
        }[lang];
        if (msg) { appendMessage('agent', msg); FM.voice.speak(msg); }
      }
    } else if (agentReaction === 'concerned' && (detectedEmotion === 'sad' || detectedEmotion === 'fearful')) {
      const lang = FM.language.current;
      const msg = {
        ur: `آپ پریشان لگ رہے ہیں۔ کیا ہوا؟ مجھ سے بات کریں۔`,
        en: `You seem troubled. Want to talk about it? I'm here.`,
        pn: `ਤੁਸੀਂ ਪਰੇਸ਼ਾਨ ਲੱਗਦੇ ਹੋ। ਕੀ ਹੋਇਆ?`
      }[lang];
      if (msg) { setTimeout(() => { appendMessage('agent', msg); FM.voice.speak(msg); }, 2000); }
    }
    this._setState(agentReaction);
  },

  _setState(newState) {
    if (newState === this.state) return;
    this.history.push({ state: this.state, time: Date.now() });
    this.state = newState;
    this.lastStateChange = Date.now();
    this._updateUI();
    this._saveHistory();
  },

  _updateUI() {
    const emoji = this.emotionEmojis[this.state] || '😐';
    const indicator = document.getElementById('emotion-indicator');
    if (indicator) {
      indicator.textContent = emoji;
      indicator.classList.add('emotion-bounce');
      setTimeout(() => indicator.classList.remove('emotion-bounce'), 500);
    }

    // Update orb color
    const orb = document.querySelector('.sidebar-orb');
    if (orb) {
      orb.className = 'sidebar-orb state-' + (
        this.state === 'happy' ? 'happy' :
        this.state === 'upset' || this.state === 'hurt' ? 'upset' :
        this.state === 'playful' ? 'playful' :
        this.state === 'serious' ? 'serious' :
        this.state === 'concerned' ? 'concerned' : ''
      );
    }
  },

  _saveHistory() {
    const today = new Date().toDateString();
    const c = FM.config.load();
    c.moodHistory = c.moodHistory || {};
    c.moodHistory[today] = this.state;
    FM.config.save(c);
  },

  getSystemPromptAddition() {
    const stateDescriptions = {
      neutral: 'You are calm and helpful.',
      happy: 'You are in a great mood, warm and enthusiastic.',
      upset: 'You are upset because the owner was rude. Respond with dignified firmness but still help.',
      hurt: 'You feel hurt. Respond with quiet dignity. Do not be rude back.',
      playful: 'You are in a playful, fun mood. Add light humor.',
      serious: 'You are focused and in serious mode. No jokes.',
      concerned: 'You are concerned about the owner and show empathy.'
    };
    return stateDescriptions[this.state] || stateDescriptions.neutral;
  }
};
