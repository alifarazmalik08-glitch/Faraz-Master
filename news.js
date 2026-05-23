/* ============================================================
   FARAZ MASTER — LIVE NEWS SYSTEM
   Google News RSS + NewsAPI fallback
============================================================ */
'use strict';
window.FM = window.FM || {};

FM.news = {
  articles: [],
  currentFilter: 'all',
  lastFetch: 0,
  REFRESH_MS: 15 * 60 * 1000, // 15 min

  _feeds: {
    pk: [
      'https://feeds.bbcurdu.com/bbcurdu/rss/frontpage',
      'https://rss.app/feeds/dawn-pakistan.xml',
      'https://feeds.feedburner.com/geo-urdu-rss',
    ],
    world: [
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    ],
    tech: [
      'https://feeds.feedburner.com/TechCrunch/',
      'https://www.wired.com/feed/rss',
    ],
    business: [
      'https://feeds.feedburner.com/businessinsider',
    ]
  },

  RSS2JSON: 'https://api.rss2json.com/v1/api.json?rss_url=',
  NEWSAPI: 'https://newsapi.org/v2/top-headlines',

  async start() {
    await this.fetch();
    setInterval(() => this.fetch(), this.REFRESH_MS);
  },

  async fetch() {
    const c = FM.config.load();
    const country = c.country || 'pk';
    const newsKey = c.newsKey;

    let articles = [];

    // Try NewsAPI first (if key provided)
    if (newsKey) {
      articles = await this._fetchNewsAPI(country, newsKey);
    }

    // Fallback: RSS feeds via rss2json
    if (!articles.length) {
      articles = await this._fetchRSS(country);
    }

    if (articles.length) {
      this.articles = articles;
      this.lastFetch = Date.now();
      this._updateBadge(articles.length);
      this.render();
    }
  },

  async _fetchNewsAPI(country, key) {
    try {
      const url = `${this.NEWSAPI}?country=${country}&pageSize=20&apiKey=${key}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.articles || []).map(a => ({
        title: a.title,
        summary: a.description || '',
        source: a.source?.name || 'News',
        url: a.url,
        publishedAt: a.publishedAt,
        category: 'world',
        importance: this._assessImportance(a.title)
      }));
    } catch { return []; }
  },

  async _fetchRSS(country) {
    const feeds = [
      ...(this._feeds[country] || this._feeds.pk),
      ...this._feeds.world.slice(0, 2)
    ];

    const results = await Promise.allSettled(
      feeds.slice(0, 5).map(feedUrl => this._parseFeed(feedUrl))
    );

    const articles = [];
    results.forEach(r => { if (r.status === 'fulfilled') articles.push(...r.value); });
    return articles.sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 30);
  },

  async _parseFeed(feedUrl) {
    try {
      const url = `${this.RSS2JSON}${encodeURIComponent(feedUrl)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return [];
      const data = await res.json();
      if (data.status !== 'ok') return [];
      return (data.items || []).slice(0, 8).map(item => ({
        title: item.title || '',
        summary: (item.description || '').replace(/<[^>]+>/g,'').substring(0, 200),
        source: data.feed?.title || feedUrl.split('/')[2],
        url: item.link || '#',
        publishedAt: item.pubDate,
        category: this._categorizeNews(item.title),
        importance: this._assessImportance(item.title)
      }));
    } catch { return []; }
  },

  _assessImportance(title) {
    if (!title) return 'fyi';
    const t = title.toLowerCase();
    if (t.match(/breaking|urgent|urgent|فوری|فوری خبر|ہلاکت|دھماکہ|حملہ|emergency|war|attack|killed|crisis|critical/i)) return 'breaking';
    if (t.match(/important|اہم|major|significant|election|vote|president|prime minister|وزیر|صدر|economy|budget/i)) return 'important';
    if (t.match(/technology|tech|ai|artificial intelligence|space|science|discovery|research/i)) return 'interesting';
    return 'fyi';
  },

  _categorizeNews(title) {
    const t = (title || '').toLowerCase();
    if (t.match(/pakistan|پاکستان|islamabad|karachi|lahore|کراچی|لاہور|اسلام آباد/i)) return 'pakistan';
    if (t.match(/tech|technology|ai|software|app|digital|cyber/i)) return 'tech';
    if (t.match(/business|economy|market|stock|trade|rupee|dollar|finance/i)) return 'business';
    return 'world';
  },

  filter(cat) {
    this.currentFilter = cat;
    this.render();
  },

  render() {
    const grid = document.getElementById('news-grid');
    if (!grid) return;

    let articles = this.articles;
    if (this.currentFilter !== 'all') {
      articles = articles.filter(a => a.category === this.currentFilter);
    }

    if (!articles.length) {
      grid.innerHTML = '<div class="news-loading">Loading news... (or no articles for this filter)</div>';
      return;
    }

    grid.innerHTML = articles.map(a => `
      <div class="news-card animate-in" onclick="window.open('${a.url}','_blank')">
        <div class="news-importance ${a.importance}">${
          a.importance === 'breaking' ? '🔴 BREAKING' :
          a.importance === 'important' ? '🟡 IMPORTANT' :
          a.importance === 'interesting' ? '🔵 INTERESTING' : '⚪ FYI'
        }</div>
        <div class="news-headline">${a.title || ''}</div>
        <div class="news-summary">${a.summary || ''}</div>
        <div class="news-meta">
          <span class="news-source">📰 ${a.source || ''}</span>
          <span class="news-time">${a.publishedAt ? this._timeAgo(a.publishedAt) : ''}</span>
        </div>
        <button onclick="event.stopPropagation();FM.news.askAbout('${(a.title||'').replace(/'/g,"\\'")}',this)" 
          style="margin-top:.5rem;font-size:.75rem;padding:3px 8px;background:var(--bg-input);border:1px solid var(--border);border-radius:4px;color:var(--accent)">
          🤖 Ask AI
        </button>
      </div>`).join('');
  },

  askAbout(headline, btn) {
    const lang = FM.language.current;
    const q = lang === 'ur'
      ? `اس خبر کے بارے میں مزید بتائیں اور اس کا اثر کیا ہوگا: "${headline}"`
      : `Tell me more about this news and its impact: "${headline}"`;
    switchPanel('chat');
    sendMessage(q);
  },

  _timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  },

  _updateBadge(count) {
    const badge = document.getElementById('news-badge');
    if (badge) { badge.textContent = count > 0 ? count : ''; badge.style.display = count > 0 ? '' : 'none'; }
  },

  getTopHeadlines(n = 5) {
    return this.articles.slice(0, n).map(a => `• ${a.title}`).join('\n');
  }
};
