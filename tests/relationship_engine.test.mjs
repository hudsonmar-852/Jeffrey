import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HARD_REJECTION_TERMS,
  REVIEWER_WEIGHTS,
  buildDailyCuration,
  copyCustomerText,
  createCandidatePool,
  hardReject,
  migrateLegacyItems,
  selectTopFive,
  validateScheduledOutputs
} from '../reminder/engine.mjs';

const NOW = new Date('2026-07-28T08:15:00+08:00');
const INPUT = {
  date: '2026-07-28',
  weatherContext: {
    source: '香港天文台',
    sourceUrl: 'https://data.weather.gov.hk/',
    updateTime: '2026-07-28T07:55:00+08:00'
  }
};

test('reviewer weights total exactly 100%', () => {
  assert.equal(Object.values(REVIEWER_WEIGHTS).reduce((sum, value) => sum + value, 0), 1);
});

test('pipeline generates 30–50 internal candidates and exactly five board cards', () => {
  const result = buildDailyCuration({ scheduledOutputs: INPUT, now: NOW });
  assert.equal(result.archiveItems.length, 40);
  assert.equal(result.board.items.length, 5);
  assert.equal(new Set(result.board.items.map((item) => item.customer_text)).size, 5);
  assert.equal(result.board.items.every((item) => item.status === 'Draft'), true);
});

test('old reminders migrate to archive but never enter today board', () => {
  const oldText = '呢條舊短訊只可以留喺歷史紀錄入面。';
  const migrated = migrateLegacyItems({
    date: '2026-07-10',
    dailySpecial: [{ id: 'old-1', content: oldText }]
  }, NOW);
  const result = buildDailyCuration({ scheduledOutputs: INPUT, previousArchive: migrated, now: NOW });
  assert.equal(migrated[0].status, 'Archived');
  assert.equal(result.board.items.some((item) => item.customer_text === oldText), false);
});

test('copy writes customer_text only', async () => {
  const writes = [];
  const message = {
    customer_text: '飲兩啖水先啦。',
    internal_reason: 'internal',
    source_name: 'private source',
    weighted_score: 99
  };
  await copyCustomerText(message, { writeText: async (value) => writes.push(value) });
  assert.deepEqual(writes, ['飲兩啖水先啦。']);
});

test('hard rejection blocks workflow, formal, AI, report and bulletin wording', () => {
  for (const value of [
    'AIOS report：今日請注意補水。',
    '今日天文台警告信號現正生效。',
    '溫馨提示大家記得做伸展。',
    'Please approve this workflow CTA。'
  ]) {
    assert.equal(hardReject(value).rejected, true, value);
  }
  assert.equal(HARD_REJECTION_TERMS.includes('cta'), true);
});

test('selected content is short, friend-like Hong Kong Cantonese', () => {
  const items = selectTopFive(createCandidatePool({ scheduledOutputs: INPUT, now: NOW }));
  for (const item of items) {
    assert.equal(hardReject(item.customer_text).rejected, false, item.customer_text);
    assert.match(item.customer_text, /呀|啦|啲|咗|返|唔|嘅/);
    assert.equal([...item.customer_text].length <= 74, true);
  }
});

test('freshness validation rejects stale, conflicting, speculative and unsupported inputs', () => {
  const result = validateScheduledOutputs({
    date: '2026-07-28',
    scheduledOutputs: [
      { source: 'Fresh', source_time: '2026-07-28T07:00:00+08:00' },
      { source: 'Stale', source_time: '2026-07-27T07:00:00+08:00' },
      { source: 'Conflict', source_time: '2026-07-28T07:00:00+08:00', conflicting: true },
      { source_time: '2026-07-28T07:00:00+08:00' },
      { source: 'Guess', source_time: '2026-07-28T07:00:00+08:00', speculative: true }
    ]
  }, NOW);
  assert.equal(result.accepted.length, 1);
  assert.equal(result.rejected.length, 4);
});

test('data model contains every approved production field', () => {
  const [item] = createCandidatePool({ scheduledOutputs: INPUT, now: NOW });
  assert.deepEqual(Object.keys(item), [
    'customer_text', 'internal_reason', 'reviewer_scores', 'weighted_score', 'status',
    'archive_id', 'created_at', 'source_name', 'source_time', 'source_url'
  ]);
});
