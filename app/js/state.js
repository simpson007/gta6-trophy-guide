/* Tracker state: what the player has earned, kept in the browser's localStorage.
   Nothing leaves the machine except through the export button the player presses. */

export const STORAGE_KEY = 'leonida-campaign-v1';

/** The shape of the saved state. */
export function blankState() {
  return { checked: {}, counts: {}, spoiler: false, kind: 'all', query: '' };
}

/** Read the saved state, tolerating a missing or damaged record. */
export function loadState() {
  const state = blankState();
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch { raw = null; }
  if (!raw) return state;
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch { parsed = null; }
  if (!parsed || typeof parsed !== 'object') return state;
  if (parsed.checked && typeof parsed.checked === 'object') state.checked = parsed.checked;
  if (parsed.counts && typeof parsed.counts === 'object') state.counts = parsed.counts;
  if (typeof parsed.spoiler === 'boolean') state.spoiler = parsed.spoiler;
  if (typeof parsed.kind === 'string') state.kind = parsed.kind;
  return state;
}

/** Persist the state. Silently keeps going when storage is unavailable. */
export function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* private mode */ }
}

/** Whether a trophy is ticked off. */
export function isEarned(state, id) {
  return state.checked[id] === true;
}

/** Toggle a trophy's ticked state and persist it. */
export function toggleEarned(state, id) {
  if (state.checked[id]) delete state.checked[id];
  else state.checked[id] = true;
  saveState(state);
}

/** A counted trophy's current progress (0 when untouched). */
export function getCount(state, id) {
  const n = state.counts[id];
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0;
}

/** Set a counted trophy's progress, clamped to its goal, and persist it. */
export function setCount(state, id, value, target) {
  const n = Math.max(0, Math.min(target, Math.floor(value) || 0));
  if (n === 0) delete state.counts[id];
  else state.counts[id] = n;
  saveState(state);
}

/** How many trophies are ticked, out of how many. */
export function earnedTotal(state, total) {
  const earned = Object.keys(state.checked).length;
  return { earned, total, pct: total === 0 ? 0 : Math.round((earned / total) * 100) };
}

/** The state as a downloadable JSON file's text. */
export function exportText(state) {
  return JSON.stringify({ exported: 'leonida-campaign', version: 1, state }, null, 2);
}

/** Validate an imported file's text and return its state, or null when it is not one. */
export function parseImport(text) {
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { return null; }
  const inner = parsed && parsed.state ? parsed.state : parsed;
  if (!inner || typeof inner !== 'object') return null;
  const state = blankState();
  if (inner.checked && typeof inner.checked === 'object') state.checked = inner.checked;
  if (inner.counts && typeof inner.counts === 'object') state.counts = inner.counts;
  if (typeof inner.spoiler === 'boolean') state.spoiler = inner.spoiler;
  return state;
}

/** A mid-run state for screenshots: Phase 1 done, strangers underway, the sweep half done.
    Only used when the page is opened with ?demo=1 and no saved state exists yet. */
export function seedDemo() {
  const state = blankState();
  const done = [
    'just-like-paradise', 'paradise-lost', 'tits-ass-drug-money', 'vice-city-baby',
    'top-of-the-world-ma', 'trust', 'break-the-bank', 'family-matters', 'dwnfall',
    'hi-jacked', 'snow-storm', 'you-gotta-know-when-to-get-off',
    'road-to-rehabilitation', 'this-was-no-boat-accident', 'the-lone-rider',
    'master-of-none', 'stick-fiddler', 'baited-my-tackle', 'in-the-beginning',
  ];
  for (const id of done) state.checked[id] = true;
  state.counts = {
    'cunning-stunts': 120, 'the-shootist': 12, 'top-fun': 5, 'earn-cash-not-kudos': 7,
    'dont-touch-my-deck': 1, 'you-wainker': 47, 'positive-mental-attitude': 9,
    'whip-it-good': 63, 'one-last-thing': 23, 'maximum-withdrawal': 2,
    'little-boxes': 4, 'on-the-spot': 6, 'dime-on-the-dollar': 80000,
    'treat-yo-self': 42000, 'strangers-and-freaks': 3, 'a-long-road': 41,
  };
  saveState(state);
  return state;
}
