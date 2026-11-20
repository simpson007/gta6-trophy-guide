/* Boot: load the guide, wire the controls, and keep the views in sync.
   Deep links: #trophy=<id> opens a trophy's guide; ?demo=1 seeds a mid-run
   state for screenshots when no progress is saved yet. */

import { loadGuide } from './data.js';
import {
  loadState, saveState, toggleEarned, setCount, isEarned,
  exportText, parseImport, seedDemo,
} from './state.js';
import { renderPhases, renderChecklist, renderProgress, openDrawer, closeDrawer } from './views.js';

const params = new URLSearchParams(window.location.search);

/** Read #trophy=<id> from the URL hash, if present. */
function hashTrophyId() {
  const hash = window.location.hash || '';
  const match = /#trophy=([A-Za-z0-9-]+)/.exec(hash);
  return match ? match[1] : null;
}

/** Re-render every view from the current state. */
function refresh(guide, state) {
  renderProgress(guide, state);
  renderPhases(guide, state, handlers);
  renderChecklist(guide, state, handlers);
  const search = document.getElementById('search');
  if (search && search.value !== state.query) search.value = state.query;
  const spoiler = document.getElementById('spoiler-toggle');
  if (spoiler) spoiler.checked = state.spoiler === true;
  const chips = document.querySelectorAll('#kind-chips .chip');
  for (const chip of chips) {
    chip.classList.toggle('chip-active', chip.dataset.kind === state.kind);
  }
  const campaignView = document.getElementById('campaign-view');
  const checklistView = document.getElementById('checklist-view');
  const campaignBtn = document.getElementById('view-campaign-btn');
  const checklistBtn = document.getElementById('view-checklist-btn');
  const showingChecklist = state.view === 'checklist';
  if (campaignView) campaignView.hidden = showingChecklist;
  if (checklistView) checklistView.hidden = !showingChecklist;
  if (campaignBtn) campaignBtn.classList.toggle('view-tab-active', !showingChecklist);
  if (checklistBtn) checklistBtn.classList.toggle('view-tab-active', showingChecklist);
}

let guide = null;
let state = loadState();
if (!state.view) state.view = 'campaign';

const handlers = {
  onToggle(id) {
    toggleEarned(state, id);
    refresh(guide, state);
  },
  onCount(id, value) {
    const trophy = guide.byId.get(id);
    if (!trophy || !trophy.goal) return;
    setCount(state, id, value, trophy.goal.target);
    refresh(guide, state);
    const open = document.getElementById('detail-drawer');
    if (open && !open.hidden) openDrawer(guide, trophy, state, handlers);
  },
  onOpen(id) {
    const trophy = guide.byId.get(id);
    if (!trophy) return;
    openDrawer(guide, trophy, state, handlers);
  },
};

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function boot() {
  guide = await loadGuide();

  // A demo seed only when asked for and when nothing is saved yet.
  let hadSaved = false;
  try { hadSaved = localStorage.getItem('leonida-campaign-v1') !== null; } catch { hadSaved = false; }
  if (params.get('demo') === '1' && !hadSaved) state = seedDemo();

  // Deep-linkable view state: ?view=checklist and ?spoiler=1.
  if (params.get('view') === 'checklist') state.view = 'checklist';
  if (params.get('spoiler') === '1') state.spoiler = true;

  const search = document.getElementById('search');
  if (search) {
    search.addEventListener('input', () => {
      state.query = search.value;
      saveState(state);
      renderChecklist(guide, state, handlers);
    });
  }

  const spoiler = document.getElementById('spoiler-toggle');
  if (spoiler) {
    spoiler.addEventListener('change', () => {
      state.spoiler = spoiler.checked;
      saveState(state);
      refresh(guide, state);
    });
  }

  const chips = document.querySelectorAll('#kind-chips .chip');
  for (const chip of chips) {
    chip.addEventListener('click', () => {
      state.kind = chip.dataset.kind || 'all';
      state.view = 'checklist';
      saveState(state);
      refresh(guide, state);
    });
  }

  const campaignBtn = document.getElementById('view-campaign-btn');
  const checklistBtn = document.getElementById('view-checklist-btn');
  if (campaignBtn) {
    campaignBtn.addEventListener('click', () => {
      state.view = 'campaign';
      saveState(state);
      refresh(guide, state);
    });
  }
  if (checklistBtn) {
    checklistBtn.addEventListener('click', () => {
      state.view = 'checklist';
      saveState(state);
      refresh(guide, state);
    });
  }

  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => download('leonida-campaign-progress.json', exportText(state)));
  }

  const importFile = document.getElementById('import-file');
  if (importFile) {
    importFile.addEventListener('change', async () => {
      const file = importFile.files && importFile.files[0];
      if (!file) return;
      const text = await file.text();
      const imported = parseImport(text);
      if (imported) {
        state = imported;
        if (!state.view) state.view = 'checklist';
        saveState(state);
        refresh(guide, state);
      } else {
        window.alert('That file is not a Leonida Campaign progress export.');
      }
      importFile.value = '';
    });
  }

  const drawerClose = document.getElementById('drawer-close');
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDrawer();
  });

  const missableLink = document.querySelector('[data-open-trophy]');
  if (missableLink) {
    missableLink.addEventListener('click', (event) => {
      event.preventDefault();
      handlers.onOpen('positive-mental-attitude');
    });
  }

  window.addEventListener('hashchange', () => {
    const id = hashTrophyId();
    if (id) handlers.onOpen(id);
  });

  refresh(guide, state);

  const deepLink = hashTrophyId();
  if (deepLink) handlers.onOpen(deepLink);
}

boot().catch((error) => {
  const main = document.querySelector('main');
  if (main) {
    const note = document.createElement('p');
    note.textContent = `The guide could not be loaded (${error.message}). Serve the app/ folder over HTTP and open index.html again.`;
    main.prepend(note);
  }
});
