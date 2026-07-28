import {
  ENGINE_VERSION,
  STORAGE_KEYS
} from './reminder/engine.mjs';
import {
  loadLatestAiosDailyContext,
  loadRuntimeFlag,
  prependScheduledDrafts
} from './aios-daily-context.mjs';

const STATE = {
  context: null,
  messages: []
};
const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeSourceUrl(value) {
  try {
    const url = new URL(value, window.location.origin);
    const storedRecord = url.origin === window.location.origin && url.pathname.startsWith('/aios/');
    return url.protocol === 'https:' || storedRecord ? url.href : '';
  } catch {
    return '';
  }
}

function getStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function setStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Read-only browser sessions still receive the five daily drafts.
  }
}

function fallbackFive(data) {
  return [...(data.dailySpecial || []), ...(data.jeffreyToday || [])]
    .slice(0, 5)
    .map((item, index) => ({
      id: item.id || `legacy-daily-${index}`,
      text: item.text || item.content || '',
      mainTheme: data.theme || '今日提醒',
      dataStatus: item.sourceTimestamp ? 'Stored production record' : 'Evergreen',
      generatedAt: data.production?.generatedAt || new Date().toISOString(),
      status: 'draft_human_approval_required',
      source: item.sourceUrl ? { name: item.source || 'Stored record', url: item.sourceUrl } : null
    }))
    .filter((item) => item.text);
}

function fallbackContext(data) {
  const weather = data.weatherContext || {};
  return {
    verified: Boolean(weather.source && weather.updateTime),
    source: weather.sourceUrl ? { name: weather.source, url: weather.sourceUrl } : null
  };
}

function relationshipKey(message) {
  return message.id || `relationship|${message.text}`;
}

function renderStatus() {
  const verified = STATE.context?.verified;
  const sourceUrl = safeSourceUrl(STATE.context?.source?.url);
  const source = sourceUrl
    ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(STATE.context.source.name)}</a>`
    : 'AIOS stored records / Evergreen';
  $('relationshipStatus').innerHTML = `
    <strong>${verified ? '今日資料已驗證 · 5條草稿' : '今日資料未能確認 · 5條Evergreen草稿'}</strong>
    <span>主題：${escapeHtml(STATE.messages[0]?.mainTheme || '今日生活同訓練節奏')}</span>
    <span>來源：${source}</span>`;
}

function renderMessages() {
  const favourites = getStore(STORAGE_KEYS.favourites, {});
  const usage = getStore(STORAGE_KEYS.usage, {});
  $('relationshipGrid').innerHTML = STATE.messages.slice(0, 5).map((message) => {
    const key = relationshipKey(message);
    const sourceUrl = safeSourceUrl(message.source?.url);
    const source = sourceUrl
      ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(message.source.name)}</a>`
      : 'Evergreen';
    return `<article class="relationship-card" data-id="${escapeHtml(message.id)}">
      <div class="relationship-chips">
        <span>${escapeHtml(message.mainTheme || '今日提醒')}</span>
        <span>Draft · Human approval required</span>
      </div>
      <p class="relationship-message">${escapeHtml(message.text)}</p>
      <div class="relationship-meta">
        <span>${escapeHtml(message.dataStatus || 'Evergreen')}</span>
        <span>${source}</span>
        <span>Used ${usage[key]?.count || 0}</span>
      </div>
      <div class="relationship-actions">
        <button class="btn" data-action="copy" type="button">📋 Copy</button>
        <button class="btn secondary" data-action="favourite" type="button">${favourites[key] ? '❤️ 已收藏' : '♡ Favourite'}</button>
      </div>
    </article>`;
  }).join('');
}

$('relationshipGrid').addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  const card = event.target.closest('[data-id]');
  if (!button || !card) return;
  const message = STATE.messages.find((item) => item.id === card.dataset.id);
  if (!message) return;
  const key = relationshipKey(message);
  if (button.dataset.action === 'copy') {
    try {
      await navigator.clipboard.writeText(message.text);
      const usage = getStore(STORAGE_KEYS.usage, {});
      usage[key] = {
        ...message,
        content: message.text,
        count: (usage[key]?.count || 0) + 1,
        lastCopied: new Date().toISOString()
      };
      setStore(STORAGE_KEYS.usage, usage);
      renderMessages();
      window.dispatchEvent(new CustomEvent('jeffrey-tracking-updated'));
    } catch {
      alert('未能使用Clipboard，請手動複製。');
    }
  } else if (button.dataset.action === 'favourite') {
    const favourites = getStore(STORAGE_KEYS.favourites, {});
    if (favourites[key]) delete favourites[key];
    else favourites[key] = { ...message, content: message.text, savedAt: new Date().toISOString() };
    setStore(STORAGE_KEYS.favourites, favourites);
    renderMessages();
    window.dispatchEvent(new CustomEvent('jeffrey-tracking-updated'));
  }
});

async function boot() {
  setStore(STORAGE_KEYS.migration, {
    version: ENGINE_VERSION,
    legacy_data_preserved: true,
    completed_at: new Date().toISOString()
  });
  const response = await fetch(`data/today.json?ts=${Date.now()}`, { cache: 'no-store' });
  const data = response.ok ? await response.json() : {};
  STATE.context = fallbackContext(data);
  STATE.messages = fallbackFive(data);

  if (await loadRuntimeFlag()) {
    try {
      const scheduled = await loadLatestAiosDailyContext();
      STATE.context = scheduled.context;
      STATE.messages = prependScheduledDrafts([], scheduled.messages).slice(0, 5);
    } catch (error) {
      console.warn('AIOS Daily Context fallback:', error);
    }
  }
  renderStatus();
  renderMessages();
}

document.documentElement.dataset.relationshipEngine = ENGINE_VERSION;
boot().catch((error) => {
  console.error('Relationship Engine:', error);
  STATE.messages = [];
  renderStatus();
  renderMessages();
});
