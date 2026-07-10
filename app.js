(() => {
  'use strict';

  const APP_VERSION = '3.0.0';
  const DATA_URLS = ['./data/today.json', 'data/today.json'];
  const STATE = { data: null, current: 'all', query: '', source: null };
  const CATEGORY_ORDER = ['all','daily_special','jeffrey_today','weather','busy_office','fitness_lifestyle','healthy_lifestyle','recovery','senior_safe','long_time_no_see','favourite','archive'];
  const CATEGORY_LABELS = {all:'全部',daily_special:'⭐ 今日精選',jeffrey_today:'☕ Jeffrey Today',weather:'🌦 天氣背景',busy_office:'💼 上班族',fitness_lifestyle:'🔥 Keep Fit',healthy_lifestyle:'🥗 健康生活',recovery:'🧘 Recovery',senior_safe:'👴 銀髮安全',long_time_no_see:'🫶 久未聯絡',favourite:'❤️ Favourite',archive:'📚 Archive'};
  const $ = id => document.getElementById(id);

  function safeParse(value, fallback) {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }
  function getStore(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? safeParse(value, fallback) : fallback;
    } catch (_) { return fallback; }
  }
  function setStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }
  function escapeHtml(value='') {
    return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }
  function flattenMessages(data) {
    const list = [];
    (data.dailySpecial || []).forEach(m => list.push({...m, category:'daily_special', daily:true}));
    (data.jeffreyToday || []).forEach(m => list.push({...m, category:'jeffrey_today', daily:true}));
    Object.entries(data.groups || {}).forEach(([category, items]) => (items || []).forEach(m => list.push({...m, category, daily:true})));
    (data.weatherMessages || []).forEach(m => list.push({...m, category:'weather', daily:true}));
    (data.archive || []).forEach(m => list.push({...m, category:'archive'}));
    return list;
  }
  function messageKey(m) { return m.id || `${m.category}|${m.topic}|${m.content}`; }
  function getFavouriteMessages() { return Object.values(getStore('jeffreyFavourites', {})); }

  function validateData(data) {
    if (!data || typeof data !== 'object') throw new Error('Invalid JSON root');
    const hasContent = ['dailySpecial','jeffreyToday','weatherMessages','groups','archive'].some(k => data[k] && (Array.isArray(data[k]) ? data[k].length : Object.keys(data[k]).length));
    if (!hasContent) throw new Error('No reminder content found');
    return data;
  }

  async function fetchJson(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${url}?v=${Date.now()}`, { cache:'no-store', signal:controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return validateData(await response.json());
    } finally { clearTimeout(timeout); }
  }

  async function loadData() {
    let lastError = null;
    for (const url of DATA_URLS) {
      try {
        const data = await fetchJson(url);
        STATE.source = url;
        setStore('jeffreyLastGoodData', { savedAt:new Date().toISOString(), data });
        return data;
      } catch (error) { lastError = error; }
    }
    const cached = getStore('jeffreyLastGoodData', null);
    if (cached && cached.data) {
      STATE.source = 'local-cache';
      return validateData(cached.data);
    }
    throw lastError || new Error('Unable to load reminder data');
  }

  function setEngineStatus(mode, text) {
    const el = $('engineStatus');
    if (!el) return;
    el.className = `engine-status ${mode}`;
    el.textContent = text;
  }

  function renderBrief() {
    const d = STATE.data;
    const weather = d.weatherContext || {};
    $('dailyBrief').innerHTML = `<div class="brief-grid">
      <div class="brief-card"><h3>今日主題</h3><p>${escapeHtml(d.theme || '今日保持穩定節奏')}</p></div>
      <div class="brief-card"><h3>香港生活脈搏</h3><p>${escapeHtml(d.lifePulse || '暫未提供')}</p></div>
      <div class="brief-card"><h3>天氣背景</h3><p>${escapeHtml(weather.summary || '天氣只作背景資訊')}</p></div>
    </div>`;
  }

  function renderTabs() {
    const tabs = $('tabs');
    tabs.innerHTML = '';
    CATEGORY_ORDER.forEach(cat => {
      const button = document.createElement('button');
      button.className = `tab${STATE.current === cat ? ' active' : ''}`;
      button.textContent = CATEGORY_LABELS[cat] || cat;
      button.type = 'button';
      button.onclick = () => { STATE.current = cat; renderTabs(); renderMessages(); };
      tabs.appendChild(button);
    });
  }

  function selectedMessages() {
    if (!STATE.data) return [];
    const all = STATE.current === 'favourite'
      ? getFavouriteMessages().map(m => ({...m, category:'favourite', fav:true}))
      : flattenMessages(STATE.data).filter(m => STATE.current === 'all' ? m.category !== 'archive' : m.category === STATE.current);
    const q = STATE.query.trim().toLowerCase();
    return q ? all.filter(m => `${m.topic || ''} ${m.content || ''}`.toLowerCase().includes(q)) : all;
  }

  function renderMessages() {
    const grid = $('messageGrid');
    const used = getStore('jeffreyUsage', {});
    const fav = getStore('jeffreyFavourites', {});
    const items = selectedMessages();
    grid.innerHTML = '';
    if (!items.length) {
      grid.innerHTML = '<div class="empty-state">找不到相符訊息。可清除搜尋或切換其他分類。</div>';
      updateStats(0);
      return;
    }
    items.slice(0, 100).forEach(m => {
      const key = messageKey(m);
      const isFav = Boolean(fav[key] || m.fav);
      const isUsed = Boolean(used[key]);
      const card = document.createElement('article');
      card.className = `card${m.daily ? ' daily' : ''}${isFav ? ' fav' : ''}`;
      card.innerHTML = `<div>
        <div class="meta"><span class="pill">${escapeHtml(CATEGORY_LABELS[m.category] || m.category)}</span>${m.daily ? '<span class="pill today">今日新增</span>' : ''}${m.humanScore ? `<span class="pill score">Human ${escapeHtml(m.humanScore)}</span>` : ''}</div>
        <div class="topic">${escapeHtml(m.topic || '')}</div>
        <div class="content">${escapeHtml(m.content || '')}</div>
        ${isUsed ? '<div class="usage">已 Copy 過，可避免重複發送</div>' : ''}
      </div>
      <div class="card-actions"><button class="btn" data-copy>📋 Copy</button><button class="btn secondary" data-fav>${isFav ? '❤️ 已收藏' : '♡ Favourite'}</button></div>`;
      grid.appendChild(card);
      card.querySelector('[data-copy]').onclick = () => copyMessage(m, key, card.querySelector('[data-copy]'));
      card.querySelector('[data-fav]').onclick = () => toggleFav(m, key);
    });
    updateStats(items.length);
  }

  async function writeClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    const area = document.createElement('textarea');
    area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.appendChild(area); area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    if (!ok) throw new Error('Copy failed');
  }

  async function copyMessage(m, key, btn) {
    try {
      await writeClipboard(m.content || '');
      const used = getStore('jeffreyUsage', {});
      used[key] = {...m, lastCopied:new Date().toISOString(), count:(used[key]?.count || 0) + 1};
      setStore('jeffreyUsage', used);
      btn.textContent = '✅ 已 Copy';
      setTimeout(renderMessages, 700);
    } catch (_) { alert('未能自動複製，請長按文字手動複製。'); }
  }

  function toggleFav(m, key) {
    const fav = getStore('jeffreyFavourites', {});
    if (fav[key]) delete fav[key]; else fav[key] = {...m, savedAt:new Date().toISOString()};
    setStore('jeffreyFavourites', fav);
    renderMessages();
  }

  function updateStats(visible) {
    const all = STATE.data ? flattenMessages(STATE.data) : [];
    $('totalCount').textContent = all.length;
    $('visibleCount').textContent = visible;
    $('copiedCount').textContent = Object.keys(getStore('jeffreyUsage', {})).length;
    $('favouriteCount').textContent = Object.keys(getStore('jeffreyFavourites', {})).length;
  }

  function showRandomReminder() {
    const items = selectedMessages();
    if (!items.length) return;
    const m = items[Math.floor(Math.random() * items.length)];
    STATE.query = m.topic || m.content || '';
    $('searchInput').value = STATE.query;
    renderMessages();
    window.scrollTo({ top:$('messageGrid').offsetTop - 20, behavior:'smooth' });
  }

  function initTheme() {
    const saved = getStore('jeffreyTheme', 'light');
    document.documentElement.dataset.theme = saved;
    $('themeToggle').textContent = saved === 'dark' ? 'Light Mode' : 'Dark Mode';
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setStore('jeffreyTheme', next);
    $('themeToggle').textContent = next === 'dark' ? 'Light Mode' : 'Dark Mode';
  }

  async function boot() {
    initTheme();
    $('searchInput').addEventListener('input', e => { STATE.query = e.target.value; renderMessages(); });
    $('randomReminder').onclick = showRandomReminder;
    $('themeToggle').onclick = toggleTheme;
    try {
      STATE.data = await loadData();
      renderBrief(); renderTabs(); renderMessages();
      const cached = STATE.source === 'local-cache';
      setEngineStatus(cached ? 'warning-state' : 'ready-state', cached ? 'Offline cache' : 'Engine online');
      $('versionInfo').textContent = `Jeffrey Reminder Engine v${APP_VERSION} · Data ${STATE.data.date || 'unknown'} · ${STATE.source}`;
    } catch (error) {
      console.error('Jeffrey Reminder boot failure:', error);
      setEngineStatus('error-state', 'Engine error');
      $('dailyBrief').innerHTML = `<div class="error-panel"><strong>今日內容載入失敗</strong><p>${escapeHtml(error.message || 'Unknown error')}</p><button class="btn retry" type="button">重新載入</button></div>`;
      $('dailyBrief').querySelector('.retry').onclick = () => location.reload();
      $('messageGrid').innerHTML = '<div class="empty-state">網站框架正常，但未能讀取 data/today.json。</div>';
      updateStats(0);
    }
  }

  window.addEventListener('DOMContentLoaded', boot);
})();