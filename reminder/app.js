import {
  ENGINE_VERSION,
  MESSAGE_TYPES,
  STORAGE_KEYS,
  contextFromDailyData,
  fetchHongKongContext,
  generateMessages,
  loadGenerated,
  recordMigration,
  saveGenerated
} from './engine.mjs';

const STATE = {
  data: null,
  current: 'all',
  generated: [],
  context: null,
  members: []
};

const CATEGORY_ORDER = [
  'all', 'daily_special', 'jeffrey_today', 'weather', 'busy_office',
  'fitness_lifestyle', 'healthy_lifestyle', 'recovery', 'senior_safe',
  'long_time_no_see', 'favourite', 'archive'
];
const CATEGORY_LABELS = {
  all: '全部',
  daily_special: '⭐ 今日精選',
  jeffrey_today: '☕ Jeffrey Today',
  weather: '🌦 天氣背景',
  busy_office: '💼 上班族',
  fitness_lifestyle: '🔥 Keep Fit',
  healthy_lifestyle: '🥗 健康生活',
  recovery: '🧘 Recovery',
  senior_safe: '👴 銀髮安全',
  long_time_no_see: '🫶 久未聯絡',
  favourite: '❤️ Favourite',
  archive: '📚 Archive'
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
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
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
  localStorage.setItem(key, JSON.stringify(value));
}

function flattenMessages(data) {
  const list = [];
  (data.dailySpecial || []).forEach((message) => list.push({ ...message, category: 'daily_special', daily: true }));
  (data.jeffreyToday || []).forEach((message) => list.push({ ...message, category: 'jeffrey_today', daily: true }));
  Object.entries(data.groups || {}).forEach(([category, items]) => {
    items.forEach((message) => list.push({ ...message, category, daily: true }));
  });
  (data.weatherMessages || []).forEach((message) => list.push({ ...message, category: 'weather', daily: true }));
  (data.archive || []).forEach((message) => list.push({ ...message, category: 'archive' }));
  return list;
}

function getFavouriteMessages() {
  return Object.values(getStore(STORAGE_KEYS.favourites, {}));
}

function renderBrief() {
  const data = STATE.data;
  $('dailyBrief').innerHTML = `<div class="brief-grid">
    <div class="brief-card"><h3>今日主題</h3><p>${data.theme || ''}</p></div>
    <div class="brief-card"><h3>香港生活脈搏</h3><p>${data.lifePulse || ''}</p></div>
    <div class="brief-card"><h3>天氣角色</h3><p>${data.weatherContext?.summary || ''}</p></div>
  </div>`;
}

function renderTabs() {
  const tabs = $('tabs');
  tabs.innerHTML = '';
  CATEGORY_ORDER.forEach((category) => {
    const button = document.createElement('button');
    button.className = `tab${STATE.current === category ? ' active' : ''}`;
    button.textContent = CATEGORY_LABELS[category] || category;
    button.onclick = () => {
      STATE.current = category;
      renderTabs();
      renderMessages();
    };
    tabs.appendChild(button);
  });
}

function selectedMessages() {
  if (!STATE.data) return [];
  if (STATE.current === 'favourite') {
    return getFavouriteMessages().map((message) => ({ ...message, category: 'favourite', fav: true }));
  }
  const all = flattenMessages(STATE.data);
  if (STATE.current === 'all') return all.filter((message) => message.category !== 'archive').slice(0, 60);
  return all.filter((message) => message.category === STATE.current);
}

function messageKey(message) {
  return message.id || `${message.category}|${message.topic}|${message.content}`;
}

