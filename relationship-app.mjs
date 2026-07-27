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
} from './reminder/engine.mjs';
import {
  loadLatestAiosDailyContext,
  loadRuntimeFlag,
  prependScheduledDrafts
} from './aios-daily-context.mjs';

const STATE = {
  context: null,
  data: null,
  generated: [],
  members: [],
  dailyContextV1: false
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
    const isStoredAiosRecord = url.origin === window.location.origin
      && url.pathname.startsWith('/aios/');
    return url.protocol === 'https:' || isStoredAiosRecord ? url.href : '';
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
    // Keep the dashboard usable when browser storage is unavailable.
  }
}

function flattenMessages(data) {
  const messages = [];
  (data.dailySpecial || []).forEach((message) => messages.push(message));
  (data.jeffreyToday || []).forEach((message) => messages.push(message));
  Object.values(data.groups || {}).forEach((items) => items.forEach((message) => messages.push(message)));
  (data.weatherMessages || []).forEach((message) => messages.push(message));
  (data.archive || []).forEach((message) => messages.push(message));
  return messages;
}

function getFavouriteMessages() {
  return Object.values(getStore(STORAGE_KEYS.favourites, {}));
}

function activeProfile() {
  const value = $('memberSelector').value;
  if (value.startsWith('group:')) {
    return {
      id: value,
      displayName: value.slice(6),
      isGroup: true,
      communicationStyle: $('toneSelector').value
    };
  }
  return STATE.members.find((member) => member.id === value) || {};
}

function splitList(value, maximum = 8) {
  return String(value || '')
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maximum);
}

function renderMemberOptions(selectedValue = '') {
  const selector = $('memberSelector');
  selector.replaceChildren(new Option('General', ''));
  STATE.members.forEach((member) => {
    selector.add(new Option(member.nickname || member.displayName || member.id, member.id));
  });
  [...new Set(STATE.members.map((member) => member.group).filter(Boolean))]
    .sort()
    .forEach((group) => selector.add(new Option(`會員群組：${group}`, `group:${group}`)));
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
    lastMessageDate: '',
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
    <strong>${escapeHtml(relationshipDataStatus())}</strong>
    <span>來源：${source}</span>
    <span>Fetch：${context?.fetchedAt ? new Date(context.fetchedAt).toLocaleString('zh-HK') : '—'}</span>
    <span>Published：${context?.publishedAt ? new Date(context.publishedAt).toLocaleString('zh-HK') : '—'}</span>`;
}

function filteredGenerated() {
  const type = $('relationshipType').value;
  return STATE.generated.filter((message) => !type || message.type === type);
}

function renderRelationshipMessages() {
  const favourites = getStore(STORAGE_KEYS.favourites, {});
  const usage = getStore(STORAGE_KEYS.usage, {});
  const messages = filteredGenerated();
  if (!messages.length) {
    $('relationshipGrid').innerHTML = '<p class="relationship-empty">按「生成 3–5 條」建立今日最佳草稿；原有訊息同歷史仍保留喺下面。</p>';
    return;
  }
  $('relationshipGrid').innerHTML = messages.map((message) => {
    const key = relationshipKey(message);
    const sourceUrl = safeSourceUrl(message.source?.url);
    const source = sourceUrl
      ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(message.source.name)}</a>`
      : 'Evergreen';
    return `<article class="relationship-card" data-id="${escapeHtml(message.id)}">
      <div class="relationship-chips">
        <span>${escapeHtml(MESSAGE_TYPES[message.type] || message.type)}</span>
        <span>${escapeHtml(message.memberLabel || 'General')}</span>
        <span>${escapeHtml(message.mainTheme)}</span>
        <span>Human review pending</span>
      </div>
      <textarea aria-label="可編輯訊息">${escapeHtml(message.text)}</textarea>
      <div class="relationship-meta">
        <span>${escapeHtml(message.dataStatus)}</span><span>${source}</span>
        <span>Generated ${new Date(message.generatedAt).toLocaleString('zh-HK')}</span>
        <span>Used ${usage[key]?.count || 0}</span>
        <span>Last copied ${usage[key]?.lastCopied ? new Date(usage[key].lastCopied).toLocaleString('zh-HK') : '—'}</span>
      </div>
      <div class="relationship-actions">
        <button class="btn" data-action="copy" type="button">📋 Copy</button>
        <button class="btn secondary" data-action="favourite" type="button">${favourites[key] ? '❤️ 已收藏' : '♡ Favourite'}</button>
        <button class="btn secondary" data-action="regenerate" type="button">Regenerate</button>
      </div>
    </article>`;
  }).join('');
}

