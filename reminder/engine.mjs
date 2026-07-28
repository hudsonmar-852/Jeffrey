export const ENGINE_VERSION = '5.0.0';

export const STORAGE_KEYS = Object.freeze({
  favourites: 'jeffreyCuratorFavourites',
  usage: 'jeffreyCuratorUsage',
  approvals: 'jeffreyCuratorApprovals',
  migration: 'jeffreyCuratorMigrationV2'
});

export const REVIEWER_WEIGHTS = Object.freeze({
  human_warmth: 0.25,
  hong_kong_cantonese: 0.20,
  gym_client_value: 0.20,
  everyday_usefulness: 0.15,
  jeffrey_voice: 0.10,
  reply_likelihood: 0.05,
  novelty: 0.05
});

export const HARD_REJECTION_TERMS = Object.freeze([
  'cta', 'source', 'verify', 'aios', 'report', 'approve', 'confidence', 'review', 'workflow',
  '溫馨提示', '今日提提你', '大家記得', '各位', '請注意',
  '天文台', '氣溫', '天氣報告', '警告信號', '最新資訊', '政府公布'
]);

const CANDIDATE_TEXTS = Object.freeze([
  '坐咗一輪就起身行兩步啦，膊頭都順便鬆一鬆。',
  '飲兩啖水先啦，唔好等到口乾先醒起。',
  '今日操嗰陣唔使一開波就衝，慢慢熱身先。',
  '出力嗰下記住呼氣，成個動作會順好多。',
  '今晚早少少瞓啦，聽日個人會精神啲。',
  '返到 Gym 唔使急，抖順條氣先開始都未遲。',
  '坐耐咗個髖好易實，企起身郁幾下先啦。',
  '膊頭唔好成日縮埋，得閒放低少少啦。',
  '今日如果攰就收一收力，做得穩陣先最緊要。',
  '操完唔好即刻走，慢慢行兩分鐘先抖返順。',
  '食飯前飲幾啖水啦，成日忙到唔記得就最易乾。',
  '望電腦望得耐就望遠一陣，對眼都要抖下。',
  '行路嗰陣放鬆膊頭啦，唔使一路抽住。',
  '今日練動作先啦，重量唔使次次都加。',
  '瞓前放低電話一陣啦，畀個腦慢慢靜返落嚟。',
  '等𨋢嗰陣企直少少，腰背會舒服啲。',
  '開始操之前郁下手腕腳腕，幾十秒就夠。',
  '今日飲咗幾多水呀？而家飲兩啖先啦。',
  '呼吸唔順就停一停，唔使夾硬做埋落去。',
  '坐低嗰陣雙腳踩實地下，個人會穩好多。',
  '今日唔使做到盡，留少少力畀身體恢復啦。',
  '沖完涼做兩下輕鬆伸展，唔使拉到痛。',
  '搭車嗰陣唔好一路寒背，間中坐直一下啦。',
  '操之前記得食返少少嘢，空住個肚唔好死頂。',
  '今日上落樓梯慢少少，膝頭對正腳尖就得。',
  '拎重嘢之前企穩先，唔好一邊扭身一邊抽起。',
  '成朝坐住就去斟杯水啦，順便行返幾步。',
  '頸緊就輕輕轉下頭，唔使大力扯。',
  '今晚操完記得食返餐正經嘢，畀身體慢慢補返。',
  '覺得動作亂就放慢少少，穩返先再加。',
  '排隊嗰陣換下重心啦，唔好成個人側埋一邊。',
  '忙到呼吸都急就停十秒，慢慢呼兩啖氣先。',
  '今日對住電話耐咗，拎高少少啦，條頸冇咁攰。',
  '著鞋前郁兩下腳趾啦，對腳都醒一醒。',
  '操完第二日有少少攰好正常，今日輕輕郁下就得。',
  '夜晚口渴就飲幾啖水，唔使一次過飲太多。',
  '企得耐就屈伸下膝頭啦，唔好鎖實成個人。',
  '拎水樽放喺眼前啦，見到自然會記得飲。',
  '今日熱身畀多兩分鐘自己，之後會做得順啲。',
  '收工返屋企行慢兩步啦，畀個人轉返落休息節奏。'
]);

