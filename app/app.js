// Leonida Ledger — GTA VI trophy guide & tracker.
// Static, offline: the only file it loads at run time is its own data/trophies.json.
// Progress lives in localStorage; export writes a file, import reads one back.
const EARNED_KEY = 'leonida-ledger-earned-v1';
const SPOILER_KEY = 'leonida-ledger-spoilers-v1';
const DATA_URL = 'data/trophies.json';

// Fixed demo progress used only for ?shot= screenshot scenes: 13 earned, deterministic.
const SHOT_SEED_IDS = [2, 3, 8, 15, 16, 17, 21, 28, 31, 35, 42, 52, 53];

const KIND_LABELS = {
  all: 'All', story: 'Story', missable: 'Missable', collectibles: 'Collectibles',
  activities: 'Activities', robbery: 'Robbery', money: 'Money',
  exploration: 'Exploration', side: 'Side quests', online: 'Online',
};
const KIND_FILTERS = ['all', 'story', 'missable', 'collectibles', 'activities', 'robbery', 'money', 'exploration', 'side', 'online'];
const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

const ROADMAP_STEPS = [
  {
    n: 1, title: 'Step 1 — Play the story', hours: '60–80 hours',
    text: 'Finish all 5 chapters and take optional missions as they appear. Scan every new vehicle with WAiNK and study every new animal through binoculars as you go — both feed the 100% checklist. Do the Chapter 1 balcony meditation before you leave Chapter 1.',
  },
  {
    n: 2, title: 'Step 2 — 100% checklist', hours: 'About 100 hours',
    text: 'After the credits, open Progress, Stats, 100% Completion and work it down. The targets are lenient — 70 of 80 challenges, 200 of 277 vehicles, 100 of 255 animals, 300 stunts, 15 of 18 meditations — but all robberies, shooting ranges, drone races and target decks are required in full.',
  },
  {
    n: 3, title: 'Step 3 — Strangers & cleanup', hours: 'About 10 hours',
    text: 'Finish the 8 Strangers & Freaks strands, the character questlines, the partner trophies and the money trophies. The five trophies whose methods are still unconfirmed belong here too — check back as guides verify them.',
  },
];

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const shotMode = shot === 'checklist' || shot === 'roadmap' || shot === 'tracker' || shot === 'guide';

let trophies = [];
let earned = new Set();
let spoilerOn = false;
let kindFilter = 'all';
let gradeFilter = 'all';
let searchText = '';
let earnedOnly = false;
let selectedId = null;
let currentView = 'checklist';

const $ = (id) => document.getElementById(id);

function loadStored() {
  try { earned = new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]')); } catch { earned = new Set(); }
  spoilerOn = localStorage.getItem(SPOILER_KEY) === '1';
}

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  $('savedNote').textContent = 'Progress saved in this browser ✓';
}

function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, spoilerOn ? '1' : '0');
}

function isSpoiled(t) {
  return spoilerOn && t.kind === 'story' && !earned.has(t.id);
}

function trophyById(id) {
  return trophies.find((t) => t.id === id);
}

function visibleTrophies() {
  const q = searchText.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kindFilter === 'missable' && !t.missable) return false;
    if (kindFilter === 'online') return false; // No online trophies: all 55 unlock offline.
    if (kindFilter !== 'all' && kindFilter !== 'missable' && t.kind !== kindFilter) return false;
    if (gradeFilter !== 'all' && t.grade !== gradeFilter) return false;
    if (earnedOnly && !earned.has(t.id)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderProgress() {
  const n = earned.size;
  const pct = Math.round((n / trophies.length) * 100);
  $('earnedCount').textContent = String(n);
  $('progressFill').style.width = `${pct}%`;
  $('progressBar').setAttribute('aria-valuenow', String(n));
  $('platinumNote').textContent = n === trophies.length
    ? 'Platinum earned — Vice Got a Price!'
    : `${pct}% to the platinum — Vice Got a Price!`;
  const counts = {};
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const total = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
    counts[g] = `${GRADE_LABELS[g]} ${got}/${total}`;
  }
  $('gradeCounts').textContent = Object.values(counts).join(' · ');
}

