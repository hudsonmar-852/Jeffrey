import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('production root loads the relationship engine without replacing the stable dashboard', async () => {
  const html = await read('index.html');
  assert.match(html, /id="relationshipGrid"/);
  assert.match(html, /src="relationship-app\.mjs\?v=5\.0\.0"/);
  assert.match(html, /src="app\.js\?v=4\.0\.0"/);
  assert.match(html, /id="productionPanel"/);
  assert.match(html, /id="showPending"/);
  assert.match(html, /id="showDone"/);
  assert.match(html, /id="exportAudit"/);
  assert.match(html, /meta name="app-version" content="5\.0\.0"/);
});

test('root integration reuses canonical storage and engine instead of duplicating data', async () => {
  const module = await read('relationship-app.mjs');
  assert.match(module, /from '\.\/reminder\/engine\.mjs'/);
  assert.match(module, /STORAGE_KEYS\.favourites/);
  assert.match(module, /STORAGE_KEYS\.usage/);
  assert.match(module, /legacy_data_preserved: true/);
  assert.match(module, /pathname\.startsWith\('\/aios\/'\)/);
  assert.match(module, /\.slice\(0, 5\)/);
  assert.match(module, /data-action="copy"/);
  assert.match(module, /data-action="favourite"/);
  assert.doesNotMatch(module, /data-action="regenerate"/);
  assert.doesNotMatch(module, /memberSelector|relationshipType|toneSelector/);
  assert.doesNotMatch(module, /localStorage\.clear\(/);
  assert.doesNotMatch(module, /removeItem\(/);

  const html = await read('index.html');
  assert.doesNotMatch(html, /memberSelector|relationshipType|toneSelector|generateRelationship/);
});

test('pull-request workflow validates root and does not deploy a PR', async () => {
  const workflow = await read('.github/workflows/pages.yml');
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /if: github\.event_name != 'pull_request'/);
  assert.match(workflow, /node --check relationship-app\.mjs/);
  assert.match(workflow, /test -f relationship-app\.mjs/);
});
