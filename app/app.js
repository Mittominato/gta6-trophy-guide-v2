// Leonida Trophy Guide — boot, state and toolbar wiring.
//
// The guide loads its trophy data from data/trophies.json (the only fetch
// the app makes, and it is one of its own files), then renders the checklist
// and the roadmap. Progress is a set of earned trophy ids kept in
// localStorage by storage.js. The URL carries the view so screenshots and
// sharing can deep-link: ?view=roadmap, ?filter=<kind>, ?open=<id 1-55>,
// ?spoiler=on|off, ?demo=1 (ticks three early story trophies in memory only,
// to show the progress bar — it never writes to localStorage).

import { renderChecklist, renderDetail, renderRoadmap } from './render.js';
import {
  buildExportFile,
  clearEarned,
  downloadText,
  loadEarned,
  loadSpoilersOn,
  parseImportFile,
  saveEarned,
  saveSpoilersOn,
} from './storage.js';

const DATA_URL = 'data/trophies.json';

// --- element handles ---

const $ = (id) => document.getElementById(id);
const listEl = $('trophyCards');
const emptyEl = $('emptyMsg');
const detailPanel = $('detailSection');
const roadmapSection = $('roadmapSection');
const checklistSection = $('checklistSection');
const searchBox = $('searchBox');
const gradeSelect = $('gradeSelect');
const earnedSelect = $('earnedSelect');
const kindChips = $('kindChips');
const tabChecklist = $('tabChecklist');
const tabRoadmap = $('tabRoadmap');
const spoilerBox = $('spoilerBox');
const exportButton = $('exportButton');
const importInput = $('importInput');
const resetButton = $('resetButton');
const resultLine = $('resultLine');
const missableNote = $('missableNote');
const missableNoteText = $('missableNoteText');
const missableNoteButton = $('missableNoteButton');
const progressBig = $('progressBig');
const barFill = $('barFill');
const progressGrades = $('progressGrades');
const progressNext = $('progressNext');

// --- state ---

const params = new URLSearchParams(location.search);
let data = null;
let earned = loadEarned();
let spoilersOn = params.get('spoiler') === 'on'
  ? true
  : params.get('spoiler') === 'off'
    ? false
    : loadSpoilersOn();
let activeKind = params.get('filter') ?? 'all';
let activeView = params.get('view') === 'roadmap' ? 'roadmap' : 'checklist';
let openId = Number(params.get('open') ?? 0) || null;
let demoEarned = new Set();
if (params.get('demo') === '1') demoEarned = new Set([2, 3, 8]);

// The demo set is shown merged with the stored set, but never persisted.
function shownEarned() {
  return new Set([...earned, ...demoEarned]);
}

// --- filtering ---

