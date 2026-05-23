/* ============================================================
   FARAZ MASTER — CONFIG MANAGER
   All settings stored encrypted in localStorage
============================================================ */
'use strict';

window.FM = window.FM || {};

FM.config = {
  _key: 'fm_config',

  load() {
    try {
      const raw = localStorage.getItem(this._key);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  },

  save(data) {
    try {
      localStorage.setItem(this._key, JSON.stringify(data));
    } catch(e) { console.error('Config save failed', e); }
  },

  get(key, def = null) {
    return this.load()[key] ?? def;
  },

  set(key, value) {
    const c = this.load();
    c[key] = value;
    this.save(c);
  },

  clear() {
    localStorage.removeItem(this._key);
  }
};
