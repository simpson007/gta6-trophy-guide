// Leonida Trophy Guide — the program that hands this entry in (Node 22, standard
// library only). The guide itself is the static files under app/: index.html plus
// its script, stylesheet and data, no build step, nothing fetched over the network.
// This program copies app/ and screenshots/ from beside this file into /output and
// writes /output/dossier.json with the vendored make.fun library, which is the
// summary the judge reads (the screenshots, the first load's files and bytes, and
// the source). Keep vendor/makefun-frontend.ts untouched: the scorer requires the
// dossier to be byte for byte what its own copy of that library writes.
//
// Run it locally with `node serve.ts` first, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes. The rest refuse an
// entry the scorer would refuse — more than 4 screenshots or one over 256 KiB;
// more than 993 files and directories in app/ or 48 MiB of app files (app/ shares
// /output's own 1000-entry cap with its screenshots/ and dossier.json).
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

// Read the dossier back so a local run says plainly what it handed in.
const dossierBytes = readFileSync(dossierPath).length;
const shotFiles = readdirSync(join(outDir, 'screenshots'));
console.log(`dossier.json: ${dossierBytes} bytes, ${shotFiles.length} screenshots`);
