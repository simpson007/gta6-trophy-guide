// Leonida Trophy Guide: loads the trophy list and roadmap, renders the tracker,
// and keeps progress in localStorage. No network at run time: both data files
// live under app/data/ and every link is followed only when the reader clicks it.
const STORE_KEY = 'gta6-trophy-guide-v1';
const KINDS = [
  ['all', 'All'],
  ['story', 'Story'],
  ['missable', 'Missable'],
  ['collectibles', 'Collectibles'],
  ['activities', 'Activities'],
  ['side', 'Side quests'],
  ['robbery', 'Robberies'],
  ['online', 'Online'],
];
const KIND_LABEL = {
  story: 'Story', side: 'Side quest', collectibles: 'Collectible', activities: 'Activity',
  robbery: 'Robbery', exploration: 'Exploration', money: 'Money', misc: 'Moment',
  completion: 'Completion', platinum: 'Platinum',
};

const params = new URLSearchParams(location.search);
const state = {
  kind: params.get('filter') || 'all',
  grade: params.get('grade') || 'all',
  query: params.get('q') || '',
  spoiler: params.get('spoiler') !== 'off',
  earnedOnly: params.get('earned') === 'only',
  openId: Number(params.get('open')) || null,
};

let stored = {};
try { stored = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}'); } catch { stored = {}; }
if (stored.spoiler !== undefined) state.spoiler = stored.spoiler;
const earned = new Set(Array.isArray(stored.earned) ? stored.earned : []);

const doc = await (await fetch('data/trophies.json')).json();
const roadmapDoc = await (await fetch('data/roadmap.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

function saveProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify({ earned: [...earned], spoiler: state.spoiler }));
}

function gradeWord(grade) {
  return grade === 'platinum' ? 'Platinum' : grade[0].toUpperCase() + grade.slice(1);
}

function renderIntro() {
  document.getElementById('beforeList').replaceChildren(
    ...roadmapDoc.beforeYouStart.map((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      return li;
    }),
  );
  document.getElementById('estimate').textContent = roadmapDoc.estimate;
  const list = document.getElementById('sourceList');
  list.replaceChildren(
    ...Object.values(doc.sourceList).map((s) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.label;
      a.rel = 'noopener';
      li.append(a);
      return li;
    }),
  );
}

