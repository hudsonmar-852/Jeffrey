(() => {
  'use strict';

  const APP_VERSION = '3.1.2';
  const BASE_DATA_URLS = ['data/today.json'];
  const DAILY_OVERLAY_URLS = ['data/daily-2026-07-11.json'];
  const STATE = { data: null, current: 'all', query: '', source: null };
  const CATEGORY_ORDER = ['all','daily_special','jeffrey_today','weather','busy_office','fitness_lifestyle','healthy_lifestyle','recovery','senior_safe','long_time_no_see','favourite','archive'];
  const CATEGORY_LABELS = {all:'全部',daily_special:'⭐ 今日精選',jeffrey_today:'☕ Jeffrey Today',weather:'🌦 天氣背景',busy_office:'💼 上班族',fitness_lifestyle:'🔥 Keep Fit',healthy_lifestyle:'🥗 健康生活',recovery:'🧘 Recovery',senior_safe:'👴 銀髮安全',long_time_no_see:'🫶 久未聯絡',favourite:'❤️ Favourite',archive:'📚 Archive'};
  const $ = id => document.getElementById(id);

  function safeParse(value, fallback) { try { return JSON.parse(value); } catch (_) { return fallback; } }
  function getStore(key, fallback) { try { const value = localStorage.getItem(key); return value ? safeParse(value, fallback) : fallback; } catch (_) { return fallback; } }
  function setStore(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }

  function flattenMessages(data) {
    const list = [];
    (data.dailySpecial || []).forEach(m => list.push({...m, category:'daily_special', daily:true}));
    (data.jeffreyToday || []).forEach(m => list.push({...m, category:'jeffrey_today', daily:true}));
    Object.entries(data.groups || {}).forEach(([category, items]) => (items || []).forEach(m => list.push({...m, category, daily:true})));
    (data.weatherMessages || []).forEach(m => list.push({...m, category:'weather', daily:true}));
    (data.archive || []).forEach(m => list.push({...m, category:'archive'}));
    return list;
  }

  function validateData(data) {
    if (!data || typeof data !== 'object') throw new Error('Invalid JSON root');
    const hasContent = ['dailySpecial','jeffreyToday','weatherMessages','groups','archive'].some(k => data[k] && (Array.isArray(data[k]) ? data[k].length : Object.keys(data[k]).length));
    if (!hasContent) throw new Error('No reminder content found');
    return data;
  }

  async function fetchJson(path) {
    const absolute = new URL(path, window.location.href);
    absolute.searchParams.set('v', String(Date.now()));
    const response = await fetch(absolute.href);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
    const text = await response.text();
    return validateData(JSON.parse(text));
  }

  async function fetchFirst(urls, optional=false) {
    let lastError = null;
    for (const url of urls) {
      try { return { data: await fetchJson(url), source: url }; }
      catch (error) { lastError = error; }
    }
    if (optional) return null;
    throw lastError || new Error('Unable to load reminder data');
  }

  function mergeData(overlay, base) {
    if (!overlay) return base;
    const groups = {};
    const keys = new Set([...Object.keys(base.groups || {}), ...Object.keys(overlay.groups || {})]);
    keys.forEach(key => { groups[key] = [...(overlay.groups?.[key] || []), ...(base.groups?.[key] || [])]; });
    return {
      ...base, ...overlay,
      dailySpecial:[...(overlay.dailySpecial || []), ...(base.dailySpecial || [])],
      jeffreyToday:[...(overlay.jeffreyToday || []), ...(base.jeffreyToday || [])],
      weatherMessages:[...(overlay.weatherMessages || []), ...(base.weatherMessages || [])],
      groups,
      archive:[...(overlay.archive || []), ...(base.archive || [])]
    };
  }

  async function loadData() {
    try {
      const baseResult = await fetchFirst(BASE_DATA_URLS);
      const overlayResult = await fetchFirst(DAILY_OVERLAY_URLS, true);
      const data = mergeData(overlayResult?.data, baseResult.data);
      STATE.source = overlayResult ? `${overlayResult.source} + ${baseResult.source}` : baseResult.source;
      setStore('jeffreyLastGoodData', { savedAt:new Date().toISOString(), data });
      return data;
    } catch (error) {
      const cached = getStore('jeffreyLastGoodData', null);
      if (cached?.data) { STATE.source = 'local-cache'; return validateData(cached.data); }
      throw error;
    }
  }

  function messageKey(m) { return m.id || `${m.category}|${m.topic}|${m.content}`; }
  function getFavouriteMessages() { return Object.values(getStore('jeffreyFavourites', {})); }
  function setEngineStatus(mode, text) { const el = $('engineStatus'); if (el) { el.className = `engine-status ${mode}`; el.textContent = text; } }

  function renderBrief() {
    const d = STATE.data, weather = d.weatherContext || {};
    $('dailyBrief').innerHTML = `<div class="brief-grid"><div class="brief-card"><h3>今日主題</h3><p>${escapeHtml(d.theme || '今日保持穩定節奏')}</p></div><div class="brief-card"><h3>香港生活脈搏</h3><p>${escapeHtml(d.lifePulse || '暫未提供')}</p></div><div class="brief-card"><h3>天氣背景</h3><p>${escapeHtml(weather.summary || '天氣只作背景資訊')}</p></div></div>`;
  }

  function renderTabs() {
    const tabs = $('tabs'); tabs.innerHTML = '';
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

  function updateStats(visible) {
    $('totalCount').textContent = STATE.data ? flattenMessages(STATE.data).length : 0;
    $('visibleCount').textContent = visible;
    $('copiedCount').textContent = Object.keys(getStore('jeffreyUsage', {})).length;
    $('favouriteCount').textContent = Object.keys(getStore('jeffreyFavourites', {})).length;
  }

  function renderMessages() {
    const grid = $('messageGrid'), used = getStore('jeffreyUsage', {}), fav = getStore('jeffreyFavourites', {}), items = selectedMessages();
    grid.innerHTML = '';
    if (!items.length) { grid.innerHTML = '<div class="empty-state">找不到相符訊息。可清除搜尋或切換其他分類。</div>'; updateStats(0); return; }
    items.slice(0, 100).forEach(m => {
      const key = messageKey(m), isFav = Boolean(fav[key] || m.fav), isUsed = Boolean(used[key]);
      const card = document.createElement('article');
      card.className = `card${m.daily ? ' daily' : ''}${isFav ? ' fav' : ''}`;
      card.innerHTML = `<div><div class="meta"><span class="pill">${escapeHtml(CATEGORY_LABELS[m.category] || m.category)}</span>${m.daily ? '<span class="pill today">今日新增</span>' : ''}${m.humanScore ? `<span class="pill score">Human ${escapeHtml(m.humanScore)}</span>` : ''}</div><div class="topic">${escapeHtml(m.topic || '')}</div><div class="content">${escapeHtml(m.content || '')}</div>${isUsed ? '<div class="usage">已 Copy 過，可避免重複發送</div>' : ''}</div><div class="card-actions"><button class="btn" data-copy>📋 Copy</button><button class="btn secondary" data-fav>${isFav ? '❤️ 已收藏' : '♡ Favourite'}</button></div>`;
      grid.appendChild(card);
      card.querySelector('[data-copy]').onclick = async () => {
        try {
          await navigator.clipboard.writeText(m.content || '');
          used[key] = {...m, lastCopied:new Date().toISOString(), count:(used[key]?.count || 0) + 1};
          setStore('jeffreyUsage', used); renderMessages();
        } catch (_) { alert('未能自動複製，請長按文字手動複製。'); }
      };
      card.querySelector('[data-fav]').onclick = () => {
        const store = getStore('jeffreyFavourites', {});
        if (store[key]) delete store[key]; else store[key] = {...m, savedAt:new Date().toISOString()};
        setStore('jeffreyFavourites', store); renderMessages();
      };
    });
    updateStats(items.length);
  }

  function initTheme() { const saved = getStore('jeffreyTheme', 'light'); document.documentElement.dataset.theme = saved; $('themeToggle').textContent = saved === 'dark' ? 'Light Mode' : 'Dark Mode'; }

  async function boot() {
    initTheme();
    $('searchInput').addEventListener('input', e => { STATE.query = e.target.value; renderMessages(); });
    $('themeToggle').onclick = () => { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; setStore('jeffreyTheme', next); $('themeToggle').textContent = next === 'dark' ? 'Light Mode' : 'Dark Mode'; };
    $('randomReminder').onclick = () => { const items = selectedMessages(); if (!items.length) return; const m = items[Math.floor(Math.random() * items.length)]; STATE.query = m.topic || m.content || ''; $('searchInput').value = STATE.query; renderMessages(); };
    try {
      STATE.data = await loadData();
      renderBrief(); renderTabs(); renderMessages();
      setEngineStatus(STATE.source === 'local-cache' ? 'warning-state' : 'ready-state', STATE.source === 'local-cache' ? 'Offline cache' : 'Engine online');
      $('versionInfo').textContent = `Jeffrey Reminder Engine v${APP_VERSION} · Data ${STATE.data.date || 'unknown'} · ${STATE.source}`;
    } catch (error) {
      console.error(error);
      setEngineStatus('error-state', 'Engine error');
      $('dailyBrief').innerHTML = `<div class="error-panel"><strong>今日內容載入失敗</strong><p>${escapeHtml(error.message || 'Unknown error')}</p><button class="btn retry" type="button">重新載入</button></div>`;
      $('dailyBrief').querySelector('.retry').onclick = () => window.location.reload();
      $('messageGrid').innerHTML = '<div class="empty-state">網站框架正常，但未能讀取提醒資料。</div>';
      updateStats(0);
    }
  }

  window.addEventListener('DOMContentLoaded', boot);
})();