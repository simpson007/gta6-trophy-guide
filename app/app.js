// Leonida Trophy Guide: fetches the trophy list and roadmap (both local files),
// paints the tracker, and keeps earned trophies in localStorage. It makes no
// network request at run time: the data files sit under app/data/ and every link
// on the page only opens when the reader clicks it.
const STORE_KEY = 'leonida-trophy-tracker-v1';
const KIND_BUTTONS = [
  ['all', 'All'],
  ['story', 'Story'],
  ['missable', 'Missable'],
  ['collectibles', 'Collectibles'],
  ['activities', 'Activities'],
  ['side', 'Side quests'],
  ['robbery', 'Robberies'],
  ['online', 'Online'],
];
const KIND_WORD = {
  story: 'Story', side: 'Side quest', collectibles: 'Collectible', activities: 'Activity',
  robbery: 'Robbery', exploration: 'Exploration', money: 'Money', misc: 'Moment',
  completion: 'Completion', platinum: 'Platinum',
};

const query = new URLSearchParams(location.search);
const view = {
  kind: query.get('filter') || 'all',
  grade: query.get('grade') || 'all',
  text: query.get('q') || '',
  hideSpoilers: query.get('spoiler') !== 'off',
  onlyDone: query.get('earned') === 'only',
  openId: Number(query.get('open')) || null,
};

let saved = {};
try { saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}'); } catch { saved = {}; }
if (saved.hideSpoilers !== undefined) view.hideSpoilers = saved.hideSpoilers;
const done = new Set(Array.isArray(saved.earned) ? saved.earned : []);

const trophyDoc = await (await fetch('data/trophies.json')).json();
const roadmapDoc = await (await fetch('data/roadmap.json')).json();
const trophies = trophyDoc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

function storeProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify({ earned: [...done], hideSpoilers: view.hideSpoilers }));
}

function gradeLabel(grade) {
  return grade === 'platinum' ? 'Platinum' : grade[0].toUpperCase() + grade.slice(1);
}

