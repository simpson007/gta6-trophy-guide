// Take the 4 gta6-trophy-guide-01 screenshots with Playwright's own Chromium.
// Usage: node shots.mjs   (the app must be served on http://localhost:8081 first)
// playwright-core comes from the npx cache (v1.49.1), loaded through createRequire.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/hatch/.npm/_npx/f0a362733743bae2/node_modules/playwright-core/index.js');

const plan = JSON.parse(readFileSync(new URL('./shots.json', import.meta.url), 'utf8'));
const outDir = new URL('./screenshots/', import.meta.url).pathname;
const base = 'http://localhost:8081/';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

async function shoot(file) {
  const buf = await page.screenshot({ type: 'jpeg', quality: 82 });
  writeFileSync(outDir + file, buf);
  console.log(file, buf.length, 'bytes');
}

async function openFresh() {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('.trophy', { timeout: 10000 });
  await page.waitForTimeout(800);
}

// 1. Hero with progress: tick the first 8 trophies so the progress bar shows real progress.
await openFresh();
for (let i = 0; i < 8; i++) {
  await page.locator('.trophy input[type="checkbox"]').nth(i).click();
}
await page.waitForTimeout(400);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
await shoot(plan[0].file);

// 2. Tracker view: filters, grades and guides visible.
await page.evaluate(() => window.scrollTo(0, document.getElementById('trackerCard').offsetTop - 8));
await page.waitForTimeout(400);
await shoot(plan[1].file);

// 3. Fresh state, spoiler mode on, nothing earned: hidden story trophies masked.
await page.evaluate(() => localStorage.clear());
await openFresh();
await page.evaluate(() => window.scrollTo(0, document.getElementById('trackerCard').offsetTop - 8));
await page.waitForTimeout(400);
await shoot(plan[2].file);

// 4. Missable filter: the one possibly-missable trophy, guide and sources open.
await page.getByRole('button', { name: 'Missable', exact: true }).click();
await page.waitForTimeout(600);
await page.evaluate(() => window.scrollTo(0, document.getElementById('trackerCard').offsetTop - 8));
await page.waitForTimeout(400);
await shoot(plan[3].file);

await browser.close();
console.log('done');
