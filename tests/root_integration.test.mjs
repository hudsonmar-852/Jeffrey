import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('production root and reminder route share one Curator board implementation', async () => {
  const [rootHtml, reminderHtml] = await Promise.all([read('index.html'), read('reminder/index.html')]);
  assert.match(rootHtml, /meta name="app-version" content="5\.0\.0"/);
  assert.match(rootHtml, /src="reminder\/app\.js"/);
  assert.match(rootHtml, /id="messageGrid"/);
  assert.match(reminderHtml, /src="app\.js"/);
  assert.match(reminderHtml, /id="messageGrid"/);
  assert.doesNotMatch(rootHtml, /productionPanel|relationshipGrid|showPending|showDone/);
});

test('pull-request workflow validates without deploying a PR', async () => {
  const workflow = await read('.github/workflows/pages.yml');
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /if: github\.event_name != 'pull_request'/);
  assert.match(workflow, /node --check reminder\/engine\.mjs/);
});
