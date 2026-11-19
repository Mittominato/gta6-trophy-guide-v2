// Progress storage for the Leonida Trophy Guide: the earned set lives in
// localStorage under one key, so the checklist survives reloads and stays on
// the reader's own device. Export writes the set to a JSON download; import
// reads one back and replaces the set. Nothing is ever sent anywhere.

export const STORAGE_KEY = 'leonida-trophy-guide-progress-v2';
export const SPOILER_KEY = 'leonida-trophy-guide-spoilers-v2';

// Read the earned trophy ids (numbers) from localStorage. A corrupt or
// unexpected value is treated as an empty set, never thrown.
export function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    // Only ids 1-55 are real trophies; anything else in storage is ignored.
    return new Set(parsed.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55));
  } catch {
    return new Set();
  }
}

// Persist the earned set. localStorage can be unavailable (private mode,
// storage disabled); the checklist still works in memory in that case.
export function saveEarned(earned) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
    return true;
  } catch {
    return false;
  }
}

// The spoiler setting is stored separately so it survives an export/import.
export function loadSpoilersOn() {
  try {
    return localStorage.getItem(SPOILER_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveSpoilersOn(on) {
  try {
    localStorage.setItem(SPOILER_KEY, on ? '1' : '0');
  } catch {
    // Spoilers still apply for this session even if they cannot be stored.
  }
}

// Build the export payload: the earned ids plus a small header so an
// imported file can be recognised as one of ours.
export function buildExportFile(earned) {
  const payload = {
    app: 'leonida-trophy-guide',
    version: 2,
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
  };
  return JSON.stringify(payload, null, 2);
}

// Parse an imported file. Accepts our own export format and also a bare
// JSON array of ids (the format the starter checklist exported). Returns
// { earned: Set } or { error: string }.
export function parseImportFile(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: 'That file is not valid JSON.' };
  }
  const ids = Array.isArray(parsed) ? parsed : parsed?.earned;
  if (!Array.isArray(ids)) {
    return { error: 'That file does not look like a trophy-progress export.' };
  }
  const valid = ids.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55);
  if (valid.length === 0 && ids.length > 0) {
    return { error: 'That file contains no trophy ids between 1 and 55.' };
  }
  return { earned: new Set(valid) };
}

// Wipe the whole progress set (used by the Reset button) and persist the
// empty set, so a cleared checklist stays cleared after a reload.
export function clearEarned() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The in-memory set is still cleared by the caller.
  }
}

// Trigger a browser download of the given text as a file.
export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