const CONTEXT_TEXTS = Object.freeze({
  warning: [
    '出面情況有變，今日唔好趕，安全到就得。',
    '今日行程留鬆少少，有改動都唔使急。',
    '出門前望一眼最新安排，穩穩陣陣就得。',
    '今晚如果要過嚟，安全行先，遲少少冇問題。',
    '今日最緊要安全，其他安排慢慢調都得。'
  ],
  rain: [
    '今日有雨，出門記得帶把遮呀☔',
    '出面落雨，今晚過嚟唔使趕，安全到就得。',
    '今日條路可能慢啲，預鬆少少時間啦。',
    '落雨地滑，行慢兩步就得。',
    '今晚有雨嘅話，到咗我哋先慢慢開始。'
  ],
  heat: [
    '今日咁熱，出門前飲兩啖水先啦。',
    '天氣焗，今晚嚟到我哋慢慢熱身先。',
    '今日戶外行得多，支水放近少少啦。',
    '咁熱唔使一開始就衝，慢慢入返節奏。',
    '今晚操之前飲兩啖水，我哋做穩先。'
  ],
  transport: [
    '今日交通有改動，出發前望一眼路線先啦。',
    '如果要經受影響嗰頭，預多少少時間就得。',
    '今晚過嚟唔使卡得太準，安全到就得。',
    '出門前睇清楚安排，唔使去到先急。',
    '今日條路可能慢啲，慢慢嚟就得。'
  ]
});

function normaliseText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function localDate(now) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong' }).format(now);
}

function sourceText(source) {
  return [
    source.summary,
    source.title,
    source.conditions,
    source.warning,
    source.content
  ].filter(Boolean).join(' ');
}

export function fuseSourceTopic(validation) {
  const sources = validation.accepted || [];
  const combined = sources.map(sourceText).join(' ');
  let key = 'evergreen';
  if (/警告|warning|颱風|暴雨|雷暴/i.test(combined)) key = 'warning';
  else if (/交通|港鐵|巴士|道路|transport|mtr/i.test(combined)) key = 'transport';
  else if (/雨|驟雨|rain/i.test(combined)) key = 'rain';
  else if (/酷熱|炎熱|高溫|hot|heat/i.test(combined)) key = 'heat';
  return {
    key,
    label: {
      warning: '今日安全同出行安排',
      transport: '今日交通同出行節奏',
      rain: '今日雨勢同出行安排',
      heat: '今日炎熱同活動節奏',
      evergreen: '今日生活同訓練節奏'
    }[key],
    source_records: sources.map((source, index) => ({
      id: source.id || source.source_id || `source-${index + 1}`,
      name: source.source || source.source_name || 'AIOS scheduled record',
      time: source.updateTime || source.source_time || source.sourceTimestamp || '',
      url: source.sourceUrl || source.source_url || ''
    }))
  };
}

function scoreText(text, index, recentTexts, contextSpecific = false) {
  const hasQuestion = /[？?]/.test(text);
  const practical = /飲|坐|企|行|膊頭|呼吸|熱身|動作|瞓|恢復|伸展|Gym|操/.test(text);
  const personal = /你|啦|呀|返|咗|唔|啲/.test(text);
  const scores = {
    human_warmth: Math.min(100, 86 + (personal ? 8 : 0) + (hasQuestion ? 2 : 0)),
    hong_kong_cantonese: personal ? 96 : 75,
    gym_client_value: Math.min(100, 82 + (practical ? 12 : 0) + (/操|熱身|動作|恢復/.test(text) ? 3 : 0)),
    everyday_usefulness: Math.min(100, (practical ? 94 : 82) + (contextSpecific ? 4 : 0)),
    jeffrey_voice: Math.min(100, 86 + (personal ? 8 : 0)),
    reply_likelihood: hasQuestion ? 96 : 76 + (index % 5),
    novelty: recentTexts.has(text) ? 0 : 88 + (index % 8)
  };
  const weighted = Object.entries(REVIEWER_WEIGHTS)
    .reduce((total, [reviewer, weight]) => total + scores[reviewer] * weight, 0);
  return { scores, weighted_score: Number(weighted.toFixed(2)) };
}

export function hardReject(customerText) {
  const text = normaliseText(customerText);
  const lower = text.toLowerCase();
  const matched = HARD_REJECTION_TERMS.filter((term) =>
    /[a-z]/i.test(term) ? lower.includes(term.toLowerCase()) : text.includes(term)
  );
  if (!text || [...text].length > 74) matched.push('invalid_length');
  if (!/[呀啦喎啲咗嚟唔冇返嘅]/.test(text)) matched.push('not_spoken_cantonese');
  if (/[。！？!?].+[。！？!?].+[。！？!?]/.test(text)) matched.push('too_many_sentences');
  return { rejected: matched.length > 0, reasons: [...new Set(matched)] };
}

export function validateScheduledOutputs(data, now = new Date()) {
  const today = localDate(now);
  const outputDate = String(data?.date || '');
  const accepted = [];
  const rejected = [];
  const sources = [
    data?.weatherContext,
    ...(data?.scheduledOutputs || []),
    ...(data?.verifiedOutputs || [])
  ].filter(Boolean);
  for (const source of sources) {
    const timestamp = source.updateTime || source.source_time || source.sourceTimestamp;
    const sourceDate = timestamp ? localDate(new Date(timestamp)) : outputDate;
    const supported = Boolean(source.source || source.source_name);
    const item = { ...source, sourceDate };
    if (outputDate !== today || sourceDate !== today || !supported || source.conflicting || source.speculative) {
      rejected.push(item);
    } else {
      accepted.push(item);
    }
  }
  return { date: today, accepted, rejected, fresh: outputDate === today };
}

