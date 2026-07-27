export const ENGINE_VERSION = '4.0.0';

export const STORAGE_KEYS = Object.freeze({
  generated: 'jeffreyRelationshipMessages',
  favourites: 'jeffreyFavourites',
  usage: 'jeffreyUsage',
  members: 'jeffreyRelationshipMembers',
  context: 'jeffreyRelationshipContext',
  migration: 'jeffreyRelationshipMigrationV1'
});

export const MESSAGE_TYPES = Object.freeze({
  checkin: 'Check-in',
  context: 'Daily Context',
  coach: 'Coach Reminder',
  personal: 'Personal',
  motivation: 'Motivation',
  observation: 'Observation',
  celebration: 'Celebration'
});

export const VOICE_RULES = Object.freeze({
  minLength: 8,
  maxLength: 70,
  forbidden: [
    '建議大家', '建議你', '此外', '因此', '同時', '為了', '進行', '維持身體機能',
    '有助於', '適量', '保持健康', '請注意', '運動人士', '身體狀況',
    '提升訓練表現', '避免造成', '適當補充', '持續進行', '今天', '您'
  ],
  ambiguous: [
    '突然諗起你', '好耐冇同你吹兩句', '我喺度等你', '留返啲力畀我',
    '掛住你', '你係最特別', '我同你之間'
  ],
  inferredState: [
    '你今日好似好攰', '見你今日精神麻麻', '你今日心情唔好', '你最近壓力好大'
  ],
  professionalAnchor: /操|訓練|上堂|熱身|動作|姿勢|節奏|呼吸|出力|進度|目標|膊頭|髖|飲|水|郁|安全|恢復|力/
});

const HKO_SOURCE = Object.freeze({
  name: '香港天文台',
  url: 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc'
});

const TEMPLATES = Object.freeze({
  hot: [
    ['今日真係焗到癲🥵 未口渴都飲兩啖水先，嚟到慢慢操。', 'context'],
    ['今日咁熱，放工過嚟唔使急。飲啖水先，我幫你睇住個節奏。', 'context'],
    ['出面好焗呀😆 今晚留返啲力，我哋慢慢加。', 'context'],
    ['今日熱到行兩步都出汗😂 嚟操嗰陣慢慢熱身就得。', 'context'],
    ['今晚見呀💪 今日咁焗，唔使一開波就衝，我幫你睇。', 'coach'],
    ['未口渴都飲兩啖水先啦😆 今日咁熱，慢慢嚟最穩陣。', 'coach']
  ],
  rain: [
    ['出面落緊大雨☔ 今晚唔好趕，安全到就得，到咗我哋先慢慢熱身。', 'context'],
    ['今日啲雨幾麻煩，過嚟嗰陣慢慢行，安全最緊要👍', 'context'],
    ['放工如果仲落得大，唔使急住衝過嚟，安全到先開始操。', 'context'],
    ['今晚見呀☔ 鞋濕咗嚟到抖一抖先，我哋慢慢開始。', 'coach'],
    ['出面大雨呀，今日最緊要唔好趕。安全到咗再熱身👍', 'checkin'],
    ['今日交通可能慢啲，預鬆少少，上堂唔使心急。', 'context']
  ],
  training: [
    ['今日返工忙唔忙呀？😆 今晚過嚟唔使急，慢慢熱身就得。', 'checkin'],
    ['食咗飯未呀？今晚留返少少力，我哋慢慢加💪', 'checkin'],
    ['今晚見呀，嚟到先慢慢熱身，我幫你睇住。', 'coach'],
    ['一做重啲就好易忍住口氣，今晚出力嗰下記住呼氣。', 'coach'],
    ['今日有冇偷懶呀😏 今晚我哋專心做好動作。', 'personal'],
    ['今日有嚟已經贏咗啦💪 唔使急住做到盡。', 'motivation'],
    ['放工攰都唔使死頂，嚟到我哋慢慢搵返個節奏先。', 'motivation'],
    ['今日坐足成日？嚟到先郁下膊頭同髖，個人會鬆好多。', 'coach']
  ],
  desk: [
    ['今日坐足成日？得閒郁下膊頭，今晚嚟到再慢慢鬆。', 'checkin'],
    ['放工前企起身郁兩下先啦😆 坐到實晒就唔好死頂。', 'coach'],
    ['今日忙唔忙呀？坐耐咗就郁下髖，幾下都算數。', 'checkin'],
    ['成日對住電腦，膊頭好易縮埋。今晚我幫你睇動作。', 'observation'],
    ['最近好多人坐耐咗連呼吸都淺埋😂 得閒抖兩啖氣先。', 'observation'],
    ['今日做多少少活動都算數，唔使一嚟就操到盡。', 'motivation']
  ],
  reconnect: [
    ['最近少見你上堂呀，想郁返就同我講，我哋慢慢接返個節奏。', 'checkin'],
    ['近排訓練點呀？得閒覆我一句，我幫你執返個節奏。', 'checkin'],
    ['一排冇一齊操，唔使急住追返。下次我哋由動作質素開始。', 'motivation'],
    ['最近忙都唔緊要，上堂時間想點調可以同我講。', 'personal'],
    ['忙緊都唔緊要，得閒郁兩下先。想操返我幫你安排。', 'coach'],
    ['想操返嗰陣話我知，我哋先定一個易做到嘅目標。', 'checkin']
  ],
  evergreen: [
    ['今日返工忙唔忙呀？😆 得閒飲兩啖水先。', 'checkin'],
    ['今日有冇偷懶呀😏 郁到少少都算數。', 'personal'],
    ['唔使做得完美，慢慢做返個訓練節奏先。', 'motivation'],
    ['今日辛苦喇。放工得閒就郁下，個人會舒服啲。', 'checkin'],
    ['最近好多人一做重啲就唔記得呼吸😂 出力嗰下呼氣呀。', 'observation'],
    ['今日操多少少都算數，加油呀💪', 'motivation'],
    ['今日忙完未呀？唔使急，有空先郁下。', 'checkin'],
    ['如果個人攰就唔使死頂，訓練慢慢嚟就得。', 'coach']
  ]
});

