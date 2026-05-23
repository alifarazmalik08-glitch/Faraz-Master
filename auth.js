/* ============================================================
   FARAZ MASTER — AUTH SYSTEM (6-Word PIN)
============================================================ */
'use strict';
window.FM = window.FM || {};

FM.auth = {
  _session: 'fm_session',
  _audit: 'fm_audit',
  _fails: 'fm_fails',

  async hashString(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str.toLowerCase().trim()));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  },

  async setPin(pinStr) {
    const hash = await this.hashString(pinStr);
    FM.config.set('pinHash', hash);
    this._log('PIN changed');
  },

  async verifyPin(pinStr) {
    const hash = await this.hashString(pinStr);
    return hash === FM.config.get('pinHash');
  },

  createSession() {
    const duration = parseInt(FM.config.get('sessionDuration', 24));
    const expires = duration === 0 ? null : Date.now() + duration * 3600 * 1000;
    const session = {
      id: crypto.randomUUID(),
      created: Date.now(),
      expires,
      device: navigator.userAgent.substring(0, 60),
      fingerprint: this._fingerprint()
    };
    sessionStorage.setItem(this._session, JSON.stringify(session));
    if (FM.config.get('rememberDevice')) localStorage.setItem(this._session, JSON.stringify(session));
    FM.config.set('lastLogin', new Date().toISOString());
    this._log('Login successful');
    this._resetFails();
  },

  hasValidSession() {
    const raw = sessionStorage.getItem(this._session) || localStorage.getItem(this._session);
    if (!raw) return false;
    try {
      const s = JSON.parse(raw);
      if (s.expires && Date.now() > s.expires) { this.clearSession(); return false; }
      return true;
    } catch { return false; }
  },

  refreshSession() {
    const duration = parseInt(FM.config.get('sessionDuration', 24));
    if (duration === 0) return;
    const raw = sessionStorage.getItem(this._session) || localStorage.getItem(this._session);
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      s.expires = Date.now() + duration * 3600 * 1000;
      sessionStorage.setItem(this._session, JSON.stringify(s));
    } catch {}
  },

  clearSession() {
    sessionStorage.removeItem(this._session);
    localStorage.removeItem(this._session);
    this._log('Logout');
  },

  isLocked() {
    const data = JSON.parse(localStorage.getItem(this._fails) || '{}');
    if (!data.lockUntil) return false;
    if (Date.now() > data.lockUntil) { this._resetFails(); return false; }
    return data.lockUntil;
  },

  recordFail() {
    const data = JSON.parse(localStorage.getItem(this._fails) || '{"count":0}');
    data.count = (data.count || 0) + 1;
    data.lastFail = Date.now();
    if (data.count >= 5) data.lockUntil = Date.now() + 30 * 60 * 1000;
    if (data.count >= 10) data.lockUntil = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(this._fails, JSON.stringify(data));
    this._log(`Failed login attempt #${data.count}`);
    return data;
  },

  _resetFails() { localStorage.removeItem(this._fails); },

  _fingerprint() {
    return btoa(navigator.userAgent + screen.width + screen.height + navigator.language).substring(0, 20);
  },

  _log(action) {
    const logs = JSON.parse(localStorage.getItem(this._audit) || '[]');
    logs.push({ time: new Date().toLocaleString(), action, ip: 'local' });
    if (logs.length > 200) logs.splice(0, logs.length - 200);
    localStorage.setItem(this._audit, JSON.stringify(logs));
  },

  // Recovery methods
  async recoverWithPhrase() {
    const input = document.getElementById('recovery-phrase-input')?.value.trim().toLowerCase();
    if (!input) { showToast('Enter recovery phrase', 'error'); return; }
    const hash = await this.hashString(input);
    if (hash === FM.config.get('phraseHash')) {
      this._showResetPin();
    } else {
      showToast('Recovery phrase incorrect', 'error');
      this._log('Failed recovery: phrase');
    }
  },

  async recoverWithQuestions() {
    const inputs = [...document.querySelectorAll('.rq-verify')];
    const answers = inputs.map(i => i.value.trim().toLowerCase());
    const qs = FM.config.get('recoveryQuestions', []);
    let allCorrect = true;
    for (let i = 0; i < qs.length; i++) {
      const hash = await this.hashString(answers[i] || '');
      if (hash !== qs[i].answerHash) { allCorrect = false; break; }
    }
    if (allCorrect) {
      this._showResetPin();
    } else {
      showToast('One or more answers incorrect', 'error');
      this._log('Failed recovery: questions');
    }
  },

  async recoverWithEmergency() {
    const input = document.getElementById('emergency-code-input')?.value.trim().toLowerCase();
    if (!input) { showToast('Enter emergency code', 'error'); return; }
    const hash = await this.hashString(input);
    if (hash === FM.config.get('emergencyHash')) {
      this._showResetPin();
    } else {
      showToast('Emergency code incorrect', 'error');
      this._log('Failed recovery: emergency code');
    }
  },

  _showResetPin() {
    const area = document.getElementById('recovery-form-area');
    area.innerHTML = `
      <p style="color:var(--success);margin:1rem 0">✅ Identity verified! Set your new PIN:</p>
      <div class="pin-grid" id="reset-pin-inputs">
        <input class="pin-word" type="password" placeholder="Word 1" maxlength="20"/>
        <input class="pin-word" type="password" placeholder="Word 2" maxlength="20"/>
        <input class="pin-word" type="password" placeholder="Word 3" maxlength="20"/>
        <input class="pin-word" type="password" placeholder="Word 4" maxlength="20"/>
        <input class="pin-word" type="password" placeholder="Word 5" maxlength="20"/>
        <input class="pin-word" type="password" placeholder="Word 6" maxlength="20"/>
      </div>
      <button class="btn-primary mt-4" onclick="FM.auth._submitResetPin()">Set New PIN</button>`;
  },

  async _submitResetPin() {
    const words = [...document.querySelectorAll('#reset-pin-inputs .pin-word')].map(i => i.value.trim().toLowerCase());
    if (words.some(w => !w)) { showToast('Fill all 6 words', 'error'); return; }
    await this.setPin(words.join(' '));
    this.createSession();
    hideModal('forgot-pin-modal');
    showToast('PIN reset successful ✓');
    await initDashboard();
  }
};

// ===== LOGIN FLOW =====
async function attemptLogin() {
  const lockUntil = FM.auth.isLocked();
  if (lockUntil) {
    const mins = Math.ceil((lockUntil - Date.now()) / 60000);
    const el = document.getElementById('login-lockout');
    if (el) { el.textContent = `Too many attempts. Locked for ${mins} minute(s).`; el.classList.remove('hidden'); }
    return;
  }

  const words = [...document.querySelectorAll('#login-pin-inputs .pin-word')].map(i => i.value.trim().toLowerCase());
  if (words.some(w => !w)) {
    shakeLoginBtn(); showError('Fill all 6 words'); return;
  }

  const correct = await FM.auth.verifyPin(words.join(' '));
  if (correct) {
    FM.auth.createSession();
    document.querySelectorAll('#login-pin-inputs .pin-word').forEach(i => i.value = '');
    await initDashboard();
  } else {
    const data = FM.auth.recordFail();
    shakeLoginBtn();
    showError(`Incorrect PIN (${data.count} failed attempt${data.count > 1 ? 's' : ''})`);
  }
}

function shakeLoginBtn() {
  const btn = document.getElementById('login-btn');
  btn?.classList.add('shake');
  setTimeout(() => btn?.classList.remove('shake'), 600);
}

function showError(msg) {
  const el = document.getElementById('login-error');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 4000); }
}