function saveGeneratedState() {
  saveGenerated(localStorage, STATE.generated);
}

function generateRelationship({ replaceId = null } = {}) {
  const generated = generateMessages({
    profile: activeProfile(),
    context: STATE.context || {},
    schedule: { hasTrainingToday: $('trainingToday').checked },
    recent: [
      ...STATE.generated,
      ...flattenMessages(STATE.data || {}),
      ...getFavouriteMessages()
    ].slice(0, 80),
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
  try {
    if (STATE.dailyContextV1) {
      const scheduled = await loadLatestAiosDailyContext();
      STATE.context = scheduled.context;
      STATE.generated = prependScheduledDrafts(STATE.generated, scheduled.messages);
      renderRelationshipMessages();
      renderRelationshipStatus();
      return;
    }
    const dailyContext = contextFromDailyData(STATE.data || {});
    STATE.context = preferDaily && dailyContext.verified ? dailyContext : await fetchHongKongContext();
    if (!STATE.context.verified && dailyContext.verified) STATE.context = dailyContext;
    setStore(STORAGE_KEYS.context, STATE.context);
    renderRelationshipStatus();
  } finally {
    $('refreshContext').disabled = false;
  }
}

function initializeControls() {
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
      window.dispatchEvent(new CustomEvent('jeffrey-tracking-updated'));
    } catch {
      alert('未能使用 Clipboard，請手動複製。');
    }
  } else if (button.dataset.action === 'favourite') {
    const favourites = getStore(STORAGE_KEYS.favourites, {});
    if (favourites[key]) delete favourites[key];
    else favourites[key] = { ...message, content: message.text, savedAt: new Date().toISOString() };
    setStore(STORAGE_KEYS.favourites, favourites);
    renderRelationshipMessages();
    window.dispatchEvent(new CustomEvent('jeffrey-tracking-updated'));
  } else if (button.dataset.action === 'regenerate') {
    generateRelationship({ replaceId: message.id });
  }
});

async function boot() {
  initializeControls();
  try {
    const response = await fetch(`data/today.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`today.json HTTP ${response.status}`);
    STATE.data = await response.json();
    STATE.dailyContextV1 = await loadRuntimeFlag();
    if (STATE.dailyContextV1) {
      try {
        const scheduled = await loadLatestAiosDailyContext();
        STATE.context = scheduled.context;
        STATE.generated = prependScheduledDrafts(STATE.generated, scheduled.messages);
        renderRelationshipMessages();
        renderRelationshipStatus();
        return;
      } catch (error) {
        console.warn('AIOS Daily Context fallback:', error);
      }
    }
    STATE.context = getStore(STORAGE_KEYS.context, contextFromDailyData(STATE.data));
    renderRelationshipStatus();
    const cachedAt = Date.parse(STATE.context?.fetchedAt || '');
    if (!cachedAt || Date.now() - cachedAt > 30 * 60 * 1000) {
      await refreshContext({ preferDaily: true });
    }
  } catch (error) {
    STATE.context = {
      verified: false,
      status: 'failed',
      fetchedAt: new Date().toISOString(),
      source: null
    };
    renderRelationshipStatus();
    console.error('Relationship Engine:', error);
  }
}

document.documentElement.dataset.relationshipEngine = ENGINE_VERSION;
boot();
