// Leonida Ledger — GTA VI trophy guide & tracker (Node 22, standard library only).
// The guide itself is plain static files under app/ (index.html, style.css, app.js and
// data/trophies.json), served with no build step and no network at run time. This program
// hands the entry in: it copies app/ and screenshots/ from beside this file to /output and
// writes /output/dossier.json with the vendored make.fun library, which the scorer rebuilds
// and compares byte for byte — so vendor/makefun-frontend.ts stays exactly as the kit ships it.
//
// Run it locally with: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output). Both runs write the same
// bytes: the copy is a plain file copy and the dossier is a pure function of app/ and
// screenshots/, with no clock, no randomness and no environment input in the output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps: only text_max_bytes shapes the bytes; the others refuse an entry
// the scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files
// and directories in app/ or 48 MiB of app files — app/ counts beside /output's own
// 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