function renderRoadmap() {
  const list = document.getElementById('roadmapList');
  list.replaceChildren(
    ...roadmapDoc.stages.map((stage) => {
      const li = document.createElement('li');
      const h = document.createElement('h3');
      h.textContent = stage.name;
      const hours = document.createElement('p');
      hours.className = 'hours';
      hours.textContent = stage.hours;
      const text = document.createElement('p');
      text.textContent = stage.text;
      const chips = document.createElement('div');
      chips.className = 'chips';
      for (const id of stage.trophyIds) {
        const t = byId.get(id);
        if (!t) continue;
        const chip = document.createElement('a');
        chip.className = 'chip';
        chip.href = `#trophy-${t.id}`;
        chip.textContent = t.hidden && state.spoiler && !earned.has(t.name) ? `Hidden trophy #${t.id}` : t.name;
        chip.addEventListener('click', (event) => {
          event.preventDefault();
          state.kind = 'all';
          state.grade = 'all';
          state.query = '';
          state.earnedOnly = false;
          renderControls();
          renderList();
          document.getElementById(`trophy-${t.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        chips.append(chip);
      }
      li.append(h, hours, text, chips);
      return li;
    }),
  );
}

function isSpoiled(t) {
  return state.spoiler && t.hidden && !earned.has(t.name);
}

function trophyMatches(t) {
  if (state.kind === 'missable' && !t.missable) return false;
  if (state.kind === 'online') return false;
  if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
  if (state.grade !== 'all' && t.grade !== state.grade) return false;
  if (state.earnedOnly && !earned.has(t.name)) return false;
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = `${t.name} ${t.description} ${t.guide} ${t.chapter ?? ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  document.getElementById('progressText').textContent = `${done} of ${total} earned`;
  document.getElementById('progressPct').textContent = `${Math.round((done / total) * 100)}%`;
  document.getElementById('progressFill').style.width = `${(done / total) * 100}%`;
  const counts = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${gradeWord(g)} ${trophies.filter((t) => t.grade === g && earned.has(t.name)).length}/${trophies.filter((t) => t.grade === g).length}`)
    .join(' · ');
  document.getElementById('gradeCounts').textContent = counts;
}

function renderControls() {
  const wrap = document.getElementById('kindFilters');
  wrap.replaceChildren(
    ...KINDS.map(([value, label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'kind-btn';
      b.textContent = label;
      b.setAttribute('aria-pressed', String(state.kind === value));
      b.addEventListener('click', () => {
        state.kind = value;
        renderControls();
        renderList();
      });
      return b;
    }),
  );
  document.getElementById('gradeFilter').value = state.grade;
  document.getElementById('spoilerToggle').checked = state.spoiler;
  document.getElementById('earnedOnly').checked = state.earnedOnly;
  document.getElementById('search').value = state.query;
}

function renderList() {
  const list = document.getElementById('trophyList');
  const empty = document.getElementById('emptyNote');
  const note = document.getElementById('filterNote');
  const shown = trophies.filter(trophyMatches);

  if (state.kind === 'online') {
    note.textContent = 'There are no online trophies: all 55 are single-player and offline (PowerPyx). Nothing to filter here.';
  } else if (state.kind === 'missable') {
    note.textContent = 'Only 1 trophy is reported as possibly missable (PowerPyx, GTABase). Story trophies unlock automatically and cannot be missed.';
  } else if (shown.length === trophies.length) {
    note.textContent = '';
  } else {
    note.textContent = `Showing ${shown.length} of ${trophies.length} trophies.`;
  }

  list.replaceChildren(
    ...shown.map((t) => {
      const spoiled = isSpoiled(t);
      const card = document.createElement('article');
      card.className = `trophy${earned.has(t.name) ? ' earned' : ''}`;
      card.id = `trophy-${t.id}`;

      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = earned.has(t.name);
      box.setAttribute('aria-label', `Mark ${spoiled ? `hidden trophy ${t.id}` : t.name} as earned`);
      box.addEventListener('change', () => {
        if (box.checked) earned.add(t.name);
        else earned.delete(t.name);
        saveProgress();
        renderProgress();
        renderList();
      });

      const body = document.createElement('div');
      const head = document.createElement('div');
      head.className = 'trophy-head';
      const title = document.createElement('h3');
      title.textContent = spoiled ? `Hidden trophy #${t.id}` : t.name;
      const grade = document.createElement('span');
      grade.className = `grade ${t.grade}`;
      grade.textContent = gradeWord(t.grade);
      head.append(title, grade);
      if (t.hidden) {
        const tag = document.createElement('span');
        tag.className = 'tag hidden-t';
        tag.textContent = 'Hidden on PS5';
        head.append(tag);
      }
      if (t.missable) {
        const tag = document.createElement('span');
        tag.className = 'tag missable';
        tag.textContent = 'Possibly missable';
        head.append(tag);
      }
      const kindTag = document.createElement('span');
      kindTag.className = 'tag';
      kindTag.textContent = KIND_LABEL[t.kind] ?? t.kind;
      head.append(kindTag);
      if (t.countLabel) {
        const count = document.createElement('span');
        count.className = 'tag';
        count.textContent = t.countLabel;
        head.append(count);
      }

      const official = document.createElement('p');
      official.className = 'official';
      official.textContent = spoiled ? 'Hidden until earned — the name and description stay secret on PlayStation too.' : t.description;

      const guide = document.createElement('p');
      guide.className = 'guide';
      if (spoiled) {
        guide.classList.add('spoiled');
        guide.textContent = 'Spoilers hidden. Tick this trophy as earned to reveal its guide.';
      } else {
        guide.textContent = t.guide;
      }

      const meta = document.createElement('p');
      meta.className = 'meta';
      if (!spoiled && t.chapter) {
        const chapter = document.createElement('span');
        chapter.className = 'chapter';
        chapter.textContent = t.chapter;
        meta.append(chapter, document.createTextNode(` · Roadmap stage ${t.roadmap}`));
      } else {
        meta.textContent = `Roadmap stage ${t.roadmap}`;
      }
      if (t.missable && t.missableNote) {
        meta.append(document.createTextNode(' · '), document.createTextNode(t.missableNote));
      }

      const sources = document.createElement('p');
      sources.className = 'sources';
      if (!spoiled) {
        sources.append(document.createTextNode('Sources: '));
        t.sources.forEach((key, i) => {
          const s = doc.sourceList[key];
          if (!s) return;
          if (i > 0) sources.append(document.createTextNode(' · '));
          const a = document.createElement('a');
          a.href = s.url;
          a.textContent = s.label;
          a.rel = 'noopener';
          sources.append(a);
        });
      }

      body.append(head, official, guide, meta, sources);
      card.append(box, body);
      return card;
    }),
  );

  empty.hidden = shown.length !== 0;
  if (shown.length === 0 && state.kind !== 'online') {
    empty.textContent = 'No trophies match these filters. Clear the search or pick another kind.';
  }
  renderProgress();
}

function wireControls() {
  document.getElementById('gradeFilter').addEventListener('change', (e) => {
    state.grade = e.target.value;
    renderList();
  });
  document.getElementById('search').addEventListener('input', (e) => {
    state.query = e.target.value;
    renderList();
  });
  document.getElementById('spoilerToggle').addEventListener('change', (e) => {
    state.spoiler = e.target.checked;
    saveProgress();
    renderRoadmap();
    renderList();
  });
  document.getElementById('earnedOnly').addEventListener('change', (e) => {
    state.earnedOnly = e.target.checked;
    renderList();
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    const data = { app: 'gta6-trophy-guide', exportedAt: new Date().toISOString(), earned: [...earned] };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = 'gta6-trophy-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const names = new Set(trophies.map((t) => t.name));
      const imported = (data.earned ?? data).filter((name) => names.has(name));
      earned.clear();
      for (const name of imported) earned.add(name);
      saveProgress();
      renderList();
    } catch {
      document.getElementById('filterNote').textContent = 'That file could not be imported: it is not a progress file from this guide.';
    }
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned trophies? This cannot be undone (unless you exported a backup).')) return;
    earned.clear();
    saveProgress();
    renderList();
  });
}

renderIntro();
renderRoadmap();
renderControls();
wireControls();
renderList();
if (state.openId && byId.has(state.openId)) {
  document.getElementById(`trophy-${state.openId}`)?.scrollIntoView({ block: 'center' });
}