function renderList() {
  const list = visibleTrophies();
  const el = $('trophyList');
  el.replaceChildren();
  $('emptyNote').hidden = list.length > 0;
  if (kindFilter === 'online') {
    $('emptyNote').hidden = false;
    $('emptyNote').textContent = 'No online trophies — all 55 trophies unlock offline in single-player.';
  } else {
    $('emptyNote').textContent = 'No trophies match these filters.';
  }
  $('showingLine').textContent = `Showing ${list.length} of ${trophies.length} trophies · ${earned.size} earned`;
  for (const t of list) {
    const li = document.createElement('li');
    li.className = earned.has(t.id) ? 'earned' : '';
    if (selectedId === t.id) li.classList.add('selected');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      saveEarned();
      renderAll();
    });
    const medal = document.createElement('span');
    medal.className = `medal ${t.grade}`;
    medal.title = GRADE_LABELS[t.grade];
    const main = document.createElement('div');
    const name = document.createElement('div');
    name.className = 't-name';
    name.textContent = isSpoiled(t) ? 'Hidden story trophy' : t.name;
    const desc = document.createElement('div');
    desc.className = isSpoiled(t) ? 't-desc spoiled' : 't-desc';
    desc.textContent = isSpoiled(t) ? 'Hidden until earned — turn spoilers off or earn it to reveal.' : t.description;
    const tags = document.createElement('div');
    tags.className = 't-tags';
    const gradeTag = document.createElement('span');
    gradeTag.className = 'tag grade-tag';
    gradeTag.textContent = GRADE_LABELS[t.grade];
    tags.append(gradeTag);
    if (t.kind !== 'platinum') {
      const kindTag = document.createElement('span');
      kindTag.className = 'tag';
      kindTag.textContent = KIND_LABELS[t.kind] ?? t.kind;
      tags.append(kindTag);
    }
    if (t.hidden) {
      const h = document.createElement('span');
      h.className = 'tag hidden-tag';
      h.textContent = 'Hidden';
      tags.append(h);
    }
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'tag missable';
      m.textContent = '⚠ Missable';
      tags.append(m);
    }
    main.append(name, desc, tags);
    const gradeWord = document.createElement('span');
    gradeWord.className = 't-grade-word';
    gradeWord.textContent = GRADE_LABELS[t.grade];
    li.append(box, medal, main, gradeWord);
    li.addEventListener('click', () => { selectedId = t.id; renderAll(); });
    el.append(li);
  }
}

function renderDetail() {
  const pane = $('detailPane');
  pane.replaceChildren();
  const t = selectedId ? trophyById(selectedId) : null;
  if (!t) {
    const h = document.createElement('h2');
    h.textContent = 'Pick a trophy';
    const p = document.createElement('p');
    p.textContent = 'Click any trophy in the list to see its guide and sources. Tick the box when you earn it — your progress is saved in this browser.';
    pane.append(h, p);
    return;
  }
  if (isSpoiled(t)) {
    const h = document.createElement('h2');
    h.textContent = 'Hidden story trophy';
    const note = document.createElement('p');
    note.className = 'spoiler-note';
    note.textContent = 'Spoilers are hidden: this is a story trophy you have not earned yet. Turn off “Hide story spoilers” to reveal its name, description and guide — or earn it in the game first.';
    pane.append(h, note);
    return;
  }
  const h = document.createElement('h2');
  h.textContent = t.name;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `“${t.description}”`;
  const meta = document.createElement('div');
  meta.className = 'detail-meta';
  const metaItems = [[GRADE_LABELS[t.grade], 'grade-tag'], [`Roadmap step ${t.stage}`, '']];
  if (t.kind !== 'platinum') metaItems.splice(1, 0, [KIND_LABELS[t.kind] ?? t.kind, '']);
  for (const [label, cls] of metaItems) {
    const s = document.createElement('span');
    s.className = `tag ${cls}`;
    s.textContent = label;
    meta.append(s);
  }
  if (t.hidden) {
    const s = document.createElement('span');
    s.className = 'tag hidden-tag';
    s.textContent = 'Hidden on PlayStation';
    meta.append(s);
  }
  if (t.missable) {
    const s = document.createElement('span');
    s.className = 'tag missable';
    s.textContent = '⚠ Potentially missable';
    meta.append(s);
  }
  pane.append(h, official, meta);
  if (t.missable) {
    const call = document.createElement('p');
    call.className = 'missable-callout';
    call.textContent = 'Do this in Chapter 1, before the story moves on — it may not come back. Keep a manual save at the start of Chapter 1 as insurance.';
    pane.append(call);
  }
  // Sources first, then the guide: a reader sees where each fact comes from at a glance.
  const sh = document.createElement('h3');
  sh.textContent = 'Sources';
  const ul = document.createElement('ul');
  ul.className = 'sources';
  for (const s of t.sources) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    li.append(a);
    ul.append(li);
  }
  pane.append(sh, ul);
  const gh = document.createElement('h3');
  gh.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = t.guide;
  pane.append(gh, guide);
  const actions = document.createElement('div');
  actions.className = 'detail-actions';
  const mark = document.createElement('button');
  mark.type = 'button';
  mark.textContent = earned.has(t.id) ? 'Mark as not earned' : 'Mark as earned';
  mark.addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id); else earned.add(t.id);
    saveEarned();
    renderAll();
  });
  actions.append(mark);
  pane.append(actions);
}

