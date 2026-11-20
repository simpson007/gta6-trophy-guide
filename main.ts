// Leonida Campaign — the entry's program.
// Hands the guide in: copies app/ and screenshots/ to the output directory and
// writes dossier.json with make.fun's dossier library. Node 22, standard library only.
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 3, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

// A short summary on stdout so a local run shows what it handed in.
const appFiles = ['index.html', 'css/campaign.css', 'data/trophies.json', 'data/campaign.json'];
console.log(`Leonida Campaign: ${appFiles.length} named app files plus js modules, 3 screenshots, dossier ${dossier.length} bytes -> ${outDir}`);
