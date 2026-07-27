import {
  ENGINE_VERSION,
  STORAGE_KEYS,
  copyCustomerText
} from './engine.mjs';

const state = { board: null };
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

function render() {
  const items = state.board?.items || [];
  const favourites = getStore(STORAGE_KEYS.favourites);
  const usage = getStore(STORAGE_KEYS.usage);
  const approvals = getStore(STORAGE_KEYS.approvals);
  $('boardDate').textContent = state.board?.date || '—';
  $('messageGrid').replaceChildren();
  for (const item of items) {
    const key = itemKey(item);
    const approved = Boolean(approvals[key]);
    const card = document.createElement('article');
    card.className = 'curator-card';
    card.dataset.archiveId = key;
    card.innerHTML = `
      <div class="card-top">
        <span class="status-badge ${approved ? 'approved' : 'draft'}">${approved ? 'Approved' : 'Draft'}</span>
        ${usage[key] ? '<span class="used-mark">已用</span>' : ''}
      </div>
      <p class="customer-text"></p>
      <div class="card-actions">
        <button class="btn copy-primary" data-action="copy">複製短訊</button>
        <button class="btn secondary" data-action="favourite">${favourites[key] ? '已收藏' : '收藏'}</button>
        <button class="btn secondary" data-action="used">${usage[key] ? '取消已用' : '標記已用'}</button>
      </div>`;
    card.querySelector('.customer-text').textContent = item.customer_text;
    card.addEventListener('click', (event) => handleAction(event, item));
    $('messageGrid').appendChild(card);
  }
  $('emptyState').hidden = items.length === 5;
  $('messageGrid').hidden = items.length !== 5;
}

async function handleAction(event, item) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const key = itemKey(item);
  if (button.dataset.action === 'copy') {
    const approvals = getStore(STORAGE_KEYS.approvals);
    if (!approvals[key] && !confirm('確認呢條短訊可以畀 Jeffrey 使用？')) return;
    approvals[key] = { approved_at: new Date().toISOString() };
    setStore(STORAGE_KEYS.approvals, approvals);
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
    else favourites[key] = { customer_text: item.customer_text, saved_at: new Date().toISOString() };
    setStore(STORAGE_KEYS.favourites, favourites);
    render();
  } else if (button.dataset.action === 'used') {
    const usage = getStore(STORAGE_KEYS.usage);
    if (usage[key]) delete usage[key];
    else usage[key] = { customer_text: item.customer_text, used_at: new Date().toISOString() };
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
boot();