function renderRoadmap() {
  const host = $('roadmapSteps');
  host.replaceChildren();
  for (const step of ROADMAP_STEPS) {
    const card = document.createElement('div');
    card.className = 'step';
    const h = document.createElement('h3');
    h.textContent = step.title;
    const hours = document.createElement('p');
    hours.className = 'hours';
    hours.textContent = step.hours;
    const text = document.createElement('p');
    text.textContent = step.text;
    const mine = trophies.filter((t) => t.stage === step.n);
    const got = mine.filter((t) => earned.has(t.id)).length;
    const prog = document.createElement('p');
    prog.className = 'step-progress';
    prog.textContent = `${got} / ${mine.length} trophies in this step`;
    const ul = document.createElement('ul');
    for (const t of mine) {
      const li = document.createElement('li');
      if (earned.has(t.id)) li.className = 'earned-step';
      li.textContent = `${earned.has(t.id) ? '✓ ' : ''}${isSpoiled(t) ? 'Hidden story trophy' : t.name} — ${GRADE_LABELS[t.grade]}${t.missable ? ' · ⚠ missable' : ''}`;
      ul.append(li);
    }
    card.append(h, hours, text, prog, ul);
    host.append(card);
  }
}

function renderMissables() {
  const host = $('missableList');
  host.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const card = document.createElement('div');
    card.className = 'missable-card';
    const h = document.createElement('h3');
    h.textContent = `⚠ ${t.name} — ${GRADE_LABELS[t.grade]}`;
    const d = document.createElement('p');
    d.textContent = `Official description: “${t.description}”`;
    const g = document.createElement('p');
    g.textContent = t.guide;
    const sh = document.createElement('h3');
    sh.textContent = 'Sources';
    const ul = document.createElement('ul');
    ul.className = 'sources';
    for (const s of t.sources) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.name;
      li.append(a);
      ul.append(li);
    }
    card.append(h, d, sh, ul, g);
    host.append(card);
  }
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function setView(view) {
  currentView = view;
  for (const btn of document.querySelectorAll('.tab')) {
    btn.classList.toggle('active', btn.dataset.view === view);
  }
  $('view-checklist').hidden = view !== 'checklist';
  $('view-roadmap').hidden = view !== 'roadmap';
  $('view-missables').hidden = view !== 'missables';
}

function buildFilters() {
  const host = $('kindFilters');
  for (const k of KIND_FILTERS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = KIND_LABELS[k];
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      kindFilter = k;
      for (const c of host.querySelectorAll('.chip')) c.classList.toggle('active', c.textContent === KIND_LABELS[k]);
      renderAll();
    });
    host.append(b);
  }
  host.querySelector('.chip').classList.add('active');
}

function exportProgress() {
  const payload = { game: 'Grand Theft Auto VI', tool: 'Leonida Ledger', earned: [...earned].sort((a, b) => a - b).map((id) => trophyById(id).name) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('bad file');
    const byName = new Map(trophies.map((t) => [t.name, t.id]));
    const next = new Set();
    for (const name of names) {
      if (byName.has(name)) next.add(byName.get(name));
    }
    earned = next;
    saveEarned();
    renderAll();
    $('savedNote').textContent = `Imported ${earned.size} earned trophies ✓`;
  } catch {
    $('savedNote').textContent = 'Import failed — that file is not a Leonida Ledger export.';
  }
}

async function boot() {
  const doc = await (await fetch(DATA_URL)).json();
  trophies = doc.trophies;
  loadStored();
  $('spoilerToggle').checked = spoilerOn;
  buildFilters();

  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });
  $('search').addEventListener('input', (e) => { searchText = e.target.value; renderAll(); });
  $('gradeFilter').addEventListener('change', (e) => { gradeFilter = e.target.value; renderAll(); });
  $('spoilerToggle').addEventListener('change', (e) => { spoilerOn = e.target.checked; saveSpoiler(); renderAll(); });
  $('earnedOnly').addEventListener('change', (e) => { earnedOnly = e.target.checked; renderAll(); });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importFile').addEventListener('change', (e) => {
    if (e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    earned = new Set();
    saveEarned();
    renderAll();
  });

  // Deterministic screenshot scenes (?shot=...): fixed progress, fixed view, fixed open guide.
  if (shotMode) {
    earned = new Set(SHOT_SEED_IDS);
    saveEarned();
    if (shot === 'checklist') { setView('checklist'); selectedId = 28; }
    if (shot === 'roadmap') { setView('roadmap'); }
    if (shot === 'tracker') {
      setView('checklist');
      spoilerOn = true;
      $('spoilerToggle').checked = true;
      saveSpoiler();
      selectedId = 3;
    }
    if (shot === 'guide') {
      setView('checklist');
      kindFilter = 'collectibles';
      selectedId = 30;
      document.querySelectorAll('#kindFilters .chip').forEach((c) => {
        c.classList.toggle('active', c.textContent === KIND_LABELS.collectibles);
      });
    }
  }
  renderAll();
}

boot();