function renderMessages() {
  const grid = $('messageGrid');
  const used = getStore(STORAGE_KEYS.usage, {});
  const favourites = getStore(STORAGE_KEYS.favourites, {});
  const items = selectedMessages();
  grid.innerHTML = '';
  if (!items.length) {
    grid.innerHTML = '<div class="loading">暫時未有內容。</div>';
    return;
  }
  items.forEach((message) => {
    const key = messageKey(message);
    const isFavourite = Boolean(favourites[key]) || message.fav;
    const isUsed = Boolean(used[key]);
    const card = document.createElement('article');
    card.className = `card${message.daily ? ' daily' : ''}${isFavourite ? ' fav' : ''}`;
    card.innerHTML = `<div>
      <div class="meta"><span class="pill">${CATEGORY_LABELS[message.category] || message.category}</span>${message.daily ? '<span class="pill today">今日新增</span>' : ''}</div>
      <div class="topic">${message.topic || ''}</div>
      <div class="content">${message.content || ''}</div>
      ${isUsed ? `<div class="usage">已 Copy ${used[key]?.count || 1} 次</div>` : ''}
    </div>
    <div class="card-actions">
      <button class="btn" data-copy>📋 Copy</button>
      <button class="btn secondary" data-fav>${isFavourite ? '❤️ 已收藏' : '♡ Favourite'}</button>
    </div>`;
    grid.appendChild(card);
    card.querySelector('[data-copy]').onclick = () => copyLegacyMessage(message, key, card.querySelector('[data-copy]'));
    card.querySelector('[data-fav]').onclick = () => toggleFavourite(message, key);
  });
}

function copyLegacyMessage(message, key, button) {
  navigator.clipboard.writeText(message.content || '').then(() => {
    const used = getStore(STORAGE_KEYS.usage, {});
    used[key] = {
      ...message,
      lastCopied: new Date().toISOString(),
      count: (used[key]?.count || 0) + 1
    };
    setStore(STORAGE_KEYS.usage, used);
    button.textContent = '✅ 已 Copy';
    setTimeout(renderMessages, 700);
  }).catch(() => alert('未能使用 Clipboard，請手動複製。'));
}

function toggleFavourite(message, key) {
  const favourites = getStore(STORAGE_KEYS.favourites, {});
  if (favourites[key]) delete favourites[key];
  else favourites[key] = { ...message, savedAt: new Date().toISOString() };
  setStore(STORAGE_KEYS.favourites, favourites);
  renderMessages();
  renderRelationshipMessages();
}

function activeProfile() {
  const value = $('memberSelector').value;
  if (value.startsWith('group:')) {
    return { id: value, displayName: value.slice(6), isGroup: true, communicationStyle: $('toneSelector').value };
  }
  return STATE.members.find((member) => member.id === value) || {};
}

function splitList(value, maximum = 8) {
  return String(value || '').split(/[,，]/).map((item) => item.trim()).filter(Boolean).slice(0, maximum);
}

function renderMemberOptions(selectedValue = '') {
  const selector = $('memberSelector');
  selector.replaceChildren(new Option('General', ''));
  STATE.members.forEach((member) => {
    selector.add(new Option(member.nickname || member.displayName || member.id, member.id));
  });
  [...new Set(STATE.members.map((member) => member.group).filter(Boolean))].sort().forEach((group) => {
    selector.add(new Option(`會員群組：${group}`, `group:${group}`));
  });
  selector.value = [...selector.options].some((option) => option.value === selectedValue) ? selectedValue : '';
}

function clearMemberForm() {
  $('memberForm').reset();
  $('memberId').value = '';
  $('memberAttendance').value = 'unknown';
  $('memberStyle').value = 'warm';
}

function populateMemberForm() {
  const value = $('memberSelector').value;
  if (!value || value.startsWith('group:')) {
    clearMemberForm();
    return;
  }
  const member = STATE.members.find((item) => item.id === value);
  if (!member) return;
  $('memberId').value = member.id;
  $('memberDisplayName').value = member.displayName || '';
  $('memberNickname').value = member.nickname || '';
  $('memberGroup').value = member.group || '';
  $('memberTrainingDay').value = member.trainingDay || '';
  $('memberTrainingTime').value = member.usualTrainingTime || '';
  $('memberStyle').value = member.communicationStyle || 'warm';
  $('memberFocus').value = (member.fitnessFocus || []).join(', ');
  $('memberIssues').value = (member.commonIssues || []).join(', ');
  $('memberAttendance').value = member.recentAttendance || 'unknown';
  $('memberEmoji').value = (member.favouriteEmoji || []).join(' ');
  $('memberNotes').value = member.notes || '';
}

