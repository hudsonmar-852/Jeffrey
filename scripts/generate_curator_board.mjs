import { readFile, writeFile } from 'node:fs/promises';
import {
  buildDailyCuration,
  migrateLegacyItems
} from '../reminder/engine.mjs';

const root = new URL('../', import.meta.url);
const readJson = async (path, fallback) => {
  try {
    return JSON.parse(await readFile(new URL(path, root), 'utf8'));
  } catch {
    return fallback;
  }
};

const today = await readJson('data/today.json', {});
const archive = await readJson('data/archive.json', { version: '2.0.0', items: [] });
const now = process.env.CURATOR_NOW ? new Date(process.env.CURATOR_NOW) : new Date();
if (Number.isNaN(now.getTime())) throw new Error('CURATOR_NOW must be an ISO timestamp');

const migrated = migrateLegacyItems(today, now);
const withoutApprovalState = ({ status, approvalStatus, ...item }) => item;
const existing = Array.isArray(archive.items)
  ? archive.items.map(withoutApprovalState)
  : [];
const existingIds = new Set(existing.map((item) => item.archive_id));
const legacy = migrated
  .map(withoutApprovalState)
  .filter((item) => !existingIds.has(item.archive_id));
const runDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong' }).format(now);
const currentPrefix = `curator-${runDate}-`;
const previousArchive = [...existing, ...legacy]
  .filter((item) => !String(item.archive_id || '').startsWith(currentPrefix));
const curation = buildDailyCuration({
  scheduledOutputs: today,
  previousArchive,
  now
});
const currentIds = new Set(curation.archiveItems.map((item) => item.archive_id));
const historical = [...existing, ...legacy].filter((item) => !currentIds.has(item.archive_id));
const nextArchive = {
  version: '2.0.0',
  updated_at: now.toISOString(),
  items: [...historical, ...curation.archiveItems]
};

await writeFile(
  new URL('data/curator-board.json', root),
  `${JSON.stringify(curation.board, null, 2)}\n`,
  'utf8'
);
await writeFile(
  new URL('data/archive.json', root),
  `${JSON.stringify(nextArchive, null, 2)}\n`,
  'utf8'
);

console.log(JSON.stringify({
  date: curation.board.date,
  candidates: curation.board.candidate_count,
  selected: curation.board.items.length,
  archived: nextArchive.items.length,
  rejected_sources: curation.validation.rejected.length
}));