function lengthOf(text) {
  return [...text.replace(/\s/g, '')].length;
}

export function voiceLock(text, facts = {}) {
  const failures = [];
  const length = lengthOf(text);
  if (length < VOICE_RULES.minLength || length > VOICE_RULES.maxLength) failures.push('length');
  if (VOICE_RULES.forbidden.some((phrase) => text.includes(phrase))) failures.push('written_or_ai_phrase');
  if (!/[呀啦喎啲咗嚟唔冇畀喇]|今晚|今日|慢慢/.test(text)) failures.push('not_hong_kong_cantonese');
  if ((text.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length > 2) failures.push('too_many_emoji');
  if (facts.claimsRealtime && !facts.verified) failures.push('unverified_realtime_claim');
  if (facts.requiresProgress && !facts.hasProgress) failures.push('invented_progress');
  if (VOICE_RULES.ambiguous.some((phrase) => text.includes(phrase))) failures.push('relationship_boundary');
  if (VOICE_RULES.inferredState.some((phrase) => text.includes(phrase)) && !facts.observedTrainingState) {
    failures.push('inferred_personal_state');
  }
  if (!VOICE_RULES.professionalAnchor.test(text)) failures.push('missing_professional_anchor');
  return { pass: failures.length === 0, failures, length };
}

export function scoreCandidate(candidate, profile = {}, recent = []) {
  const lock = voiceLock(candidate.text, candidate.facts);
  const duplicate = recent.some((item) => (item.text || item.content) === candidate.text);
  const name = profile.nickname || profile.displayName;
  const scores = {
    hongKongNaturalness: lock.pass ? 5 : 2,
    jeffreyVoiceMatch: lock.pass ? 5 : 2,
    warmth: /我哋|我幫你|辛苦|安全|慢慢|唔使急|加油/.test(candidate.text) ? 5 : 4,
    personalisation: name && candidate.text.includes(name) ? 5 : profile.id ? 4 : 3,
    dailyRelevance: candidate.facts?.claimsRealtime ? 5 : 4,
    replyPotential: /[？?]|忙唔忙|食咗飯未|有冇|點呀/.test(candidate.text) ? 5 : 4,
    clarity: candidate.text.length <= 90 ? 5 : 3,
    factualSafety: lock.failures.some((failure) => ['unverified_realtime_claim', 'invented_progress'].includes(failure)) ? 0 : 5,
    repetitionRisk: duplicate ? 0 : 5
  };
  const passes = lock.pass
    && scores.hongKongNaturalness >= 4
    && scores.jeffreyVoiceMatch >= 4
    && scores.warmth >= 4
    && scores.factualSafety === 5
    && scores.repetitionRisk >= 4;
  return { ...candidate, scores, hardFail: !lock.pass, passes };
}

function personalise(text, profile = {}, tone = 'warm') {
  const name = profile.nickname || profile.displayName;
  let output = name && !profile.isGroup && tone !== 'short' && lengthOf(text) < 62 ? `${name}，${text}` : text;
  if (tone === 'calm') output = output.replaceAll('😆', '').replaceAll('😂', '').replaceAll('😏', '');
  if (tone === 'playful' && !/[\u{1F300}-\u{1FAFF}]/u.test(output)) output += '😆';
  return output.trim();
}

function selectTheme({ profile = {}, context = {}, schedule = {} }) {
  if (context.verified && context.kind === 'rain') return 'rain';
  if (context.verified && context.kind === 'hot') return 'hot';
  if (schedule.hasTrainingToday) return 'training';
  if (profile.recentAttendance === 'less_frequent') return 'reconnect';
  if ((profile.commonIssues || []).includes('long_sitting')) return 'desk';
  return 'evergreen';
}

export function generateMessages({
  profile = {}, context = {}, schedule = {}, recent = [], tone = profile.communicationStyle || 'warm',
  count = 5, now = new Date()
} = {}) {
  const theme = selectTheme({ profile, context, schedule });
  const candidates = [...TEMPLATES[theme], ...TEMPLATES.evergreen]
    .slice(0, 10)
    .map(([template, type], index) => scoreCandidate({
      id: globalThis.crypto?.randomUUID?.() || `${now.getTime()}-${index}`,
      text: personalise(template, profile, tone),
      content: personalise(template, profile, tone),
      topic: `Relationship Engine｜${MESSAGE_TYPES[type]}`,
      category: type,
      type,
      memberId: profile.id || null,
      memberLabel: profile.isGroup ? `會員群組：${profile.displayName}` : profile.nickname || profile.displayName || 'General',
      mainTheme: theme,
      dataStatus: context.verified ? 'verified' : 'fallback',
      source: context.verified ? context.source : null,
      generatedAt: now.toISOString(),
      approvalStatus: 'pending',
      engineVersion: ENGINE_VERSION,
      facts: {
        claimsRealtime: ['hot', 'rain'].includes(theme),
        verified: Boolean(context.verified),
        requiresProgress: type === 'celebration',
        hasProgress: Boolean(profile.progress)
      }
    }, profile, recent))
    .filter((candidate) => candidate.passes)
    .sort((a, b) => {
      if (tone === 'coach') {
        const coachRank = Number(b.type === 'coach' || b.type === 'observation') - Number(a.type === 'coach' || a.type === 'observation');
        if (coachRank) return coachRank;
      }
      if (tone === 'short') {
        const lengthRank = lengthOf(a.text) - lengthOf(b.text);
        if (lengthRank) return lengthRank;
      }
      return Object.values(b.scores).reduce((sum, score) => sum + score, 0)
        - Object.values(a.scores).reduce((sum, score) => sum + score, 0);
    });
  const limit = Math.min(5, Math.max(3, count));
  const selected = [];
  const seenTypes = new Set();
  for (const candidate of candidates) {
    if (seenTypes.has(candidate.type)) continue;
    selected.push(candidate);
    seenTypes.add(candidate.type);
    if (selected.length === limit) return selected;
  }
  for (const candidate of candidates) {
    if (selected.includes(candidate)) continue;
    selected.push(candidate);
    if (selected.length === limit) break;
  }
  return selected;
}

export function contextFromDailyData(data, now = new Date()) {
  const weather = data?.weatherContext || {};
  const publishedAt = weather.updateTime || weather.sourceTimestamp || null;
  const publishedMs = publishedAt ? Date.parse(publishedAt) : NaN;
  const age = now.getTime() - publishedMs;
  const fresh = publishedAt && !Number.isNaN(publishedMs) && age >= -5 * 60 * 1000 && age <= 3 * 60 * 60 * 1000;
  const summary = `${weather.summary || ''} ${(data?.lifePulse || '')}`.trim();
  return {
    verified: Boolean(fresh && weather.source === '香港天文台' && weather.sourceUrl),
    kind: /暴雨|雷暴|大雨/.test(summary) ? 'rain' : /酷熱|熱夜|33|34|35/.test(summary) ? 'hot' : 'normal',
    source: weather.sourceUrl ? { name: weather.source, url: weather.sourceUrl } : null,
    fetchedAt: now.toISOString(),
    publishedAt,
    verifiedAt: fresh ? now.toISOString() : null,
    dataType: 'weather',
    confidence: fresh ? 1 : 0,
    status: fresh ? 'fresh' : 'stale'
  };
}

export async function fetchHongKongContext(fetchImpl = fetch, now = new Date()) {
  const fallback = {
    verified: false, kind: 'evergreen', source: HKO_SOURCE, fetchedAt: now.toISOString(),
    publishedAt: null, verifiedAt: null, dataType: 'weather', confidence: 0, status: 'failed'
  };
  try {
    const response = await fetchImpl(HKO_SOURCE.url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HKO ${response.status}`);
    const data = await response.json();
    const publishedAt = data.updateTime || null;
    const publishedMs = publishedAt ? Date.parse(publishedAt) : NaN;
    const age = now.getTime() - publishedMs;
    if (!publishedAt || Number.isNaN(publishedMs) || age < -5 * 60 * 1000 || age > 3 * 60 * 60 * 1000) {
      return { ...fallback, status: 'stale', publishedAt };
    }
    const temperatures = (data.temperature?.data || []).map((item) => Number(item.value)).filter(Number.isFinite);
    const rainfall = (data.rainfall?.data || []).map((item) => Number(item.max)).filter(Number.isFinite);
    const warnings = Array.isArray(data.warningMessage) ? data.warningMessage.filter((item) => typeof item === 'string') : [];
    const maxTemperature = temperatures.length ? Math.max(...temperatures) : null;
    const maxRainfall = rainfall.length ? Math.max(...rainfall) : 0;
    const kind = warnings.some((warning) => /暴雨|雷暴/.test(warning)) || maxRainfall >= 10
      ? 'rain'
      : warnings.some((warning) => /酷熱|熱夜/.test(warning)) || maxTemperature >= 33 ? 'hot' : 'normal';
    return {
      ...fallback, verified: true, kind, status: 'fresh', publishedAt, verifiedAt: now.toISOString(),
      confidence: 1, facts: { maxTemperature, maxRainfall, warnings }
    };
  } catch (error) {
    return { ...fallback, error: error instanceof Error ? error.message : 'Fetch failed' };
  }
}

export function loadGenerated(storage) {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEYS.generated) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveGenerated(storage, messages) {
  storage.setItem(STORAGE_KEYS.generated, JSON.stringify(messages));
}

export function recordMigration(storage) {
  const favourites = JSON.parse(storage.getItem(STORAGE_KEYS.favourites) || '{}');
  const usage = JSON.parse(storage.getItem(STORAGE_KEYS.usage) || '{}');
  const receipt = {
    version: ENGINE_VERSION,
    favouritesPreserved: Object.keys(favourites).length,
    usagePreserved: Object.keys(usage).length,
    legacyKeysPreserved: true,
    completedAt: new Date().toISOString()
  };
  storage.setItem(STORAGE_KEYS.migration, JSON.stringify(receipt));
  return receipt;
}
