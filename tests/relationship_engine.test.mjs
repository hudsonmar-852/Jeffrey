import test from 'node:test';
import assert from 'node:assert/strict';
import {
  contextFromDailyData,
  fetchHongKongContext,
  generateMessages,
  recordMigration,
  voiceLock
} from '../reminder/engine.mjs';

const NOW = new Date('2026-07-26T12:00:00+08:00');
const SOURCE = {
  name: '香港天文台',
  url: 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc'
};

const scenarios = [
  ['酷熱日', { context: { verified: true, kind: 'hot', source: SOURCE } }],
  ['大雨日', { context: { verified: true, kind: 'rain', source: SOURCE } }],
  ['普通工作日', {}],
  ['晚上有堂', { schedule: { hasTrainingToday: true } }],
  ['會員近期少出現', { profile: { id: 'm1', nickname: '阿明', recentAttendance: 'less_frequent' } }],
  ['久坐會員', { profile: { id: 'm2', nickname: 'May', commonIssues: ['long_sitting'] } }],
  ['初學會員', { profile: { id: 'm3', nickname: 'Sam', communicationStyle: 'calm' } }],
  ['玩味型熟客', { profile: { id: 'm4', nickname: 'Ken', communicationStyle: 'playful' }, tone: 'playful' }],
  ['冷靜型會員', { profile: { id: 'm5', nickname: 'Wing', communicationStyle: 'calm' }, tone: 'calm' }],
  ['無會員資料', { profile: {} }]
];

for (const [name, input] of scenarios) {
  test(`${name} 產生五條安全草稿`, () => {
    const messages = generateMessages({ ...input, count: 5, now: NOW });
    assert.equal(messages.length, 5);
    for (const message of messages) {
      assert.equal(voiceLock(message.text, message.facts).pass, true, message.text);
      assert.equal(message.approvalStatus, 'pending');
      assert.equal(message.scores.factualSafety, 5);
      assert.equal(message.scores.repetitionRisk, 5);
    }
  });
}

test('Voice Lock 阻止 AI 書面語、曖昧及無來源即時資訊', () => {
  assert.equal(voiceLock('今天請注意補充足夠水分，以維持良好的運動表現。').pass, false);
  assert.equal(voiceLock('今日突然諗起你😂 有空覆我呀。').failures.includes('relationship_boundary'), true);
  assert.equal(voiceLock('出面落緊大雨，安全最緊要。', { claimsRealtime: true, verified: false }).pass, false);
  assert.equal(voiceLock('今晚動作放慢少少，我哋專心做好控制。').pass, true);
});

test('HKO 成功、失敗及 stale 狀態保持明確', async () => {
  const verified = await fetchHongKongContext(async () => ({
    ok: true,
    json: async () => ({
      updateTime: '2026-07-26T11:30:00+08:00',
      temperature: { data: [{ value: 30 }] },
      rainfall: { data: [{ max: 0 }] },
      warningMessage: ['酷熱天氣警告現正生效。']
    })
  }), NOW);
  assert.equal(verified.verified, true);
  assert.equal(verified.kind, 'hot');

  const failed = await fetchHongKongContext(async () => { throw new Error('offline'); }, NOW);
  assert.equal(failed.verified, false);
  assert.equal(failed.status, 'failed');

  const stale = await fetchHongKongContext(async () => ({
    ok: true,
    json: async () => ({ updateTime: '2026-07-25T01:00:00+08:00' })
  }), NOW);
  assert.equal(stale.verified, false);
  assert.equal(stale.status, 'stale');
  assert.equal(generateMessages({ context: failed, now: NOW }).some((message) => /大雨|咁熱|咁焗/.test(message.text)), false);
});

test('today.json provenance 只在新鮮時成為 verified context', () => {
  const fresh = contextFromDailyData({
    weatherContext: {
      source: '香港天文台',
      sourceUrl: SOURCE.url,
      updateTime: '2026-07-26T11:00:00+08:00',
      summary: '酷熱天氣警告現正生效'
    }
  }, NOW);
  assert.equal(fresh.verified, true);
  assert.equal(fresh.kind, 'hot');

  const stale = contextFromDailyData({
    weatherContext: {
      source: '香港天文台',
      sourceUrl: SOURCE.url,
      updateTime: '2026-07-25T01:00:00+08:00',
      summary: '酷熱'
    }
  }, NOW);
  assert.equal(stale.verified, false);

  const future = contextFromDailyData({
    weatherContext: {
      source: '香港天文台',
      sourceUrl: SOURCE.url,
      updateTime: '2026-07-26T13:00:00+08:00',
      summary: '酷熱'
    }
  }, NOW);
  assert.equal(future.verified, false);
});

test('會員群組不會被當成個人暱稱寫入訊息', () => {
  const messages = generateMessages({
    profile: { id: 'group:vip', displayName: 'VIP', isGroup: true },
    schedule: { hasTrainingToday: true },
    count: 5,
    now: NOW
  });
  assert.equal(messages.every((message) => message.memberLabel === '會員群組：VIP'), true);
  assert.equal(messages.every((message) => !message.text.startsWith('VIP，')), true);
});

test('每日 selection 優先保留多種 message types', () => {
  const messages = generateMessages({ count: 5, now: NOW });
  assert.equal(new Set(messages.map((message) => message.type)).size, 5);
  assert.equal(messages.some((message) => message.type === 'coach'), true);
});

test('migration receipt preserves production Favourite and Usage keys', () => {
  const values = new Map([
    ['jeffreyFavourites', JSON.stringify({ a: { content: '舊 Favourite' } })],
    ['jeffreyUsage', JSON.stringify({ a: { content: '舊 Favourite', count: 8, lastCopied: '2026-07-20' } })]
  ]);
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  const receipt = recordMigration(storage);
  assert.equal(receipt.favouritesPreserved, 1);
  assert.equal(receipt.usagePreserved, 1);
  assert.equal(receipt.legacyKeysPreserved, true);
  assert.equal(JSON.parse(values.get('jeffreyUsage')).a.count, 8);
});
