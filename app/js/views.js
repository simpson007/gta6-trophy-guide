/* Views: the campaign roadmap, the trophy checklist and the guide drawer.
   Everything is built with DOM calls so trophy text is never parsed as markup. */

import { getCount, isEarned, earnedTotal } from './state.js';
import { phaseTrophies, sourcesOf } from './data.js';
import { isSpoilerHidden, spoilerPlaceholder, visibleTrophies } from './filters.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

/** Refresh the masthead progress bar from the state. */
export function renderProgress(guide, state) {
  const { earned, total, pct } = earnedTotal(state, guide.total);
  const count = document.getElementById('progress-count');
  const pctEl = document.getElementById('progress-pct');
  const fill = document.getElementById('progress-fill');
  if (count) count.textContent = `${earned} / ${total} earned`;
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (fill) fill.style.width = `${pct}%`;
}

/** Render the four campaign phases with their trophy chips and progress. */
export function renderPhases(guide, state, handlers) {
  const list = document.getElementById('phase-list');
  if (!list) return;
  list.replaceChildren();
  for (const phase of guide.campaign.phases) {
    const trophies = phaseTrophies(guide, phase);
    const earned = trophies.filter((t) => isEarned(state, t.id)).length;
    const pct = trophies.length === 0 ? 0 : Math.round((earned / trophies.length) * 100);

    const card = el('article', 'phase-card');
    const head = el('div', 'phase-head');
    head.appendChild(el('span', 'phase-num', `Phase ${phase.id}`));
    head.appendChild(el('h2', null, phase.title));
    card.appendChild(head);
    card.appendChild(el('p', 'phase-blurb', phase.blurb));

    const meta = el('div', 'phase-meta');
    const bar = el('div', 'phase-bar');
    const fill = el('span');
    fill.style.width = `${pct}%`;
    bar.appendChild(fill);
    meta.appendChild(bar);
    meta.appendChild(el('span', null, `${earned} / ${trophies.length}`));
    const milestone = guide.byId.get(phase.milestone);
    if (milestone) {
      const m = el('span', 'milestone');
      m.textContent = `Milestone: ${milestone.name}`;
      meta.appendChild(m);
    }
    card.appendChild(meta);

    const chips = el('div', 'phase-trophies');
    for (const trophy of trophies) {
      const chip = el('button', 'phase-trophy', trophy.name);
      chip.type = 'button';
      if (isEarned(state, trophy.id)) chip.classList.add('earned');
      if (trophy.missable) chip.classList.add('missable-flag');
      chip.addEventListener('click', () => handlers.onOpen(trophy.id));
      chips.appendChild(chip);
    }
    card.appendChild(chips);
    list.appendChild(card);
  }
}

/** A goal counter stepper for a counted trophy, wired to the state. */
function counterControl(guide, trophy, state, handlers) {
  const wrap = el('span', 'counter');
  const goal = trophy.goal;
  const current = getCount(state, trophy.id);
  const minus = el('button', null, '−');
  minus.type = 'button';
  minus.setAttribute('aria-label', `Decrease progress for ${trophy.name}`);
  minus.addEventListener('click', (event) => {
    event.stopPropagation();
    handlers.onCount(trophy.id, getCount(state, trophy.id) - 1);
  });
  const label = el('span', null, `${current} / ${goal.target} ${goal.unit}`);
  const plus = el('button', null, '+');
  plus.type = 'button';
  plus.setAttribute('aria-label', `Increase progress for ${trophy.name}`);
  plus.addEventListener('click', (event) => {
    event.stopPropagation();
    handlers.onCount(trophy.id, getCount(state, trophy.id) + 1);
  });
  wrap.appendChild(minus);
  wrap.appendChild(label);
  wrap.appendChild(plus);
  return wrap;
}

