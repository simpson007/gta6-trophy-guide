// Take the 4 gta6-trophy-guide-01 screenshots with Playwright's own Chromium.
// Usage: node shots.mjs   (server must be up on http://localhost:8081)
// playwright-core's public API via createRequire (npx cache copy, v1.49.1).
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium: chromiumApi } = require('/home/hatch/.npm/_npx/f0a362733743bae2/node_modules/playwright-core/index.js');

const shots = JSON.parse(readFileSync(new URL('./shots.json', import.meta.url), 'utf8'));
const outDir = new URL('./screenshots/', import.meta.url).pathname;

const browser = await chromiumApi.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
await page.waitForSelector('.trophy', { timeout: 10000 });
await page.waitForTimeout(800);

// Tick the first 8 trophies so the hero progress bar shows real progress.
for (let i = 0; i < 8; i++) {
  await page.locator('.trophy input[type="checkbox"]').nth(i).click();
}
await page.waitForTimeout(400);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
let buf = await page.screenshot({ type: 'jpeg', quality: 82 });
writeFileSync(outDir + shots[0].file, buf);
console.log(shots[0].file, buf.length, 'bytes');

// Tracker view: filters, grades and guides visible.
await page.evaluate(() => window.scrollTo(0, document.getElementById('trackerCard').offsetTop - 8));
await page.waitForTimeout(400);
buf = await page.screenshot({ type: 'jpeg', quality: 82 });
writeFileSync(outDir + shots[1].file, buf);
console.log(shots[1].file, buf.length, 'bytes');

// Fresh state: spoiler mode on, nothing earned — hidden trophies masked.
await page.evaluate(() => localStorage.clear());
await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
await page.waitForSelector('.trophy', { timeout: 10000 });
await page.waitForTimeout(800);
await page.evaluate(() => window.scrollTo(0, document.getElementById('trackerCard').offsetTop - 8));
await page.waitForTimeout(400);
buf = await page.screenshot({ type: 'jpeg', quality: 82 });
writeFileSync(outDir + shots[2].file, buf);
console.log(shots[2].file, buf.length, 'bytes');

// Missable filter: the one possibly-missable trophy, guide and sources open.
await page.getByRole('button', { name: 'Missable', exact: true }).click();
await page.waitForTimeout(600);
await page.evaluate(() => window.scrollTo(0, document.getElementById('trackerCard').offsetTop - 8));
await page.waitForTimeout(400);
buf = await page.screenshot({ type: 'jpeg', quality: 82 });
writeFileSync(outDir + shots[3].file, buf);
console.log(shots[3].file, buf.length, 'bytes');

await browser.close();
console.log('done');
