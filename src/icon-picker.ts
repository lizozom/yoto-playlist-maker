import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { getAuthenticatedClient } from '@lizozom/yoto';

interface CatalogIcon {
  title: string;
  tags: string[];
}

// Fetch the public icon catalog, de-duplicated by title (many icons share a
// title, e.g. several "Cat"). We match the CSV `icon` column against titles, so
// the title is what matters; tags are merged to give Claude richer context.
async function fetchCatalog(): Promise<CatalogIcon[]> {
  const client = await getAuthenticatedClient();
  const res = await client.getPublicIcons();
  const byTitle = new Map<string, Set<string>>();
  for (const icon of res.displayIcons) {
    if (!icon.title) continue;
    const tags = byTitle.get(icon.title) ?? new Set<string>();
    for (const t of icon.publicTags ?? []) tags.add(t);
    byTitle.set(icon.title, tags);
  }
  return [...byTitle.entries()].map(([title, tags]) => ({ title, tags: [...tags] }));
}

// Minimal CSV field quoting for values that contain commas/quotes/newlines.
function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const AssignmentSchema = z.object({
  assignments: z.array(
    z.object({
      song_name: z.string(),
      icon_title: z.string(),
      reason: z.string(),
    })
  ),
});

async function main() {
  const csvPath = process.argv.find((a) => a.endsWith('.csv'));
  if (!csvPath) {
    console.error('Usage: npm run icons -- <path-to-csv>');
    process.exit(1);
  }

  const absolute = path.resolve(csvPath);
  const rows = parse(fs.readFileSync(absolute, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  console.log(`Reading ${rows.length} songs from ${path.basename(csvPath)}`);
  console.log('Fetching Yoto icon catalog...');
  const catalog = await fetchCatalog();
  console.log(`  ${catalog.length} unique icons\n`);

  const titleLookup = new Map(catalog.map((c) => [c.title.toLowerCase(), c.title]));
  const songList = rows
    .map((r, i) => {
      const name = r.song_name || r.name || r.title || '';
      const artist = r.artist ? ` — ${r.artist}` : '';
      return `${i + 1}. ${name}${artist}`;
    })
    .join('\n');
  const iconList = catalog.map((c) => `${c.title} [${c.tags.join(', ')}]`).join('\n');

  // Icon matching is a light task — a small model handles it well and cheaply.
  const model = process.env.ANTHROPIC_MODEL?.trim() || 'claude-haiku-4-5';
  const anthropic = new Anthropic();

  console.log(`Asking ${model} to pick the best icon per song...\n`);
  const message = await anthropic.messages.parse({
    model,
    max_tokens: 8000,
    system:
      'You assign Yoto player icons to songs on a playlist. For each song, choose the single ' +
      'most fitting icon from the provided catalog — prefer specific, thematic matches ' +
      '(the subject, an instrument, a mood, an object in the title) over generic ones, and ' +
      'favour variety across the playlist where several songs would otherwise share one icon. ' +
      'icon_title MUST be copied verbatim from the catalog. Keep each reason to a short phrase.',
    messages: [
      {
        role: 'user',
        content:
          `Songs:\n${songList}\n\n` +
          `Icon catalog (Title [tags]):\n${iconList}\n\n` +
          'Return one assignment per song, in order.',
      },
    ],
    output_config: { format: zodOutputFormat(AssignmentSchema) },
  });

  const result = message.parsed_output;
  if (!result) {
    console.error('✗ Model did not return a parseable result.');
    process.exit(1);
  }

  // Assignments come back in song order (we asked for that). Prefer an exact
  // name match; otherwise fall back to positional matching, since the model may
  // echo the name with the leading number or trailing artist we sent it.
  const byName = new Map(result.assignments.map((a) => [a.song_name.toLowerCase().trim(), a]));
  if (result.assignments.length !== rows.length) {
    console.log(`  ⚠ ${result.assignments.length} assignments for ${rows.length} songs — matching what we can.\n`);
  }

  rows.forEach((row, i) => {
    const name = (row.song_name || row.name || row.title || '').toLowerCase().trim();
    const pick = byName.get(name) ?? result.assignments[i];
    if (!pick) return;
    const canonical = titleLookup.get(pick.icon_title.toLowerCase().trim());
    if (!canonical) {
      console.log(`  ⚠ ${row.song_name}: "${pick.icon_title}" not in catalog — keeping "${row.icon || ''}"`);
      return;
    }
    const before = row.icon || '(none)';
    row.icon = canonical;
    console.log(`  ✓ ${row.song_name}: ${before} → ${canonical}  (${pick.reason})`);
  });

  // Rewrite the CSV, preserving the original column order.
  const headers = Object.keys(rows[0]);
  const out = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => csvField(r[h] ?? '')).join(',')),
  ].join('\n') + '\n';
  fs.writeFileSync(absolute, out);

  console.log(`\n✓ Updated icons in ${path.basename(csvPath)}. Review, then upload.`);
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
