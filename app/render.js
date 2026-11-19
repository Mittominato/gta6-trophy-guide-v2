// Rendering for the Leonida Trophy Guide: the checklist cards, the trophy
// detail panel and the roadmap stages. All text is set with textContent (or
// created elements), never innerHTML from data, so a trophy name can never
// become markup. Spoiler mode replaces a story trophy's name and description
// with a placeholder until the reader has earned it.

const HIDDEN_NAME = 'Hidden trophy';
const HIDDEN_DESC = 'This story trophy stays hidden until you earn it. Tick it off once it pops to reveal its name and guide.';

export function isStoryTrophy(trophy) {
  return trophy.kind === 'story';
}

export function isHiddenBySpoilers(trophy, earned, spoilersOn) {
  return spoilersOn && isStoryTrophy(trophy) && !earned.has(trophy.id);
}

// Format the count PlayStation tracks for a trophy, when the data has one.
export function formatCount(trophy) {
  if (!Number.isInteger(trophy.count)) return null;
  if (trophy.count >= 1000) return trophy.count.toLocaleString('en-US');
  return String(trophy.count);
}

// One checklist card: checkbox, name, official description, grade, tags and
// a hint that the guide opens on click. The checkbox stops the click from
// also opening the detail panel.
export function createTrophyCard(trophy, earned, spoilersOn, onToggle, onOpen) {
  const li = document.createElement('li');
  li.className = 'card' + (earned.has(trophy.id) ? ' is-earned' : '');
  li.dataset.trophyId = String(trophy.id);

  const checkWrap = document.createElement('span');
  checkWrap.className = 'card-check';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.id);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => onToggle(trophy.id, box.checked));
  box.addEventListener('click', (event) => event.stopPropagation());
  checkWrap.append(box);

  const body = document.createElement('div');
  body.className = 'card-body';

  const top = document.createElement('div');
  top.className = 'card-top';
  const name = document.createElement('p');
  name.className = 'card-name';
  name.textContent = isHiddenBySpoilers(trophy, earned, spoilersOn) ? HIDDEN_NAME : trophy.name;
  const grade = document.createElement('span');
  grade.className = `card-grade grade-${trophy.grade}`;
  grade.textContent = trophy.grade;
  top.append(name, grade);

  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = isHiddenBySpoilers(trophy, earned, spoilersOn) ? HIDDEN_DESC : trophy.description;

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  const kindTag = document.createElement('span');
  kindTag.className = 'tag';
  kindTag.textContent = trophy.kind;
  meta.append(kindTag);
  if (trophy.missable) {
    const miss = document.createElement('span');
    miss.className = 'tag tag-missable';
    miss.textContent = 'Missable';
    meta.append(miss);
  }
  if (trophy.hidden) {
    const hid = document.createElement('span');
    hid.className = 'tag tag-hidden';
    hid.textContent = 'Hidden on PSN';
    meta.append(hid);
  }
  const count = formatCount(trophy);
  if (count !== null) {
    const countTag = document.createElement('span');
    countTag.className = 'tag tag-count';
    countTag.textContent = `Target: ${count}`;
    meta.append(countTag);
  }

  const hint = document.createElement('p');
  hint.className = 'card-guide-link';
  hint.textContent = 'Read the guide ›';

  body.append(top, desc, meta, hint);
  li.append(checkWrap, body);
  li.addEventListener('click', () => onOpen(trophy.id));
  return li;
}

// Fill a <ol> with the filtered trophies and report how many matched.
export function renderChecklist(listEl, emptyEl, trophies, earned, spoilersOn, onToggle, onOpen) {
  listEl.replaceChildren();
  for (const trophy of trophies) {
    listEl.append(createTrophyCard(trophy, earned, spoilersOn, onToggle, onOpen));
  }
  emptyEl.hidden = trophies.length !== 0;
  return trophies.length;
}

// The detail panel: the trophy's official name, description and grade, the
// guide in this guide's own words, and the named sources it draws on.
export function renderDetail(panel, trophy, earned, spoilersOn, onClose) {
  panel.replaceChildren();
  panel.hidden = false;

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'btn btn-ghost btn-small detail-close';
  close.textContent = 'Close';
  close.addEventListener('click', onClose);

  const heading = document.createElement('h2');
  heading.textContent = isHiddenBySpoilers(trophy, earned, spoilersOn) ? HIDDEN_NAME : trophy.name;

  const grade = document.createElement('p');
  grade.className = `card-grade grade-${trophy.grade}`;
  grade.textContent = trophy.grade + (trophy.hidden ? ' · hidden on PSN' : '');

  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = isHiddenBySpoilers(trophy, earned, spoilersOn)
    ? HIDDEN_DESC
    : `Official description: ${trophy.description}`;

  panel.append(close, heading, grade, desc);

  // Show whether this trophy is already ticked, so the open guide always
  // agrees with the checklist above it.
  if (earned.has(trophy.id)) {
    const earnedNote = document.createElement('p');
    earnedNote.className = 'card-desc';
    earnedNote.textContent = '✓ Earned — ticked off in your checklist.';
    panel.append(earnedNote);
  }

  if (trophy.missable) {
    const warn = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = 'Missable — ';
    warn.append(strong, document.createTextNode('do this before Chapter 1 ends. See the guide below.'));
    panel.append(warn);
  }

  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'How to earn it';
  const guide = document.createElement('p');
  guide.className = 'detail-guide';
  guide.textContent = trophy.guide;
  panel.append(guideHeading, guide);

  if (Array.isArray(trophy.sources) && trophy.sources.length > 0) {
    const srcHeading = document.createElement('h3');
    srcHeading.textContent = 'Sources';
    const list = document.createElement('ul');
    for (const source of trophy.sources) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.url;
      link.textContent = source.label;
      link.rel = 'noopener';
      item.append(link);
      list.append(item);
    }
    panel.append(srcHeading, list);
  }

  const stageNote = document.createElement('p');
  stageNote.className = 'card-desc';
  stageNote.textContent = `Roadmap stage ${trophy.roadmap} of 7 — see “Roadmap to platinum” above.`;
  panel.append(stageNote);
}

// The roadmap view: seven ordered stages, each with the trophies it covers.
export function renderRoadmap(container, roadmap, trophies) {
  container.replaceChildren();
  for (const stage of roadmap) {
    const block = document.createElement('article');
    block.className = 'stage';

    const head = document.createElement('div');
    head.className = 'stage-head';
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = `Stage ${stage.stage}`;
    const title = document.createElement('h3');
    title.textContent = stage.title;
    const hours = document.createElement('span');
    hours.className = 'stage-hours';
    hours.textContent = stage.hours;
    head.append(num, title, hours);

    const text = document.createElement('p');
    text.textContent = stage.text;

    block.append(head, text);

    const members = trophies.filter((t) => t.roadmap === stage.stage);
    if (members.length > 0) {
      const list = document.createElement('ul');
      list.className = 'stage-trophies';
      for (const trophy of members) {
        const item = document.createElement('li');
        item.textContent = trophy.name + (trophy.missable ? ' — missable' : '');
        list.append(item);
      }
      block.append(list);
    }
    container.append(block);
  }
}
