import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ENGINE_VERSION } from '../reminder/engine.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('production root and reminder route share one Curator board implementation', async () => {
  const [rootHtml, reminderHtml] = await Promise.all([read('index.html'), read('reminder/index.html')]);
  assert.ok(rootHtml.includes(`meta name="app-version" content="${ENGINE_VERSION}"`));
  assert.ok(rootHtml.includes(`src="reminder/app.js?v=${ENGINE_VERSION}"`));
  assert.match(rootHtml, /id="messageGrid"/);
  assert.match(rootHtml, /data-view="favourites"/);
  assert.match(rootHtml, /id="favouriteCount"/);
  assert.ok(reminderHtml.includes(`src="app.js?v=${ENGINE_VERSION}"`));
  for (const html of [rootHtml, reminderHtml]) {
    assert.match(html, /id="updatedDate"/);
    assert.match(html, /id="usageTotal"/);
  }
  assert.match(reminderHtml, /id="messageGrid"/);
  assert.match(reminderHtml, /data-view="favourites"/);
  assert.doesNotMatch(rootHtml, /productionPanel|relationshipGrid|showPending|showDone/);
});

test('pull-request workflow validates without deploying a PR', async () => {
  const workflow = await read('.github/workflows/pages.yml');
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /if: github\.event_name != 'pull_request'/);
  assert.match(workflow, /node --check reminder\/engine\.mjs/);
});