export function createCandidatePool({
  scheduledOutputs = {},
  previousArchive = [],
  now = new Date()
} = {}) {
  const validation = validateScheduledOutputs(scheduledOutputs, now);
  const fusion = fuseSourceTopic(validation);
  const recentTexts = new Set(previousArchive.slice(-200).map((item) => normaliseText(item.customer_text)));
  const primarySource = validation.accepted[0];
  const createdAt = now.toISOString();
  const contextTexts = CONTEXT_TEXTS[fusion.key] || [];
  const candidateTexts = [...contextTexts, ...CANDIDATE_TEXTS].slice(0, 50);
  return candidateTexts.map((customerText, index) => {
    const rejection = hardReject(customerText);
    const contextSpecific = index < contextTexts.length;
    const review = scoreText(customerText, index, recentTexts, contextSpecific);
    return {
      customer_text: customerText,
      internal_reason: rejection.rejected
        ? `Hard rejection: ${rejection.reasons.join(', ')}`
        : 'Short, practical daily care in Jeffrey-style spoken Cantonese.',
      reviewer_scores: review.scores,
      weighted_score: review.weighted_score,
      status: rejection.rejected ? 'Rejected' : 'Draft',
      archive_id: `curator-${validation.date}-${String(index + 1).padStart(2, '0')}`,
      created_at: createdAt,
      source_name: primarySource?.source || primarySource?.source_name || 'Jeffrey Curator evergreen library',
      source_time: primarySource?.updateTime || primarySource?.source_time || createdAt,
      source_url: primarySource?.sourceUrl || primarySource?.source_url || '',
      fused_topic: fusion.label,
      source_records: fusion.source_records
    };
  });
}

export function selectTopFive(candidates) {
  const seen = new Set();
  return candidates
    .filter((candidate) => candidate.status !== 'Rejected' && !hardReject(candidate.customer_text).rejected)
    .sort((a, b) => b.weighted_score - a.weighted_score || a.archive_id.localeCompare(b.archive_id))
    .filter((candidate) => {
      const key = normaliseText(candidate.customer_text);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5)
    .map((candidate) => ({ ...candidate, status: 'Draft' }));
}

export function buildDailyCuration({
  scheduledOutputs = {},
  previousArchive = [],
  now = new Date()
} = {}) {
  const validation = validateScheduledOutputs(scheduledOutputs, now);
  const fusion = fuseSourceTopic(validation);
  const candidates = createCandidatePool({ scheduledOutputs, previousArchive, now });
  const board = selectTopFive(candidates);
  if (candidates.length < 30 || candidates.length > 50) throw new Error('Candidate pool must contain 30–50 items');
  if (board.length !== 5) throw new Error('Curator board must contain exactly five items');
  return {
    board: {
      version: ENGINE_VERSION,
      date: validation.date,
      generated_at: now.toISOString(),
      candidate_count: candidates.length,
      fused_topic: fusion.label,
      combined_source_count: fusion.source_records.length,
      items: board
    },
    archiveItems: candidates,
    validation
  };
}

export function copyCustomerText(message, clipboard) {
  if (!message?.customer_text) return Promise.reject(new Error('customer_text is required'));
  return clipboard.writeText(message.customer_text);
}

export function migrateLegacyItems(data = {}, now = new Date()) {
  const items = [
    ...(data.dailySpecial || []),
    ...(data.jeffreyToday || []),
    ...(data.weatherMessages || []),
    ...Object.values(data.groups || {}).flat(),
    ...(data.archive || [])
  ];
  return items.map((item, index) => ({
    customer_text: normaliseText(item.customer_text || item.content || item.hook),
    internal_reason: 'Migrated from the pre-v2 catalogue; archive only.',
    reviewer_scores: {},
    weighted_score: Number(item.weighted_score || item.humanScore || 0),
    status: 'Archived',
    archive_id: item.archive_id || item.id || `legacy-${String(index + 1).padStart(4, '0')}`,
    created_at: item.created_at || `${data.date || localDate(now)}T00:00:00+08:00`,
    source_name: item.source_name || item.source || 'Legacy Jeffrey reminder catalogue',
    source_time: item.source_time || item.sourceTimestamp || `${data.date || localDate(now)}T00:00:00+08:00`,
    source_url: item.source_url || item.sourceUrl || ''
  })).filter((item) => item.customer_text);
}
