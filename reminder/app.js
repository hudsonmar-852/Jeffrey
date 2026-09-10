import {
  ENGINE_VERSION,
  STORAGE_KEYS,
  copyCustomerText
} from './engine.mjs';

const state = { board: null, view: 'today' };
const $ = (id) => document.getElementById(id);

function getStore(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function setStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function itemKey(item) {
  return item.archive_id;
}

function normaliseUsageRecord(record) {
  if (!record || typeof record !== 'object') {
    return { count: 0, active: false };
  }
  const hasExplicitCount = Number.isFinite(Number(record.count));
  return {
    ...record,
    count: hasExplicitCount ? Math.max(0, Number(record.count)) : 1,
    active: typeof record.active === 'boolean' ? record.active : true
  };
}

function totalUsageCount(usage) {
  return Object.values(usage).reduce((total, record) => {
    return total + normaliseUsageRecord(record).count;
  }, 0);
}

function formatUpdatedDate(value) {
  if (!value) return state.board?.date || '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return state.board?.date || '—';
  return new Intl.DateTimeFormat('zh-HK', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(parsed);
}

function favouriteItems(favourites) {
  const current = new Map((state.board?.items || []).map((item) => [itemKey(item), item]));
  return Object.entries(favourites)
    .map(([archiveId, saved]) => ({
      ...(current.get(archiveId) || {}),
      ...(saved || {}),
      archive_id: archiveId
    }))
    .filter((item) => item.customer_text)
    .sort((left, right) => String(right.saved_at || '').localeCompare(String(left.saved_at || '')));
}

function setView(nextView) {
  state.view = nextView;
  document.querySelectorAll('[data-view]').forEach((button) => {
    const active = button.dataset.view === nextView;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  render();
}

function render() {
  const favourites = getStore(STORAGE_KEYS.favourites);
  const usage = getStore(STORAGE_KEYS.usage);
  const todayItems = state.board?.items || [];
  const savedItems = favouriteItems(favourites);
  const items = state.view === 'favourites' ? savedItems : todayItems;
  $('boardDate').textContent = state.board?.date || '—';
  $('updatedDate').textContent = formatUpdatedDate(state.board?.generated_at);
  $('usageTotal').textContent = totalUsageCount(usage);
  $('todayCount').textContent = todayItems.length;
  $('favouriteCount').textContent = savedItems.length;
  $('messageGrid').replaceChildren();

  for (const item of items) {
    const key = itemKey(item);
    const usageRecord = normaliseUsageRecord(usage[key]);
    const card = document.createElement('article');
    card.className = `curator-card${usageRecord.active ? ' used' : ''}`;
    card.dataset.archiveId = key;
    card.innerHTML = `
      <div class="card-top">
        ${usageRecord.active ? '<span class="used-mark">已使用</span>' : '<span></span>'}
        <span class="usage-count" aria-label="累積使用次數">使用 ${usageRecord.count} 次</span>
      </div>
      <p class="customer-text"></p>
      <div class="card-actions">
        <button class="btn copy-primary" data-action="copy">複製短訊</button>
        <button class="btn secondary" data-action="favourite">${favourites[key] ? '已收藏' : '收藏'}</button>
        <button class="btn secondary" data-action="used">${usageRecord.active ? '取消已用' : '標記已用'}</button>
      </div>`;
    card.querySelector('.customer-text').textContent = item.customer_text;
    card.addEventListener('click', (event) => handleAction(event, item));
    $('messageGrid').appendChild(card);
  }

  const boardInvalid = state.view === 'today' && todayItems.length !== 5;
  const favouritesEmpty = state.view === 'favourites' && savedItems.length === 0;
  $('emptyState').textContent = favouritesEmpty
    ? '收藏庫暫時未有短訊。撳「收藏」後，即使短訊離開今日 Top 5，仍然可以喺呢度搵返。'
    : '今日精選未準備好。畫面唔會顯示舊短訊，請稍後再試。';
  $('emptyState').hidden = !boardInvalid && !favouritesEmpty;
  $('messageGrid').hidden = boardInvalid || favouritesEmpty;
}

async function handleAction(event, item) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const key = itemKey(item);

  if (button.dataset.action === 'copy') {
    try {
      await copyCustomerText(item, navigator.clipboard);
      button.textContent = '已複製';
      setTimeout(render, 700);
    } catch {
      alert('未能使用 Clipboard，請手動複製。');
    }
  } else if (button.dataset.action === 'favourite') {
    const favourites = getStore(STORAGE_KEYS.favourites);
    if (favourites[key]) delete favourites[key];
    else favourites[key] = {
      archive_id: key,
      customer_text: item.customer_text,
      saved_at: new Date().toISOString()
    };
    setStore(STORAGE_KEYS.favourites, favourites);
    render();
  } else if (button.dataset.action === 'used') {
    const usage = getStore(STORAGE_KEYS.usage);
    const current = normaliseUsageRecord(usage[key]);
    const now = new Date().toISOString();

    if (current.active) {
      usage[key] = {
        ...current,
        customer_text: item.customer_text,
        active: false,
        updated_at: now
      };
    } else {
      usage[key] = {
        ...current,
        customer_text: item.customer_text,
        count: current.count + 1,
        active: true,
        used_at: now,
        last_used_at: now,
        updated_at: now
      };
    }

    setStore(STORAGE_KEYS.usage, usage);
    render();
  }
}

async function boot() {
  try {
    const boardUrl = new URL(`../data/curator-board.json?ts=${Date.now()}`, import.meta.url);
    const response = await fetch(boardUrl);
    if (!response.ok) throw new Error(`Board request failed: ${response.status}`);
    const board = await response.json();
    if (!Array.isArray(board.items) || board.items.length !== 5) {
      throw new Error('Production board must contain exactly five items');
    }
    state.board = board;
    localStorage.setItem(STORAGE_KEYS.migration, JSON.stringify({
      version: ENGINE_VERSION,
      legacy_data_preserved: true,
      completed_at: new Date().toISOString()
    }));
    render();
  } catch (error) {
    $('emptyState').hidden = false;
    $('messageGrid').hidden = true;
    console.error(error);
  }
}

document.documentElement.dataset.curatorEngine = ENGINE_VERSION;
document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});
boot();
