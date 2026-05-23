/* ============================================================
   FARAZ MASTER — CAMERA + FACE DETECTION
============================================================ */
'use strict';
window.FM = window.FM || {};

FM.camera = {
  stream: null,
  video: null,
  canvas: null,
  ctx: null,
  active: false,
  detectionInterval: null,
  lastPresence: null,
  lastEmotion: null,
  faceApiReady: false,
  MODELS_URL: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/',

  async init() {
    const c = FM.config.load();
    if (!c.cameraEnabled) { this._setDot(false); return; }
    await this._loadModels();
    await this._startCamera();
  },

  async _loadModels() {
    if (typeof faceapi === 'undefined') return;
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri(this.MODELS_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(this.MODELS_URL);
      this.faceApiReady = true;
    } catch(e) { console.warn('face-api models not loaded:', e.message); }
  },

  async _startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } });
      this.video  = document.getElementById('camera-video');
      this.canvas = document.getElementById('emotion-canvas');
      this.ctx    = this.canvas?.getContext('2d');
      if (this.video) { this.video.srcObject = this.stream; }
      this.active = true;
      this._setDot(true);
      this._startDetection();
    } catch(e) {
      console.warn('Camera access denied:', e.message);
      this._setDot(false);
    }
  },

  _startDetection() {
    this.detectionInterval = setInterval(() => this._detect(), 2500);
  },

  async _detect() {
    if (!this.active || !this.faceApiReady || !this.video || !this.canvas || !this.ctx) return;
    if (this.video.readyState < 2) return;

    try {
      this.canvas.width  = this.video.videoWidth  || 320;
      this.canvas.height = this.video.videoHeight || 240;
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

      const detections = await faceapi
        .detectAllFaces(this.canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceExpressions();

      if (detections.length > 0) {
        this._handlePresence(true);
        const exps = detections[0].expressions;
        const dominant = Object.entries(exps).sort((a,b) => b[1] - a[1])[0];
        if (dominant[1] > 0.4) this._handleEmotion(dominant[0], dominant[1]);

        // Privacy: multiple faces detected
        if (detections.length > 1) this._handleMultipleFaces();
      } else {
        this._handlePresence(false);
      }
    } catch(e) { /* silent */ }
  },

  _handlePresence(present) {
    const wasPresent = this.lastPresence;
    this.lastPresence = present;

    if (present && !wasPresent) {
      // Owner just appeared
      const lang = FM.language.current;
      const timeSince = Date.now() - (FM.config.get('lastFaceDetectedAt') || 0);
      if (timeSince > 10 * 60 * 1000) { // more than 10 minutes away
        const msg = {
          ur: `آ گئے! کیا حال ہے؟ سب ٹھیک ہے؟`,
          en: `Welcome back! Everything okay?`,
          pn: `ਆ ਗਏ! ਕੀ ਹਾਲ ਹੈ?`
        }[lang] || `Welcome back!`;
        setTimeout(() => { appendMessage('agent', msg); FM.voice.speak(msg); }, 1000);
      }
      FM.config.set('lastFaceDetectedAt', Date.now());
    }

    if (!present && wasPresent) {
      // Owner left
      FM.config.set('lastFaceGoneAt', Date.now());
    }
  },

  _handleEmotion(emotion, confidence) {
    if (emotion === this.lastEmotion) return; // don't repeat same emotion
    this.lastEmotion = emotion;
    FM.emotion.process(emotion, confidence, 'camera');
  },

  _handleMultipleFaces() {
    if (FM.config.get('privacyBlur')) {
      document.body.classList.add('privacy-blur');
      setTimeout(() => document.body.classList.remove('privacy-blur'), 5000);
    }
    addNotification('Privacy Alert', 'Another person detected near your screen.', 'warning');
  },

  stop() {
    clearInterval(this.detectionInterval);
    this.stream?.getTracks().forEach(t => t.stop());
    this.active = false;
    this._setDot(false);
  },

  toggle() {
    if (this.active) {
      this.stop();
      FM.config.set('cameraEnabled', false);
      showToast('Camera off');
    } else {
      FM.config.set('cameraEnabled', true);
      this.init();
      showToast('Camera on');
    }
  },

  _setDot(on) {
    const dot = document.getElementById('camera-dot');
    dot?.classList.toggle('off', !on);
  }
};

function toggleCamera() { FM.camera.toggle(); }