/** Render the checklist rows for the current filter and search. */
export function renderChecklist(guide, state, handlers) {
  const list = document.getElementById('trophy-list');
  const meta = document.getElementById('list-meta');
  if (!list) return;
  const shown = visibleTrophies(guide, state.kind, state.query);
  if (meta) {
    meta.textContent = shown.length === guide.total
      ? `Showing all ${guide.total} trophies.`
      : `Showing ${shown.length} of ${guide.total} trophies.`;
  }
  list.replaceChildren();
  for (const trophy of shown) {
    const earned = isEarned(state, trophy.id);
    const row = el('li', 'trophy-row' + (earned ? ' earned' : ''));

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned;
    box.setAttribute('aria-label', `Earned: ${trophy.name}`);
    box.addEventListener('change', () => handlers.onToggle(trophy.id));
    row.appendChild(box);

    const body = el('div');
    const hidden = isSpoilerHidden(trophy, state.spoiler, earned);
    const nameRow = el('p', 'trophy-name');
    const nameBtn = el('button', null, hidden ? spoilerPlaceholder() : trophy.name);
    nameBtn.type = 'button';
    nameBtn.addEventListener('click', () => handlers.onOpen(trophy.id));
    nameRow.appendChild(nameBtn);
    body.appendChild(nameRow);
    if (!hidden) {
      body.appendChild(el('p', 'trophy-desc', trophy.desc));
    } else {
      body.appendChild(el('p', 'trophy-desc spoiler-hidden', 'Story details hidden until earned.'));
    }

    const tags = el('div', 'trophy-tags');
    tags.appendChild(el('span', 'tag', trophy.kind));
    if (trophy.chapter) tags.appendChild(el('span', 'tag', trophy.chapter));
    if (trophy.hidden) tags.appendChild(el('span', 'tag tag-spoiler', 'hidden on PS5'));
    if (trophy.missable) tags.appendChild(el('span', 'tag tag-missable', 'possibly missable'));
    body.appendChild(tags);

    if (trophy.goal) body.appendChild(counterControl(guide, trophy, state, handlers));
    row.appendChild(body);

    const grade = el('span', `grade grade-${trophy.grade}`, trophy.grade);
    row.appendChild(grade);
    list.appendChild(row);
  }
}

/** Fill and show the guide drawer for one trophy. */
export function openDrawer(guide, trophy, state, handlers) {
  const drawer = document.getElementById('detail-drawer');
  const body = document.getElementById('drawer-body');
  if (!drawer || !body) return;
  body.replaceChildren();

  const earned = isEarned(state, trophy.id);
  body.appendChild(el('span', `grade grade-${trophy.grade}`, trophy.grade));
  body.appendChild(el('h2', null, trophy.name));
  body.appendChild(el('p', 'trophy-desc', trophy.desc));

  const meta = el('p');
  const bits = [];
  if (trophy.chapter) bits.push(trophy.chapter);
  bits.push(trophy.hidden ? 'Hidden on PlayStation until earned' : 'Shown on PlayStation');
  if (trophy.missable) bits.push('Possibly missable — see the guide');
  meta.textContent = bits.join(' · ');
  body.appendChild(meta);

  const tick = el('button', null, earned ? '✓ Earned — unmark' : 'Mark as earned');
  tick.type = 'button';
  tick.addEventListener('click', () => {
    handlers.onToggle(trophy.id);
    openDrawer(guide, guide.byId.get(trophy.id), state, handlers);
  });
  body.appendChild(tick);

  if (trophy.goal) {
    body.appendChild(el('h3', null, 'Progress'));
    const row = el('p');
    row.appendChild(counterControl(guide, trophy, state, handlers));
    body.appendChild(row);
  }

  body.appendChild(el('h3', null, 'Guide'));
  body.appendChild(el('p', null, trophy.guide));
  if (trophy.tips && trophy.tips.length > 0) {
    body.appendChild(el('h3', null, 'Tips'));
    const tips = el('ul');
    for (const tip of trophy.tips) tips.appendChild(el('li', null, tip));
    body.appendChild(tips);
  }

  const sources = sourcesOf(guide, trophy);
  body.appendChild(el('h3', null, 'Sources'));
  const list = el('ul', 'source-list');
  for (const source of sources) {
    const item = el('li');
    const link = el('a', null, source.label);
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener';
    item.appendChild(link);
    list.appendChild(item);
  }
  body.appendChild(list);

  drawer.hidden = false;
}

/** Hide the guide drawer. */
export function closeDrawer() {
  const drawer = document.getElementById('detail-drawer');
  if (drawer) drawer.hidden = true;
}
