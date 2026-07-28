const DEFAULT_BASE_URL = '/aios/modules/jeffrey/';

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${url} HTTP ${response.status}`);
  return response.json();
}

export async function loadRuntimeFlag(fetchImpl = fetch) {
  try {
    const config = await fetchJson('/Jeffrey/config/runtime.json', fetchImpl);
    return config.AIOS_DAILY_CONTEXT_V1 === true;
  } catch {
    return false;
  }
}

export function scheduledContextToDashboard(context) {
  const weather = context?.weather || {};
  const sourceUrl = weather.record_id || context?.source_records?.[0]?.record_url || '';
  const verified = weather.status === 'verified'
    && weather.freshness_score >= 60
    && weather.confidence_score >= 85;
  return {
    verified,
    status: verified && weather.freshness_score >= 85 ? 'fresh' : verified ? 'stale' : 'failed',
    contextStatus: context?.context_status || context?.validation?.status || 'unavailable',
    conditions: weather.conditions || '',
    temperatureC: weather.temperature_c,
    humidityPercent: weather.humidity_percent,
    warnings: weather.warnings || [],
    fetchedAt: weather.retrieval_timestamp || context?.generated_at || '',
    publishedAt: weather.source_timestamp || '',
    source: sourceUrl ? {
      name: weather.source_name || 'AIOS Daily Context Record',
      url: sourceUrl
    } : null,
    dailyContext: context
  };
}

export function catalogueToDashboardMessages(catalogue) {
  const categories = catalogue?.new_reminders || {};
  const contextItems = categories.weather_today || [];
  const categoryItems = Object.entries(categories)
    .filter(([category]) => category !== 'weather_today')
    .flatMap(([category, items]) => (items || []).map((item) => ({ ...item, category })));
  const mapped = [...contextItems, ...categoryItems].map((item) => ({
    id: item.id,
    text: item.text || item.content || '',
    content: item.text || item.content || '',
    type: item.message_type || item.type || ({
      daily_care: 'check_in',
      recovery_rest: 'motivation',
      weather_today: 'daily_context'
    }[item.category] || 'coach_reminder'),
    category: item.category || item.message_type || 'daily_care',
    memberLabel: item.audience_segment || 'General',
    mainTheme: item.main_theme || item.topic || 'Evergreen',
    dataStatus: item.context_status || (item.context_specific ? 'Verified context' : 'Evergreen'),
    generatedAt: item.generated_at || catalogue.generated_at || new Date().toISOString(),
    status: 'draft_human_approval_required',
    approval: 'pending',
    source: item.source_url ? {
      name: item.source_line || 'AIOS stored record',
      url: item.source_url
    } : null,
    scheduledDraft: true
  })).filter((item) => item.id && item.text);
  if (contextItems.length) return mapped.slice(0, 5);
  if (Array.isArray(categories.daily_five)) return mapped.slice(0, 5);
  const selected = [];
  const usedCategories = new Set();
  for (const message of mapped) {
    if (usedCategories.has(message.category)) continue;
    selected.push(message);
    usedCategories.add(message.category);
    if (selected.length === 5) break;
  }
  return selected;
}

export async function loadLatestAiosDailyContext({
  fetchImpl = fetch,
  baseUrl = DEFAULT_BASE_URL
} = {}) {
  const latest = await fetchJson(`${baseUrl}latest.json?ts=${Date.now()}`, fetchImpl);
  const [context, catalogue] = await Promise.all([
    fetchJson(latest.daily_context_url, fetchImpl),
    fetchJson(latest.daily_catalogue_url, fetchImpl)
  ]);
  catalogue.generated_at ||= latest.generated_at;
  return {
    context: scheduledContextToDashboard(context),
    messages: catalogueToDashboardMessages(catalogue),
    catalogue,
    latest
  };
}

export function prependScheduledDrafts(existing, incoming) {
  const seen = new Set();
  return [...incoming, ...existing].filter((item) => {
    const key = item.id || item.text;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