function saveMemberProfile(event) {
  event.preventDefault();
  const existingId = $('memberId').value;
  const id = existingId || globalThis.crypto?.randomUUID?.() || `member-${Date.now()}`;
  const member = {
    id,
    displayName: $('memberDisplayName').value.trim(),
    nickname: $('memberNickname').value.trim(),
    group: $('memberGroup').value.trim(),
    trainingDay: $('memberTrainingDay').value.trim(),
    usualTrainingTime: $('memberTrainingTime').value.trim(),
    communicationStyle: $('memberStyle').value,
    fitnessFocus: splitList($('memberFocus').value),
    commonIssues: splitList($('memberIssues').value),
    recentAttendance: $('memberAttendance').value,
    lastMessageType: '',
    lastMessageDate: null,
    favouriteEmoji: $('memberEmoji').value.trim().split(/\s+/).filter(Boolean).slice(0, 5),
    notes: $('memberNotes').value.trim()
  };
  if (!member.displayName) return;
  const index = STATE.members.findIndex((item) => item.id === id);
  if (index >= 0) STATE.members.splice(index, 1, member);
  else STATE.members.push(member);
  setStore(STORAGE_KEYS.members, STATE.members);
  renderMemberOptions(id);
  populateMemberForm();
}

function deleteSelectedMember() {
  const id = $('memberSelector').value;
  if (!id || id.startsWith('group:')) return;
  const member = STATE.members.find((item) => item.id === id);
  if (!member || !confirm(`刪除會員「${member.nickname || member.displayName}」？已生成訊息同 tracking 會保留。`)) return;
  STATE.members = STATE.members.filter((item) => item.id !== id);
  setStore(STORAGE_KEYS.members, STATE.members);
  renderMemberOptions();
  clearMemberForm();
}

function relationshipKey(message) {
  return message.id || `relationship|${message.text}`;
}

function relationshipDataStatus() {
  if (!STATE.context?.verified) return '今日即時資料未能確認 · Evergreen fallback';
  return `Weather verified · ${STATE.context.status === 'fresh' ? 'Fresh' : 'Stale'}`;
}

function renderRelationshipStatus() {
  const context = STATE.context;
  const sourceUrl = safeSourceUrl(context?.source?.url);
  const source = sourceUrl
    ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(context.source.name)}</a>`
    : '未確認';
  $('relationshipStatus').innerHTML = `
    <strong>${relationshipDataStatus()}</strong>
    <span>來源：${source}</span>
    <span>Fetch：${context?.fetchedAt ? new Date(context.fetchedAt).toLocaleString('zh-HK') : '—'}</span>
    <span>Published：${context?.publishedAt ? new Date(context.publishedAt).toLocaleString('zh-HK') : '—'}</span>`;
}

function filteredGenerated() {
  const type = $('relationshipType').value;
  return STATE.generated.filter((message) => !type || message.type === type);
}

function renderRelationshipMessages() {
  const grid = $('relationshipGrid');
  const favourites = getStore(STORAGE_KEYS.favourites, {});
  const usage = getStore(STORAGE_KEYS.usage, {});
  const messages = filteredGenerated();
  if (!messages.length) {
    grid.innerHTML = '<p class="relationship-empty">按「生成 3–5 條」建立今日最佳草稿；原有訊息同歷史仍保留喺下面。</p>';
    return;
  }
  grid.innerHTML = messages.map((message) => {
    const key = relationshipKey(message);
    const sourceUrl = safeSourceUrl(message.source?.url);
    const source = sourceUrl
      ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(message.source.name)}</a>`
      : 'Evergreen';
    return `<article class="relationship-card" data-id="${message.id}">
      <div class="relationship-chips">
        <span>${escapeHtml(MESSAGE_TYPES[message.type] || message.type)}</span>
        <span>${escapeHtml(message.memberLabel || 'General')}</span>
        <span>${escapeHtml(message.mainTheme)}</span>
        <span>Human review pending</span>
      </div>
      <textarea aria-label="可編輯訊息">${escapeHtml(message.text)}</textarea>
      <div class="relationship-meta">
        <span>${message.dataStatus}</span><span>${source}</span>
        <span>Used ${usage[key]?.count || 0}</span>
        <span>Last copied ${usage[key]?.lastCopied ? new Date(usage[key].lastCopied).toLocaleString('zh-HK') : '—'}</span>
      </div>
      <div class="relationship-actions">
        <button class="btn" data-action="copy">📋 Copy</button>
        <button class="btn secondary" data-action="favourite">${favourites[key] ? '❤️ 已收藏' : '♡ Favourite'}</button>
        <button class="btn secondary" data-action="regenerate">Regenerate</button>
      </div>
    </article>`;
  }).join('');
}

