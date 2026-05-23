/* ============================================================
   FARAZ MASTER — VOICE SYSTEM
   Always-live mic + TTS (ElevenLabs or Browser Synthesis)
============================================================ */
'use strict';
window.FM = window.FM || {};

FM.voice = {
  recognition: null,
  synthesis: window.speechSynthesis,
  isListening: false,
  isSpeaking: false,
  currentUtterance: null,
  wakeMode: 'always',
  wakeWord: 'hey faraz',
  voiceSpeed: 1,
  gender: 'male',
  selectedVoice: null,
  autoRestartTimer: null,

  init() {
    const c = FM.config.load();
    this.wakeMode  = c.wakeMode   || 'always';
    this.wakeWord  = (c.wakeWord  || 'hey faraz').toLowerCase();
    this.voiceSpeed = parseFloat(c.voiceSpeed || 1);
    this.gender    = c.agentGender || 'male';

    this._loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => this._loadVoices();
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { console.warn('Speech recognition not supported'); return; }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous    = true;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this._setRecogLang();

    this.recognition.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      this._handleTranscript(transcript);
    };

    this.recognition.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') console.warn('Voice error:', e.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.wakeMode !== 'manual' && !this.isSpeaking) {
        this.autoRestartTimer = setTimeout(() => this._startListening(), 500);
      }
      this._updateUI();
    };

    if (this.wakeMode !== 'manual') this._startListening();
    FM.analytics.increment('voiceSessions');
  },

  _setRecogLang() {
    if (!this.recognition) return;
    const langMap = { ur: 'ur-PK', en: 'en-US', pn: 'pa-IN' };
    this.recognition.lang = langMap[FM.language.current] || 'en-US';
  },

  _loadVoices() {
    const voices = this.synthesis?.getVoices() || [];
    const lang   = FM.language.current;
    const gender = this.gender;
    const langPref = lang === 'ur' ? ['ur', 'pak', 'urdu'] : lang === 'pn' ? ['pa', 'punjabi'] : ['en'];

    // Try to find matching voice
    let match = voices.find(v => {
      const nameLower = v.name.toLowerCase();
      const langMatch = langPref.some(p => nameLower.includes(p) || v.lang.toLowerCase().includes(p));
      const genderHint = gender === 'female'
        ? (nameLower.includes('female') || nameLower.includes('woman') || nameLower.includes('zira') || nameLower.includes('hazel') || nameLower.includes('samantha') || nameLower.includes('google uk english female'))
        : (nameLower.includes('male') || nameLower.includes('man') || nameLower.includes('david') || nameLower.includes('daniel'));
      return langMatch || genderHint;
    });
    if (!match) match = voices.find(v => v.lang.startsWith('en'));
    if (!match && voices.length) match = voices[0];
    this.selectedVoice = match || null;
  },

  _handleTranscript(text) {
    if (!text) return;
    const lower = text.toLowerCase();

    // Wake word mode
    if (this.wakeMode === 'wakeword') {
      if (lower.includes(this.wakeWord)) {
        const cmd = text.replace(new RegExp(this.wakeWord, 'i'), '').trim();
        if (cmd) sendMessage(cmd);
      }
      return;
    }

    // Always-on: voice command detection or send to agent
    if (lower.includes('ruk jao') || lower.includes('stop') || lower.includes('emergency stop')) {
      this.stop(); return;
    }
    sendMessage(text);
  },

  _startListening() {
    if (this.isListening || this.isSpeaking || !this.recognition) return;
    try {
      this._setRecogLang();
      this.recognition.start();
      this.isListening = true;
      this._updateUI();
    } catch(e) { /* recognition already started */ }
  },

  _updateUI() {
    const btn = document.getElementById('voice-toggle-btn');
    const waves = document.getElementById('voice-waves');
    if (this.isListening) {
      btn?.classList.add('voice-active');
      waves?.parentElement.classList.add('voice-active');
    } else {
      btn?.classList.remove('voice-active');
      waves?.parentElement.classList.remove('voice-active');
    }
  },

  toggleVoiceMode() {
    if (this.isListening) {
      this.wakeMode = 'manual';
      this.stop();
    } else {
      this.wakeMode = FM.config.get('wakeMode', 'always');
      this._startListening();
    }
    showToast(this.isListening ? '🎙️ Listening...' : '🔇 Mic off');
  },

  speak(text) {
    if (!text) return;
    // Strip markdown
    const clean = text.replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1').replace(/#+\s/g,'').replace(/`[^`]+`/g,'').replace(/<[^>]+>/g,'').trim();
    if (!clean) return;

    const elevenKey = FM.config.get('elevenKey');
    if (elevenKey) { this._speakElevenLabs(clean, elevenKey); return; }
    this._speakBrowser(clean);
  },

  _speakBrowser(text) {
    if (!this.synthesis) return;
    this.synthesis.cancel();

    // Pause recognition while speaking (prevents echo)
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }

    const utter = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) utter.voice = this.selectedVoice;
    utter.rate   = this.voiceSpeed;
    utter.pitch  = this.gender === 'female' ? 1.3 : 0.9;
    utter.volume = 1;

    const lang = FM.language.current;
    utter.lang = lang === 'ur' ? 'ur-PK' : lang === 'pn' ? 'pa-IN' : 'en-US';

    utter.onstart = () => {
      this.isSpeaking = true;
      document.getElementById('avatar-core')?.classList.add('speaking');
    };
    utter.onend = () => {
      this.isSpeaking = false;
      document.getElementById('avatar-core')?.classList.remove('speaking');
      if (this.wakeMode !== 'manual') {
        setTimeout(() => this._startListening(), 300);
      }
    };
    utter.onerror = () => { this.isSpeaking = false; };

    this.currentUtterance = utter;
    this.synthesis.speak(utter);
  },

  async _speakElevenLabs(text, apiKey) {
    try {
      const voiceId = this.gender === 'female' ? '21m00Tcm4TlvDq8ikWAM' : 'ErXwobaYiN019PkySvjV';
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.8 } })
      });
      if (!res.ok) { this._speakBrowser(text); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this.isSpeaking = true;
      document.getElementById('avatar-core')?.classList.add('speaking');
      audio.onended = () => {
        this.isSpeaking = false;
        URL.revokeObjectURL(url);
        document.getElementById('avatar-core')?.classList.remove('speaking');
        if (this.wakeMode !== 'manual') setTimeout(() => this._startListening(), 300);
      };
      audio.onerror = () => { this.isSpeaking = false; this._speakBrowser(text); };
      audio.play();
    } catch { this._speakBrowser(text); }
  },

  stop() {
    this.synthesis?.cancel();
    try { this.recognition?.stop(); } catch {}
    clearTimeout(this.autoRestartTimer);
    this.isListening = false;
    this.isSpeaking  = false;
    this._updateUI();
  },

  updateGender(gender) {
    this.gender = gender;
    FM.config.set('agentGender', gender);
    this._loadVoices();
  },

  detectCommand(text) {
    const t = text.toLowerCase();
    if (t.includes('female voice') || t.includes('larki ki tarah') || t.includes('female mein') || t.includes('aurton wali awaz') || t.includes('aurat ban jao')) {
      changeAgentGender('female');
      const msg = FM.language.current === 'ur' ? 'جی، اب میں عورت کی طرح بات کروں گی! 💁‍♀️' : 'Switching to female voice! 💁‍♀️';
      appendMessage('agent', msg); FM.voice.speak(msg); return true;
    }
    if (t.includes('male voice') || t.includes('mard wali') || t.includes('male mein') || t.includes('mard ban jao')) {
      changeAgentGender('male');
      const msg = FM.language.current === 'ur' ? 'ٹھیک ہے، مرد کی آواز میں آ گیا۔' : 'Back to male voice.';
      appendMessage('agent', msg); FM.voice.speak(msg); return true;
    }
    return false;
  }
};

function toggleVoiceMode() { FM.voice.toggleVoiceMode(); }
