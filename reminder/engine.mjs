export const ENGINE_VERSION = '5.1.0';

export const STORAGE_KEYS = Object.freeze({
  favourites: 'jeffreyCuratorFavourites',
  usage: 'jeffreyCuratorUsage',
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
  '如果今日周身實，做兩下輕鬆活動先再算。',
  '一忙就唔好連水都唔飲，放支水喺手邊啦。',
  '今日唔使追住個數字跑，個動作穩先係正經。',
  '返工坐耐咗，食飯前行一圈先再坐低。',
  '瞓得唔夠就唔好死頂，今日訓練收少少都得。',
  '去到 Gym 先唔好急住睇電話，俾自己入返狀態。',
  '企耐咗就轉下重心，唔使一路鎖死對腳。',
  '今日做完一組抖順先再嚟，唔使趕住下一組。',
  '練完補返幾啖水，唔好一路傾一路唔記得。',
  '搭車坐得耐，落車行嗰幾步就當郁返開。',
  '肩頸緊嗰陣唔使硬拉，先郁返鬆少少就得。',
  '今日返到屋企早少少收機啦，個人都要落返速。',
  '如果今晚有堂，食嘢唔使太趕，留返啲時間俾自己。',
  '做運動前唔使諗太多，先由最熟嗰個動作開始。',
  '今日如果精神一般，訓練質素好過硬加重量。',
  '坐住做嘢嗰陣，雙腳放返實地會舒服好多。',
  '手機拎高少少啦，唔使成日低低頭睇。',
  '今日操完如果仲有精神，留返少少俾聽日都好。',
  '出門前帶定支水啦，唔使去到先周圍搵。',
  '做動作嗰陣唔使閉住氣，順住個節奏呼吸就得。',
  '如果今日冇乜心機，做少啲但做得好都算交足功課。',
  '返到屋企唔好即刻坐死，行兩步先換衫都好。',
  '食完飯慢慢行幾分鐘，當俾個人轉下場。',
  '今日個膊頭如果緊，先放低啲再開始做嘢。',
  '唔使每次都做到盡，留返一兩格力先可以做得長。'
]);

function normaliseText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[\s，。！？、,.!?「」『』（）()：:；;]/g, '');
}

function scoreCandidate(customerText, index = 0) {
  const rejection = HARD_REJECTION_TERMS.some((term) => customerText.toLowerCase().includes(term));
  if (rejection) {
    return {
      rejected: true,
      reason: 'hard_rejection_term',
      scores: {},
      weighted_score: 0
    };
  }

  const scores = {
    human_warmth: 94,
    hong_kong_cantonese: 96,
    gym_client_value: 94,
    everyday_usefulness: 94,
    jeffrey_voice: 94,
    reply_likelihood: 76 + (index % 5),
    novelty: 90 + (index % 5)
  };
  const weighted_score = Object.entries(REVIEWER_WEIGHTS)
    .reduce((sum, [key, weight]) => sum + scores[key] * weight, 0);
  return { rejected: false, scores, weighted_score };
}

export function createCandidatePool({ date, recentTexts = new Set(), now = new Date() } = {}) {
  const runDate = date || now.toISOString().slice(0, 10);
  return CANDIDATE_TEXTS.map((customerText, index) => {
    const review = scoreCandidate(customerText, index);
    return {
      customer_text: customerText,
      internal_reason: review.rejected
        ? review.reason
        : 'Short, practical daily care in Jeffrey-style spoken Cantonese.',
      reviewer_scores: review.scores,
      weighted_score: review.weighted_score,
      recently_selected: recentTexts.has(customerText),
      archive_id: `curator-${runDate}-${String(index + 1).padStart(2, '0')}`,
      created_at: now.toISOString(),
      source_name: '',
      source_time: '',
      source_url: '',
      selected: false
    };
  });
}

export function selectTopFive(candidates, recentTexts = new Set()) {
  const seen = new Set();
  const selected = [];
  const ranked = [...candidates]
    .filter((candidate) => !candidate.internal_reason.startsWith('hard_rejection'))
    .filter((candidate) => !candidate.recently_selected && !recentTexts.has(candidate.customer_text))
    .sort((a, b) => b.weighted_score - a.weighted_score || a.archive_id.localeCompare(b.archive_id))
    .filter((candidate) => {
      const key = normaliseText(candidate.customer_text);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  for (const candidate of ranked) {
    if (selected.length >= 5) break;
    selected.push({ ...candidate, selected: true });
  }
  return selected;
}

export function buildBoard({ date, generatedAt, candidatePool, recentTexts = new Set() }) {
  const items = selectTopFive(candidatePool, recentTexts);
  return {
    version: ENGINE_VERSION,
    date,
    generated_at: generatedAt,
    candidate_count: candidatePool.length,
    items
  };
}

export async function copyCustomerText(item, clipboard) {
  if (!clipboard || typeof clipboard.writeText !== 'function') {
    throw new Error('Clipboard unavailable');
  }
  return clipboard.writeText(item.customer_text);
}
