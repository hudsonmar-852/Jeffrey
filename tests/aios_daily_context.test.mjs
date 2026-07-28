import test from 'node:test';
import assert from 'node:assert/strict';

import {
  catalogueToDashboardMessages,
  loadLatestAiosDailyContext,
  loadRuntimeFlag,
  prependScheduledDrafts,
  scheduledContextToDashboard
} from '../aios-daily-context.mjs';

test('runtime feature flag defaults off on load failure', async () => {
  assert.equal(await loadRuntimeFlag(async () => { throw new Error('offline'); }), false);
});

test('scheduled context rejects stale or low confidence weather', () => {
  const result = scheduledContextToDashboard({
    validation: { status: 'partial' },
    weather: { status: 'verified', freshness_score: 60, confidence_score: 84 }
  });
  assert.equal(result.verified, false);
});

test('catalogue drafts are prepended without changing historical objects', () => {
  const old = { id: 'old-1', text: '舊訊息', count: 3 };
  const catalogue = {
    generated_at: '2026-07-27T01:00:00Z',
    new_reminders: {
      weather_today: [],
      hydration: [{
        id: 'new-1',
        text: '飲兩啖水先啦。',
        category: 'hydration',
        status: 'draft_human_approval_required'
      }]
    }
  };
  const incoming = catalogueToDashboardMessages(catalogue);
  const result = prependScheduledDrafts([old], incoming);
  assert.equal(result[0].id, 'new-1');
  assert.equal(result[0].status, 'draft_human_approval_required');
  assert.strictEqual(result[1], old);
});

test('dashboard selects five diverse best drafts instead of dumping the full catalogue', () => {
  const new_reminders = { weather_today: [] };
  for (const category of ['hydration', 'mobility', 'breathing', 'intensity', 'recovery', 'care']) {
    new_reminders[category] = Array.from({ length: 5 }, (_, index) => ({
      id: `${category}-${index}`,
      text: `${category} ${index}`,
      category,
      status: 'draft_human_approval_required'
    }));
  }
  const result = catalogueToDashboardMessages({ new_reminders });
  assert.equal(result.length, 5);
  assert.equal(new Set(result.map((item) => item.category)).size, 5);
});

test('simplified daily_five catalogue keeps all five messages', () => {
  const result = catalogueToDashboardMessages({
    new_reminders: {
      daily_five: Array.from({ length: 5 }, (_, index) => ({
        id: `daily-${index}`,
        text: `每日訊息 ${index}`,
        category: 'daily_five',
        status: 'draft_human_approval_required'
      }))
    }
  });
  assert.equal(result.length, 5);
});

test('loader follows only stored AIOS record pointers', async () => {
  const calls = [];
  const payloads = new Map([
    ['/aios/modules/jeffrey/latest.json', {
      daily_context_url: '/aios/context.json',
      daily_catalogue_url: '/aios/catalogue.json',
      generated_at: '2026-07-27T01:00:00Z'
    }],
    ['/aios/context.json', {
      validation: { status: 'partial' },
      weather: { status: 'unavailable', freshness_score: 0, confidence_score: 0 }
    }],
    ['/aios/catalogue.json', { new_reminders: { weather_today: [] } }]
  ]);
  const fetchImpl = async (url) => {
    const key = url.split('?')[0];
    calls.push(key);
    return { ok: true, json: async () => payloads.get(key) };
  };
  const result = await loadLatestAiosDailyContext({ fetchImpl });
  assert.equal(result.messages.length, 0);
  assert.deepEqual(calls, [
    '/aios/modules/jeffrey/latest.json',
    '/aios/context.json',
    '/aios/catalogue.json'
  ]);
  assert.equal(calls.some((url) => /hko|weather\.gov/i.test(url)), false);
});
