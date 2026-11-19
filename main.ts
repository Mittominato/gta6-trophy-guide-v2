// Leonida Trophy Guide — the entry program for gta6-trophy-guide-01 (Node 22,
// standard library only). It hands the guide in: it copies this repository's
// app/ and screenshots/ into /output (or $MAKEFUN_OUTPUT_DIR outside the
// grader) and writes /output/dossier.json with the vendored make.fun library,
// buildDossier from vendor/makefun-frontend.ts — leave that file untouched,
// the scorer rebuilds the dossier with its own copy and compares byte for byte.
//
// The output directory itself is never removed: on the grader its parent is
// read-only, so deleting the directory fails (EACCES). Instead the program
// empties the directory's contents and refills it, which keeps the run
// deterministic: running it twice over the same output produces the same
// dossier.json byte for byte.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly, before touching the output, if the guide itself is missing:
// a half-copied entry is worse than no entry at all.
for (const required of ['app/index.html', 'app/data/trophies.json', 'vendor/makefun-frontend.ts']) {
  if (!existsSync(join(here, required))) {
    console.error(`missing required file: ${required}`);
    process.exit(1);
  }
}

// Empty the output directory's contents, keeping the directory itself.
mkdirSync(out, { recursive: true });
for (const entry of readdirSync(out)) {
  rmSync(join(out, entry), { recursive: true, force: true });
}

// The guide itself: plain static files, no build step, no network at runtime.
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The dossier the judge reads: screenshots, first-load totals and the source
// outline. The caps mirror the gate (reference/gate.json): at most 4
// screenshots of at most 256 KiB each, app/ at most 993 entries and 48 MiB,
// and the dossier text capped at 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

console.log(`wrote ${join(out, 'dossier.json')}`);
console.log(`copied app/ (${countFiles(join(out, 'app'))} files) and screenshots/ (${readdirSync(join(out, 'screenshots')).length} images)`);

// Count the files under a directory, recursively, for the summary line.
function countFiles(dir: string): number {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    total += entry.isDirectory() ? countFiles(join(dir, entry.name)) : 1;
  }
  return total;
}