function visibleTrophies() {
  const query = searchBox.value.trim().toLowerCase();
  const grade = gradeSelect.value;
  const earnedFilter = earnedSelect.value;
  const shown = shownEarned();
  return data.trophies.filter((trophy) => {
    if (activeKind === 'missable' && !trophy.missable) return false;
    if (activeKind === 'online') return false; // the game lists no online trophies
    if (activeKind !== 'all' && activeKind !== 'missable' && trophy.kind !== activeKind) return false;
    if (grade !== 'all' && trophy.grade !== grade) return false;
    if (earnedFilter === 'todo' && shown.has(trophy.id)) return false;
    if (earnedFilter === 'earned' && !shown.has(trophy.id)) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

// --- rendering ---

function renderProgress() {
  const shown = shownEarned();
  const total = data.trophies.length;
  progressBig.textContent = `${shown.size} / ${total} earned`;
  barFill.style.width = `${Math.round((shown.size / total) * 100)}%`;
  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of data.trophies) {
    if (shown.has(trophy.id)) byGrade[trophy.grade] += 1;
  }
  progressGrades.textContent =
    `${byGrade.platinum} platinum · ${byGrade.gold} gold · ${byGrade.silver} silver · ${byGrade.bronze} bronze`;
  // The platinum is the reward for the other 54, so "next up" skips it and
  // points at the first trophy still to earn.
  const next = data.trophies.find((trophy) => trophy.grade !== 'platinum' && !shown.has(trophy.id));
  progressNext.textContent = next
    ? `Next up: ${next.name} — ${next.description}`
    : 'Platinum earned — every trophy is ticked. Leonida Legend!';
}

function renderAll() {
  renderProgress();
  const shown = visibleTrophies();
  renderChecklist(listEl, emptyEl, shown, shownEarned(), spoilersOn, toggleEarned, openDetail);
  resultLine.textContent = shown.length === data.trophies.length
    ? `Showing all ${data.trophies.length} trophies.`
    : `Showing ${shown.length} of ${data.trophies.length} trophies.`;
  const missable = data.trophies.find((trophy) => trophy.missable);
  if (missable && !shownEarned().has(missable.id)) {
    missableNote.hidden = false;
    missableNoteText.textContent =
      `${missable.name}: ${missable.description} Do Lucia's Chapter 1 balcony meditation before Chapter 1 ends.`;
  } else {
    missableNote.hidden = true;
  }
}

function setView(view) {
  activeView = view;
  const roadmap = view === 'roadmap';
  roadmapSection.hidden = !roadmap;
  checklistSection.hidden = roadmap;
  tabChecklist.classList.toggle('is-active', !roadmap);
  tabChecklist.setAttribute('aria-pressed', String(!roadmap));
  tabRoadmap.classList.toggle('is-active', roadmap);
  tabRoadmap.setAttribute('aria-pressed', String(roadmap));
}

function setKind(kind) {
  activeKind = kind;
  for (const chip of kindChips.querySelectorAll('.chip')) {
    const active = chip.dataset.kind === kind;
    chip.classList.toggle('is-active', active);
    chip.setAttribute('aria-pressed', String(active));
  }
  renderAll();
}

// --- actions ---

function toggleEarned(id, checked) {
  if (checked) earned.add(id);
  else earned.delete(id);
  if (!saveEarned(earned)) {
    resultLine.textContent = 'Progress could not be saved in this browser (storage unavailable), but the tick still shows for now.';
  }
  if (openId === id) openDetail(id);
  renderAll();
}

function openDetail(id) {
  const trophy = data.trophies.find((item) => item.id === id);
  if (!trophy) return;
  openId = id;
  renderDetail(detailPanel, trophy, shownEarned(), spoilersOn, () => {
    detailPanel.hidden = true;
    openId = null;
  });
  detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- wiring ---

searchBox.addEventListener('input', renderAll);
gradeSelect.addEventListener('change', renderAll);
earnedSelect.addEventListener('change', renderAll);
kindChips.addEventListener('click', (event) => {
  const chip = event.target.closest('.chip');
  if (chip) setKind(chip.dataset.kind);
});
tabChecklist.addEventListener('click', () => setView('checklist'));
tabRoadmap.addEventListener('click', () => setView('roadmap'));
spoilerBox.addEventListener('change', () => {
  spoilersOn = spoilerBox.checked;
  saveSpoilersOn(spoilersOn);
  if (openId) openDetail(openId);
  renderAll();
});
// Close the open detail panel with the Escape key, for keyboard readers.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && openId !== null) {
    detailPanel.hidden = true;
    openId = null;
  }
});
exportButton.addEventListener('click', () => {
  downloadText('leonida-trophy-progress.json', buildExportFile(earned));
  resultLine.textContent = `Exported ${earned.size} earned trophies to leonida-trophy-progress.json.`;
});
importInput.addEventListener('change', async () => {
  const file = importInput.files[0];
  if (!file) return;
  const result = parseImportFile(await file.text());
  importInput.value = '';
  if (result.error) {
    resultLine.textContent = `Import failed: ${result.error}`;
    return;
  }
  earned = result.earned;
  saveEarned(earned);
  resultLine.textContent = `Imported ${earned.size} earned trophies from ${file.name}.`;
  renderAll();
});
resetButton.addEventListener('click', () => {
  if (!window.confirm('Clear all earned trophies? This cannot be undone.')) return;
  earned = new Set();
  clearEarned();
  resultLine.textContent = 'Progress cleared — 0 of 55 earned.';
  renderAll();
});
missableNoteButton.addEventListener('click', () => {
  const missable = data.trophies.find((trophy) => trophy.missable);
  if (missable) openDetail(missable.id);
});

// --- boot ---

async function boot() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`could not load ${DATA_URL}: ${response.status}`);
  data = await response.json();
  renderRoadmap($('roadmapStages'), data.roadmap, data.trophies);
  spoilerBox.checked = spoilersOn;
  setKind(activeKind);
  setView(activeView);
  renderAll();
  if (openId) openDetail(openId);
}

boot().catch((error) => {
  resultLine.textContent = `The trophy list could not be loaded: ${error.message}`;
});
