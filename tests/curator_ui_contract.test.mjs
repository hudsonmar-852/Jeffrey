import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('daily board exposes only the approved Top 5 interface', async () => {
  const [html, app] = await Promise.all([read('reminder/index.html'), read('reminder/app.js')]);
  assert.match(html, /id="messageGrid"/);
  assert.match(html, /畫面顯示 <strong>5<\/strong>/);
  assert.doesNotMatch(html, /candidateCount|內部候選/);
  assert.doesNotMatch(html, /id="tabs"|memberSelector|weatherContext|Archive/);
  assert.match(app, /board\.items\.length !== 5/);
  assert.match(app, /複製短訊/);
  assert.match(app, /收藏/);
  assert.match(app, /標記已用/);
});

test('customer card never renders internal metadata', async () => {
  const app = await read('reminder/app.js');
  assert.doesNotMatch(app, /item\.internal_reason/);
  assert.doesNotMatch(app, /item\.reviewer_scores/);
  assert.doesNotMatch(app, /item\.weighted_score/);
  assert.doesNotMatch(app, /item\.source_/);
  assert.match(app, /copyCustomerText\(item, navigator\.clipboard\)/);
});