function paintIntro() {
  document.getElementById('beforeList').replaceChildren(
    ...roadmapDoc.beforeYouStart.map((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      return li;
    }),
  );
  document.getElementById('estimate').textContent = roadmapDoc.estimate;
  document.getElementById('sourceList').replaceChildren(
    ...Object.values(trophyDoc.sourceList).map((s) => {
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

function paintRoadmap() {
  document.getElementById('roadmapList').replaceChildren(
    ...roadmapDoc.stages.map((stage) => {
      const li = document.createElement('li');
      const title = document.createElement('h3');
      title.textContent = stage.name;
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
        chip.textContent = masked(t) ? `Hidden trophy #${t.id}` : t.name;
        chip.addEventListener('click', (event) => {
          event.preventDefault();
          view.kind = 'all';
          view.grade = 'all';
          view.text = '';
          view.onlyDone = false;
          paintFilters();
          paintTrophies();
          document.getElementById(`trophy-${t.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        chips.append(chip);
      }
      li.append(title, hours, text, chips);
      return li;
    }),
  );
}

function masked(t) {
  return view.hideSpoilers && t.hidden && !done.has(t.name);
}

function matchesFilters(t) {
  if (view.kind === 'missable' && !t.missable) return false;
  if (view.kind === 'online') return false;
  if (view.kind !== 'all' && view.kind !== 'missable' && t.kind !== view.kind) return false;
  if (view.grade !== 'all' && t.grade !== view.grade) return false;
  if (view.onlyDone && !done.has(t.name)) return false;
  if (view.text) {
    const q = view.text.toLowerCase();
    const hay = `${t.name} ${t.description} ${t.guide} ${t.chapter ?? ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function paintProgress() {
  const total = trophies.length;
  const count = done.size;
  document.getElementById('progressText').textContent = `${count} of ${total} earned`;
  document.getElementById('progressPct').textContent = `${Math.round((count / total) * 100)}%`;
  document.getElementById('progressFill').style.width = `${(count / total) * 100}%`;
  document.getElementById('gradeCounts').textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${gradeLabel(g)} ${trophies.filter((t) => t.grade === g && done.has(t.name)).length}/${trophies.filter((t) => t.grade === g).length}`)
    .join(' · ');
}

function paintFilters() {
  document.getElementById('kindFilters').replaceChildren(
    ...KIND_BUTTONS.map(([value, label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'kind-btn';
      b.textContent = label;
      b.setAttribute('aria-pressed', String(view.kind === value));
      b.addEventListener('click', () => {
        view.kind = value;
        paintFilters();
        paintTrophies();
      });
      return b;
    }),
  );
  document.getElementById('gradeFilter').value = view.grade;
  document.getElementById('spoilerToggle').checked = view.hideSpoilers;
  document.getElementById('earnedOnly').checked = view.onlyDone;
  document.getElementById('search').value = view.text;
}

function trophyCard(t) {
  const hidden = masked(t);
  const card = document.createElement('article');
  card.className = `trophy${done.has(t.name) ? ' earned' : ''}`;
  card.id = `trophy-${t.id}`;

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = done.has(t.name);
  box.setAttribute('aria-label', `Mark ${hidden ? `hidden trophy ${t.id}` : t.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) done.add(t.name);
    else done.delete(t.name);
    storeProgress();
    paintProgress();
    paintTrophies();
  });

  const body = document.createElement('div');
  const head = document.createElement('div');
  head.className = 'trophy-head';
  const title = document.createElement('h3');
  title.textContent = hidden ? `Hidden trophy #${t.id}` : t.name;
  const grade = document.createElement('span');
  grade.className = `grade ${t.grade}`;
  grade.textContent = gradeLabel(t.grade);
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
  kindTag.textContent = KIND_WORD[t.kind] ?? t.kind;
  head.append(kindTag);
  if (t.countLabel) {
    const count = document.createElement('span');
    count.className = 'tag';
    count.textContent = t.countLabel;
    head.append(count);
  }

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hidden ? 'Hidden until earned — the name and description stay secret on PlayStation too.' : t.description;

  const guide = document.createElement('p');
  guide.className = 'guide';
  if (hidden) {
    guide.classList.add('spoiled');
    guide.textContent = 'Spoilers hidden. Tick this trophy as earned to reveal its guide.';
  } else {
    guide.textContent = t.guide;
  }

  const meta = document.createElement('p');
  meta.className = 'meta';
  if (!hidden && t.chapter) {
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
  if (!hidden) {
    sources.append(document.createTextNode('Sources: '));
    t.sources.forEach((key, i) => {
      const s = trophyDoc.sourceList[key];
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
}

function paintTrophies() {
  const list = document.getElementById('trophyList');
  const empty = document.getElementById('emptyNote');
  const note = document.getElementById('filterNote');
  const shown = trophies.filter(matchesFilters);

  if (view.kind === 'online') {
    note.textContent = 'There are no online trophies: all 55 are single-player and offline (PowerPyx). Nothing to filter here.';
  } else if (view.kind === 'missable') {
    note.textContent = 'Only 1 trophy is reported as possibly missable (PowerPyx, GTABase). Story trophies unlock automatically and cannot be missed.';
  } else if (shown.length === trophies.length) {
    note.textContent = '';
  } else {
    note.textContent = `Showing ${shown.length} of ${trophies.length} trophies.`;
  }

  list.replaceChildren(...shown.map(trophyCard));
  empty.hidden = shown.length !== 0;
  if (shown.length === 0 && view.kind !== 'online') {
    empty.textContent = 'No trophies match these filters. Clear the search or pick another kind.';
  }
  paintProgress();
}

function bindControls() {
  document.getElementById('gradeFilter').addEventListener('change', (e) => {
    view.grade = e.target.value;
    paintTrophies();
  });
  document.getElementById('search').addEventListener('input', (e) => {
    view.text = e.target.value;
    paintTrophies();
  });
  document.getElementById('spoilerToggle').addEventListener('change', (e) => {
    view.hideSpoilers = e.target.checked;
    storeProgress();
    paintRoadmap();
    paintTrophies();
  });
  document.getElementById('earnedOnly').addEventListener('change', (e) => {
    view.onlyDone = e.target.checked;
    paintTrophies();
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    const data = { app: 'gta6-trophy-guide', exportedAt: new Date().toISOString(), earned: [...done] };
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
      done.clear();
      for (const name of imported) done.add(name);
      storeProgress();
      paintTrophies();
    } catch {
      document.getElementById('filterNote').textContent = 'That file could not be imported: it is not a progress file from this guide.';
    }
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned trophies? This cannot be undone (unless you exported a backup).')) return;
    done.clear();
    storeProgress();
    paintTrophies();
  });
}

paintIntro();
paintRoadmap();
paintFilters();
bindControls();
paintTrophies();
if (view.openId && byId.has(view.openId)) {
  document.getElementById(`trophy-${view.openId}`)?.scrollIntoView({ block: 'center' });
}
