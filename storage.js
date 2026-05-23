/* ============================================================
   FARAZ MASTER — FIREBASE STORAGE INTEGRATION
   Firestore + Storage — graceful fallback to localStorage
============================================================ */
'use strict';
window.FM = window.FM || {};

FM.storage = {
  db: null,
  storage: null,
  ready: false,
  _fileCache: 'fm_files',

  async init() {
    const c = FM.config.load();
    if (!c.firebaseKey || !c.firebaseProject) {
      console.info('Firebase not configured — using localStorage only');
      return;
    }

    try {
      const { initializeApp, getFirestore, getStorage } = window._firebaseModules || {};
      if (!initializeApp) { console.warn('Firebase modules not loaded yet'); return; }

      const app = initializeApp({
        apiKey: c.firebaseKey,
        authDomain: c.firebaseDomain || `${c.firebaseProject}.firebaseapp.com`,
        projectId: c.firebaseProject,
        storageBucket: `${c.firebaseProject}.appspot.com`,
        messagingSenderId: '',
        appId: ''
      }, 'faraz-master');

      const { getFirestore: gf } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const { getStorage: gs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js');
      this.db = gf(app);
      this.storage = gs(app);
      this.ready = true;
      console.info('Firebase connected ✓');
    } catch(e) {
      console.warn('Firebase init failed:', e.message, '— using localStorage fallback');
    }
  },

  async saveDoc(collection, docId, data) {
    if (!this.ready || !this.db) return false;
    try {
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await setDoc(doc(this.db, collection, docId), { ...data, _updated: new Date().toISOString() }, { merge: true });
      return true;
    } catch(e) { console.warn('Firestore write error:', e.message); return false; }
  },

  async getDoc(collection, docId) {
    if (!this.ready || !this.db) return null;
    try {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const snap = await getDoc(doc(this.db, collection, docId));
      return snap.exists() ? snap.data() : null;
    } catch(e) { return null; }
  },

  async query(collection, limit = 50) {
    if (!this.ready || !this.db) return [];
    try {
      const { collection: col, getDocs, orderBy, query: q, limitQ } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const snap = await getDocs(col(this.db, collection));
      const results = [];
      snap.forEach(d => results.push({ id: d.id, ...d.data() }));
      return results.slice(0, limit);
    } catch(e) { return []; }
  },

  // File upload to Firebase Storage
  async uploadFiles(fileList) {
    if (!fileList || !fileList.length) return;
    const files = Array.from(fileList);

    for (const file of files) {
      try {
        showToast(`Uploading: ${file.name}...`);
        if (this.ready && this.storage) {
          await this._uploadToFirebase(file);
        } else {
          await this._saveFileLocally(file);
        }
      } catch(e) {
        showToast(`Upload failed: ${file.name}`, 'error');
      }
    }
    this._renderFiles();
  },

  async _uploadToFirebase(file) {
    const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js');
    const fileRef = ref(this.storage, `files/${Date.now()}_${file.name}`);
    const snap = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(snap.ref);
    const meta = { name: file.name, size: file.size, type: file.type, url, uploadedAt: new Date().toISOString() };
    const cached = this._getCachedFiles();
    cached.push(meta);
    localStorage.setItem(this._fileCache, JSON.stringify(cached));
    await this.saveDoc('files', Date.now().toString(), meta);
    showToast(`✅ Uploaded: ${file.name}`);
  },

  async _saveFileLocally(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const meta = { name: file.name, size: file.size, type: file.type, dataUrl: e.target.result, uploadedAt: new Date().toISOString(), local: true };
        const cached = this._getCachedFiles();
        cached.push(meta);
        localStorage.setItem(this._fileCache, JSON.stringify(cached));
        showToast(`✅ Saved locally: ${file.name}`);
        resolve(meta);
      };
      reader.readAsDataURL(file);
    });
  },

  _getCachedFiles() {
    try { return JSON.parse(localStorage.getItem(this._fileCache) || '[]'); } catch { return []; }
  },

  _renderFiles() {
    const grid = document.getElementById('files-grid');
    if (!grid) return;
    const files = this._getCachedFiles();
    if (!files.length) { grid.innerHTML = '<div style="color:var(--text-muted);padding:1rem">No files yet</div>'; return; }
    grid.innerHTML = files.reverse().map((f, i) => `
      <div class="file-card">
        <div class="file-icon">${this._getFileIcon(f.type)}</div>
        <div class="file-name" title="${f.name}">${f.name}</div>
        <div class="file-size">${this._formatSize(f.size)}</div>
        <div style="display:flex;gap:.3rem;margin-top:.5rem">
          ${f.url ? `<a href="${f.url}" target="_blank" style="font-size:.72rem;color:var(--accent)">Open</a>` : ''}
          ${f.dataUrl ? `<a href="${f.dataUrl}" download="${f.name}" style="font-size:.72rem;color:var(--accent)">Download</a>` : ''}
          <button onclick="FM.storage._deleteFile(${files.length-1-i})" style="font-size:.72rem;color:var(--danger);margin-left:auto">Delete</button>
        </div>
      </div>`).join('');
  },

  _deleteFile(idx) {
    const files = this._getCachedFiles();
    files.splice(files.length - 1 - idx, 1);
    localStorage.setItem(this._fileCache, JSON.stringify(files));
    this._renderFiles();
    showToast('File deleted');
  },

  _getFileIcon(type) {
    if (!type) return '📄';
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📕';
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
    if (type.includes('presentation') || type.includes('powerpoint')) return '📊';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('zip') || type.includes('compressed')) return '🗜️';
    return '📄';
  },

  _formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/(1024*1024)).toFixed(1) + ' MB';
  }
};

// Expose for upload zone
function loadFiles() { FM.storage._renderFiles(); }