function saveGeneratedState() {
  saveGenerated(localStorage, STATE.generated);
}

function generateRelationship({ replaceId = null } = {}) {
  const recent = [
    ...STATE.generated,
    ...flattenMessages(STATE.data || {}),
    ...getFavouriteMessages()
  ].slice(0, 80);
  const generated = generateMessages({
    profile: activeProfile(),
    context: STATE.context || {},
    schedule: { hasTrainingToday: $('trainingToday').checked },
    recent,
    tone: $('toneSelector').value,
    count: replaceId ? 3 : 5
  });
  if (replaceId && generated[0]) {
    const index = STATE.generated.findIndex((message) => message.id === replaceId);
    if (index >= 0) STATE.generated.splice(index, 1, generated[0]);
  } else {
    STATE.generated.unshift(...generated);
  }
  saveGeneratedState();
  renderRelationshipMessages();
}

async function refreshContext({ preferDaily = false } = {}) {
  $('refreshContext').disabled = true;
  const dailyContext = contextFromDailyData(STATE.data || {});
  STATE.context = preferDaily && dailyContext.verified ? dailyContext : await fetchHongKongContext();
  if (!STATE.context.verified && dailyContext.verified) STATE.context = dailyContext;
  setStore(STORAGE_KEYS.context, STATE.context);
  renderRelationshipStatus();
  $('refreshContext').disabled = false;
}

function initializeRelationshipControls() {
  STATE.members = getStore(STORAGE_KEYS.members, []);
  STATE.generated = loadGenerated(localStorage);
  recordMigration(localStorage);
  renderMemberOptions();
  $('relationshipType').innerHTML = '<option value="">全部類型</option>'
    + Object.entries(MESSAGE_TYPES).map(([key, label]) => `<option value="${key}">${label}</option>`).join('');
  $('relationshipType').onchange = renderRelationshipMessages;
  $('memberSelector').onchange = populateMemberForm;
  $('memberForm').onsubmit = saveMemberProfile;
  $('newMember').onclick = clearMemberForm;
  $('deleteMember').onclick = deleteSelectedMember;
  $('generateRelationship').onclick = () => generateRelationship();
  $('refreshContext').onclick = () => refreshContext();
  renderRelationshipMessages();
}

$('relationshipGrid').addEventListener('input', (event) => {
  const card = event.target.closest('[data-id]');
  if (!card || event.target.tagName !== 'TEXTAREA') return;
  const message = STATE.generated.find((item) => item.id === card.dataset.id);
  if (!message) return;
  message.text = event.target.value;
  message.content = event.target.value;
  message.editedAt = new Date().toISOString();
  saveGeneratedState();
});

$('relationshipGrid').addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  const card = event.target.closest('[data-id]');
  if (!button || !card) return;
  const message = STATE.generated.find((item) => item.id === card.dataset.id);
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
      renderRelationshipMessages();
    } catch {
      alert('未能使用 Clipboard，請手動複製。');
    }
  } else if (button.dataset.action === 'favourite') {
    toggleFavourite({ ...message, content: message.text }, key);
  } else if (button.dataset.action === 'regenerate') {
    generateRelationship({ replaceId: message.id });
  }
});

async function boot() {
  try {
    const response = await fetch(`../data/today.json?ts=${Date.now()}`);
    if (!response.ok) throw new Error('today.json not found');
    STATE.data = await response.json();
    renderBrief();
    renderTabs();
    renderMessages();
    initializeRelationshipControls();
    STATE.context = getStore(STORAGE_KEYS.context, contextFromDailyData(STATE.data));
    renderRelationshipStatus();
    const cachedAt = Date.parse(STATE.context?.fetchedAt || '');
    if (!cachedAt || Date.now() - cachedAt > 30 * 60 * 1000) await refreshContext({ preferDaily: true });
  } catch (error) {
    $('dailyBrief').innerHTML = '<div class="loading">載入失敗：請檢查 data/today.json。</div>';
    $('relationshipStatus').innerHTML = '<strong>今日即時資料未能確認</strong><span>只可使用 evergreen 草稿。</span>';
    console.error(error);
  }
}

$('resetFilter').onclick = () => {
  STATE.current = 'all';
  renderTabs();
  renderMessages();
};

document.documentElement.dataset.relationshipEngine = ENGINE_VERSION;
boot();
