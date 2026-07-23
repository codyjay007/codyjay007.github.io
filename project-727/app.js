'use strict';

const STORAGE_KEY = 'project-727-state-v3';
const PREVIOUS_STORAGE_KEY = 'project-727-state-v2';
const LEGACY_STORAGE_KEY = 'project-570-state-v1';
const STATE_VERSION = 3;

const BOOT_FRAGMENT_CONFIG = [
  { id: 'fragment-1', glyphs: ['⌁', '⌬', 'T', '◫'], correctOrientation: 2 },
  { id: 'fragment-2', glyphs: ['⌖', 'I', '◇', '⌁'], correctOrientation: 1 },
  { id: 'fragment-3', glyphs: ['△', '⌘', '◒', 'N'], correctOrientation: 3 },
  { id: 'fragment-4', glyphs: ['○', '⌁', 'A', '⌬'], correctOrientation: 2 }
];

const COURT_SHOTS = [
  { id: 'serve', label: 'Serve' },
  { id: 'clear', label: 'Clear' },
  { id: 'net', label: 'Net' },
  { id: 'drop', label: 'Drop' },
  { id: 'lift', label: 'Lift' },
  { id: 'drive', label: 'Drive' },
  { id: 'smash', label: 'Smash' }
];

const COURT_SOLUTION_ORDER = COURT_SHOTS.map((shot) => shot.id);

// Placeholder values. Replace only this object when the physical landing cards are finalized.
const COURT_LANDING_CONFIG = {
  serve: 'C3',
  clear: 'A1',
  net: 'B2',
  drop: 'D2',
  lift: 'A4',
  drive: 'C2',
  smash: 'D1'
};

const COURT_ZONES = [
  { id: 'A1', x: 70, y: 55 }, { id: 'B1', x: 170, y: 55 }, { id: 'C1', x: 270, y: 55 }, { id: 'D1', x: 370, y: 55 },
  { id: 'A2', x: 70, y: 145 }, { id: 'B2', x: 170, y: 145 }, { id: 'C2', x: 270, y: 145 }, { id: 'D2', x: 370, y: 145 },
  { id: 'A3', x: 70, y: 235 }, { id: 'B3', x: 170, y: 235 }, { id: 'C3', x: 270, y: 235 }, { id: 'D3', x: 370, y: 235 },
  { id: 'A4', x: 70, y: 325 }, { id: 'B4', x: 170, y: 325 }, { id: 'C4', x: 270, y: 325 }, { id: 'D4', x: 370, y: 325 }
];

const COURT_REVEAL = 'KITCHEN';

const CHAPTERS = [
  {
    id: 'boot',
    index: 0,
    label: 'Archive Calibration',
    subtitle: 'Origin Archive // Project 727',
    zone: 'Living Room Terminal',
    answers: [],
    hints: []
  },
  {
    id: 'court',
    index: 1,
    label: 'Record 01 — The Court',
    subtitle: 'First Contact // CAN-AM',
    zone: 'Living Room',
    objective: 'Reconstruct the rally using the physical shot cards and landing evidence.',
    prompt: '',
    answers: [],
    hints: [
      'Fix the opening and closing strokes first.',
      'Treat Clear → Net and Drop → Lift as fixed blocks.',
      'Sequence: Serve → Clear → Net → Drop → Lift → Drive → Smash. Use the physical cards to reconstruct each landing.'
    ],
    restored: 'FIRST CONTACT RECORD RESTORED'
  },
  {
    id: 'table',
    index: 2,
    label: 'Record 02 — The Table',
    subtitle: 'First Date // Limon',
    zone: 'Kitchen',
    objective: 'Rebuild the table arrangement using the six evidence cards.',
    prompt: 'Enter the location keyword revealed by the completed table.',
    answers: ['DRAWER'],
    hints: [
      'Use Receipt as the fixed 12 o’clock anchor before placing anything else.',
      'Main and Lemon are opposite. Glass is immediately clockwise from Lemon.',
      'Clockwise order: Receipt → Lemon → Glass → Starter → Main → Dessert. Read the backs.'
    ],
    restored: 'Record restored: the first date is archived. The next file is hidden where rooms become puzzles.'
  },
  {
    id: 'room',
    index: 3,
    label: 'Record 03 — The Room',
    subtitle: 'First Escape // Omescape',
    zone: 'Primary Bedroom Walk-in Closet',
    objective: 'Identify the only escapable map, then align the overlay correctly.',
    prompt: 'Enter the location keyword visible through the aligned overlay.',
    answers: ['CLOSET'],
    hints: [
      'Eliminate any map that forces a locked door before its matching key is collected.',
      'The valid route must pass the center and never revisit a room. Rotate the overlay toward the entrance.',
      'Use the only map that satisfies every movement rule, then read the exposed letters: CLOSET.'
    ],
    restored: 'Record restored: three beginnings are intact. One event changed the archive from two records into one case.'
  },
  {
    id: 'origin',
    index: 4,
    label: 'Record 04 — The Origin',
    subtitle: 'Status Change // Activation',
    zone: 'Primary Bedroom',
    objective: 'Place all recovered records on the timeline and restore the activation date.',
    prompt: 'Enter the activation date in YYYY/MM/DD format.',
    answers: ['2025/01/28', '2025-01-28', '20250128', '01282025'],
    hints: [
      'The meeting, date, and escape are earlier records. The activation event comes after them.',
      'Align the four record cards by time and inspect the windows in the timeline sleeve.',
      'The recovered date is January 28, 2025. Enter 2025/01/28.'
    ],
    restored: 'Archive restored. A birthday record has been detected in primary storage.'
  },
  {
    id: 'final',
    index: 5,
    label: 'Birthday Vault',
    subtitle: 'Record 05 // Today',
    zone: 'Guest Bedroom',
    objective: 'Locate the final archive and use the activation date in MMDD format.',
    prompt: 'No terminal answer is required. Continue in the physical archive.',
    answers: [],
    hints: [],
    restored: 'This memory does not need to be solved. It only needs to be kept.'
  }
];

function createBootState(overrides = {}) {
  return {
    fragmentOrientations: [0, 0, 0, 0],
    solved: false,
    ...overrides
  };
}

function createCourtState(overrides = {}) {
  return {
    shotOrder: Array(7).fill(null),
    landingAssignments: {},
    selectedShot: null,
    solved: false,
    ...overrides
  };
}

function createDefaultState() {
  return {
    authenticated: false,
    currentChapter: 'boot',
    completed: [],
    hintsUsed: {},
    soundOn: true,
    stateVersion: STATE_VERSION,
    chapterState: {
      boot: createBootState(),
      court: createCourtState()
    }
  };
}

let state = loadState();
let adminOpen = new URLSearchParams(location.search).get('admin') === '727';
let feedback = '';
let restoredOverlay = null;
let draggedShotId = null;
let bootTransitionPending = false;

function sanitizeShotOrder(order) {
  const validIds = new Set(COURT_SHOTS.map((shot) => shot.id));
  const seen = new Set();
  return Array.from({ length: 7 }, (_, index) => {
    const value = Array.isArray(order) ? order[index] : null;
    if (!validIds.has(value) || seen.has(value)) return null;
    seen.add(value);
    return value;
  });
}

function sanitizeLandingAssignments(assignments) {
  const validShots = new Set(COURT_SHOTS.map((shot) => shot.id));
  const validZones = new Set(COURT_ZONES.map((zone) => zone.id));
  return Object.fromEntries(Object.entries(assignments || {}).filter(([shot, zone]) => validShots.has(shot) && validZones.has(zone)));
}

function migrateState(raw) {
  if (!raw || typeof raw !== 'object') return createDefaultState();

  const defaults = createDefaultState();
  const sourceCompleted = Array.isArray(raw.completed) ? raw.completed : [];
  const completed = [...new Set(sourceCompleted.map((id) => id === 'intro' ? 'boot' : id).filter((id) => CHAPTERS.some((chapter) => chapter.id === id)))];
  const wasAuthenticated = Boolean(raw.authenticated);
  const isCurrentVersion = raw.stateVersion === STATE_VERSION;
  const oldBoot = raw.chapterState?.boot || {};
  const oldCourt = raw.chapterState?.court || {};
  const bootSolved = Boolean(oldBoot.solved || wasAuthenticated || completed.includes('boot'));
  const courtSolved = Boolean(oldCourt.solved || completed.includes('court'));

  if (bootSolved && !completed.includes('boot')) completed.unshift('boot');

  let currentChapter = raw.currentChapter === 'intro' ? 'court' : raw.currentChapter;
  if (!CHAPTERS.some((chapter) => chapter.id === currentChapter)) currentChapter = bootSolved ? 'court' : 'boot';

  const fragmentOrientations = Array.from({ length: 4 }, (_, index) => {
    const value = Number(oldBoot.fragmentOrientations?.[index]);
    return Number.isInteger(value) ? ((value % 4) + 4) % 4 : (bootSolved ? BOOT_FRAGMENT_CONFIG[index].correctOrientation : 0);
  });

  return {
    ...defaults,
    authenticated: isCurrentVersion ? wasAuthenticated : bootSolved,
    currentChapter: isCurrentVersion && !wasAuthenticated ? 'boot' : (bootSolved ? currentChapter : 'boot'),
    completed,
    hintsUsed: raw.hintsUsed && typeof raw.hintsUsed === 'object' ? raw.hintsUsed : {},
    soundOn: raw.soundOn !== false,
    stateVersion: STATE_VERSION,
    chapterState: {
      ...raw.chapterState,
      boot: createBootState({ fragmentOrientations, solved: bootSolved }),
      court: createCourtState({
        shotOrder: courtSolved ? [...COURT_SOLUTION_ORDER] : sanitizeShotOrder(oldCourt.shotOrder),
        landingAssignments: courtSolved ? { ...COURT_LANDING_CONFIG } : sanitizeLandingAssignments(oldCourt.landingAssignments),
        selectedShot: COURT_SHOTS.some((shot) => shot.id === oldCourt.selectedShot) ? oldCourt.selectedShot : null,
        solved: courtSolved
      })
    }
  };
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const previous = localStorage.getItem(PREVIOUS_STORAGE_KEY);
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    const parsed = JSON.parse(stored || previous || legacy || 'null');
    const migrated = migrateState(parsed);
    if (!stored && parsed) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return createDefaultState();
  }
}

function saveState(next) {
  state = migrateState(next);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function chapterById(id) {
  return CHAPTERS.find((chapter) => chapter.id === id) || CHAPTERS[0];
}

function nextChapter(id) {
  const index = CHAPTERS.findIndex((chapter) => chapter.id === id);
  return CHAPTERS[Math.min(index + 1, CHAPTERS.length - 1)].id;
}

function normalize(value) {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

function isCorrect(chapter, value) {
  return chapter.answers.some((answer) => normalize(answer) === normalize(value));
}

function playTone(kind) {
  if (!state.soundOn) return;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return;
  const ctx = new AudioContextCtor();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const frequencies = { ok: 740, error: 190, open: 520 };
  oscillator.frequency.value = frequencies[kind];
  oscillator.type = kind === 'error' ? 'sawtooth' : 'sine';
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.11, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (kind === 'open' ? 0.8 : 0.35));
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + (kind === 'open' ? 0.85 : 0.4));
}

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fullscreenButtonMarkup() {
  const supported = Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen);
  const active = Boolean(document.fullscreenElement);
  return `<button id="fullscreen-button" class="utility-button" ${supported ? '' : 'disabled title="Fullscreen is unavailable in this browser"'}>${supported ? (active ? 'EXIT FULLSCREEN' : 'FULLSCREEN') : 'FULLSCREEN N/A'}</button>`;
}

function bootIsSolved(orientations) {
  return BOOT_FRAGMENT_CONFIG.every((fragment, index) => fragment.correctOrientation === orientations[index]);
}

function bootMarkup() {
  const boot = state.chapterState.boot;
  const fragments = BOOT_FRAGMENT_CONFIG.map((fragment, index) => {
    const orientation = boot.fragmentOrientations[index];
    const correct = orientation === fragment.correctOrientation;
    const connector = index < BOOT_FRAGMENT_CONFIG.length - 1
      ? `<span class="boot-connector ${correct && boot.fragmentOrientations[index + 1] === BOOT_FRAGMENT_CONFIG[index + 1].correctOrientation ? 'connected' : ''}" aria-hidden="true"></span>`
      : '';
    return `
      <button class="boot-fragment ${correct ? 'edge-aligned' : ''}" data-boot-fragment="${index}" aria-label="Rotate archive fragment ${index + 1}">
        <span class="fragment-index">F${index + 1}</span>
        <span class="fragment-glyph">${esc(fragment.glyphs[orientation])}</span>
        <span class="fragment-action">ROTATE</span>
      </button>${connector}`;
  }).join('');

  return `
    <main class="boot-shell">
      <div class="boot-utilities">${fullscreenButtonMarkup()}<button id="sound-button" class="utility-button">${state.soundOn ? 'SOUND ON' : 'SOUND OFF'}</button></div>
      <section class="boot-card panel-glow">
        <div class="eyebrow">ORIGIN ARCHIVE // CALIBRATION</div>
        <h1>PROJECT <span>727</span></h1>
        <p class="boot-lead">A personal archive contains four incomplete records. Use the physical calibration card to align the recovered identity fragments.</p>
        <div class="boot-fragments" aria-label="Archive identity fragments">${fragments}</div>
        <div class="puzzle-feedback ${bootIsSolved(boot.fragmentOrientations) ? 'restored' : 'incomplete'}" aria-live="polite">
          <strong>${bootIsSolved(boot.fragmentOrientations) ? 'IDENTITY PATTERN RESTORED' : 'IDENTITY PATTERN INCOMPLETE'}</strong>
          <span>${bootIsSolved(boot.fragmentOrientations) ? 'Opening archive…' : 'Aligned edges will illuminate. Continue calibration.'}</span>
        </div>
      </section>
      ${adminMarkup()}
    </main>`;
}

function progressMarkup() {
  return CHAPTERS.slice(1, 5).map((chapter) => {
    const done = state.completed.includes(chapter.id);
    const current = state.currentChapter === chapter.id;
    return `
      <div class="progress-item ${done ? 'done' : ''} ${current ? 'current' : ''}">
        <span class="progress-dot">${done ? '✓' : chapter.index}</span>
        <div><strong>${esc(chapter.label.replace(/Record \d+ — /, ''))}</strong><small>${done ? 'RESTORED' : current ? 'ACTIVE' : 'LOCKED'}</small></div>
      </div>`;
  }).join('');
}

function finalMarkup() {
  return `
    <section class="chapter-card final-card panel-glow">
      <div class="archive-seal">727</div>
      <div class="eyebrow">ARCHIVE RESTORED</div>
      <h2>Birthday record detected.</h2>
      <div class="final-metrics">
        <div><span>SUBJECT</span><strong>TINA</strong></div>
        <div><span>ACTIVATED</span><strong>2025 / 01 / 28</strong></div>
        <div><span>ELAPSED</span><strong>545 DAYS</strong></div>
      </div>
      <div class="vault-instruction">
        <span>FINAL ARCHIVE LOCATION</span><strong>GUEST BEDROOM // PRIMARY DISPLAY</strong>
        <span>ACCESS FORMAT</span><strong>MMDD</strong>
      </div>
      <p class="final-copy">This memory does not need to be solved. It only needs to be kept.</p>
      <div class="birthday-line">HAPPY BIRTHDAY, TINA.</div>
    </section>`;
}

function chapterMarkup(chapter) {
  const hintCount = state.hintsUsed[chapter.id] || 0;
  const hints = chapter.hints.slice(0, hintCount).map((hint, index) => `
    <p class="hint-line"><strong>H${index + 1}</strong><span>${esc(hint)}</span></p>`).join('');

  return `
    <section class="chapter-card panel-glow">
      <div class="chapter-number">0${chapter.index}</div>
      <div class="eyebrow">${esc(chapter.subtitle)}</div>
      <h2>${esc(chapter.label)}</h2>
      <div class="zone-banner"><span>PHYSICAL RECONSTRUCTION ZONE</span><strong>${esc(chapter.zone)}</strong></div>
      <p class="lead">${esc(chapter.objective)}</p>
      <div class="objective-box"><span>TERMINAL VALIDATION</span><p>${esc(chapter.prompt)}</p></div>
      <form id="answer-form" class="answer-form">
        <input id="answer-input" autocomplete="off" placeholder="ENTER RECOVERED KEYWORD" autofocus />
        <button type="submit">Validate record</button>
      </form>
      <div class="status-message ${feedback.startsWith('INVALID') ? 'error' : feedback ? 'success' : ''}">${feedback || 'Terminal ready.'}</div>
      <div class="hint-area">
        <div class="hint-header"><span>ASSISTANCE CHANNEL</span><button id="hint-button" class="ghost" ${hintCount >= chapter.hints.length ? 'disabled' : ''}>Reveal hint ${Math.min(hintCount + 1, chapter.hints.length)} / ${chapter.hints.length}</button></div>
        ${hints}
      </div>
      ${restoredOverlay === chapter.id ? `<div class="restore-overlay"><div class="restore-mark">✓</div><h3>RECORD RESTORED</h3><p>${esc(chapter.restored)}</p></div>` : ''}
    </section>`;
}

function shotLabel(id) {
  return COURT_SHOTS.find((shot) => shot.id === id)?.label || id;
}

function courtSequenceStatus(order) {
  const positions = Object.fromEntries(order.map((shot, index) => [shot, index]).filter(([shot]) => shot));
  const filled = order.filter(Boolean).length;

  if ((order[0] && order[0] !== 'serve') || (positions.serve !== undefined && positions.serve !== 0)) {
    return { type: 'contradiction', message: 'Serve must open the sequence.' };
  }
  if ((order[6] && order[6] !== 'smash') || (positions.smash !== undefined && positions.smash !== 6)) {
    return { type: 'contradiction', message: 'Smash must close the sequence.' };
  }
  if (positions.drop !== undefined && positions.lift !== undefined && positions.lift !== positions.drop + 1) {
    return { type: 'contradiction', message: 'One recovered adjacency is broken.' };
  }
  if (positions.clear !== undefined && positions.net !== undefined && positions.net !== positions.clear + 1) {
    return { type: 'contradiction', message: 'One recovered adjacency is broken.' };
  }
  if (positions.clear !== undefined && positions.drop !== undefined && (positions.clear >= positions.drop || positions.drop - positions.clear === 1)) {
    return { type: 'contradiction', message: 'Recovered timing evidence is contradicted.' };
  }
  if (positions.drive !== undefined && positions.lift !== undefined && positions.drive <= positions.lift) {
    return { type: 'contradiction', message: 'Drive must occur after Lift.' };
  }
  if (filled < 7) return { type: 'incomplete', message: 'Rally incomplete. Current placements remain consistent.' };
  if (!COURT_SOLUTION_ORDER.every((shot, index) => order[index] === shot)) {
    return { type: 'contradiction', message: 'Sequence complete, but the recovered rally is invalid.' };
  }
  return { type: 'sequence-valid', message: 'Sequence accepted. Reconstruct the landing pattern.' };
}

function courtFeedback(court) {
  if (court.solved) return { type: 'restored', message: 'RALLY RECONSTRUCTED' };
  const sequence = courtSequenceStatus(court.shotOrder);
  if (sequence.type !== 'sequence-valid') return sequence;
  const assigned = COURT_SHOTS.filter((shot) => court.landingAssignments[shot.id]).length;
  if (assigned < 7) return { type: 'landing', message: `Sequence accepted. Landing evidence ${assigned} / 7 assigned.` };
  const landingsCorrect = COURT_SHOTS.every((shot) => court.landingAssignments[shot.id] === COURT_LANDING_CONFIG[shot.id]);
  return landingsCorrect
    ? { type: 'restored', message: 'RALLY RECONSTRUCTED' }
    : { type: 'contradiction', message: 'Landing pattern conflicts with the physical evidence.' };
}

function trajectoryMarkup(court) {
  const points = court.shotOrder.map((shotId, index) => {
    const zone = COURT_ZONES.find((item) => item.id === court.landingAssignments[shotId]);
    return zone ? { ...zone, shotId, index } : null;
  }).filter(Boolean);
  const polyline = points.length > 1
    ? `<polyline class="trajectory-line ${court.solved ? 'solved' : ''}" points="${points.map((point) => `${point.x},${point.y}`).join(' ')}"></polyline>`
    : '';
  const markers = points.map((point) => `
    <g class="trajectory-marker ${court.solved ? 'solved' : ''}" transform="translate(${point.x} ${point.y})">
      <circle r="16"></circle>
      <text text-anchor="middle" dominant-baseline="central">${court.solved ? COURT_REVEAL[point.index] : point.index + 1}</text>
    </g>`).join('');
  const shuttle = court.solved && points.length === 7
    ? `<circle class="shuttle-dot" r="7"><animateMotion dur="3.2s" repeatCount="indefinite" path="M ${points[0].x} ${points[0].y} ${points.slice(1).map((point) => `L ${point.x} ${point.y}`).join(' ')}"></animateMotion></circle>`
    : '';
  return `${polyline}${markers}${shuttle}`;
}

function courtMarkup(chapter) {
  const court = state.chapterState.court;
  const status = courtFeedback(court);
  const hintCount = state.hintsUsed.court || 0;
  const hints = chapter.hints.slice(0, hintCount).map((hint, index) => `
    <p class="hint-line"><strong>H${index + 1}</strong><span>${esc(hint)}</span></p>`).join('');
  const placed = new Set(court.shotOrder.filter(Boolean));
  const unplaced = COURT_SHOTS.filter((shot) => !placed.has(shot.id));
  const landingCount = Object.keys(court.landingAssignments).length;

  const slots = court.shotOrder.map((shotId, index) => `
    <div class="rally-slot ${shotId ? 'filled' : ''}" data-slot-index="${index}" tabindex="${court.solved ? '-1' : '0'}" role="button" aria-label="Rally slot ${index + 1}${shotId ? `, ${shotLabel(shotId)}` : ', empty'}">
      <span class="slot-number">${index + 1}</span>
      ${shotId ? `<button class="shot-token placed ${court.selectedShot === shotId ? 'selected' : ''}" draggable="${!court.solved}" data-shot-token="${shotId}" ${court.solved ? 'disabled' : ''}>${esc(shotLabel(shotId))}</button><button class="remove-shot" data-remove-shot="${shotId}" aria-label="Remove ${esc(shotLabel(shotId))}" ${court.solved ? 'disabled' : ''}>×</button>` : '<span class="slot-empty">PLACE SHOT</span>'}
    </div>`).join('');

  const bank = unplaced.length
    ? unplaced.map((shot) => `<button class="shot-token ${court.selectedShot === shot.id ? 'selected' : ''}" draggable="${!court.solved}" data-shot-token="${shot.id}">${esc(shot.label)}</button>`).join('')
    : '<span class="bank-empty">All strokes placed.</span>';

  const zones = COURT_ZONES.map((zone) => `
    <g class="court-zone ${Object.values(court.landingAssignments).includes(zone.id) ? 'assigned' : ''}" data-court-zone="${zone.id}" role="button" tabindex="${court.solved ? '-1' : '0'}" aria-label="Assign selected shot to zone ${zone.id}">
      <rect x="${zone.x - 48}" y="${zone.y - 38}" width="96" height="76"></rect>
      <text x="${zone.x}" y="${zone.y + 4}" text-anchor="middle">${zone.id}</text>
    </g>`).join('');

  const assignments = court.shotOrder.filter(Boolean).map((shotId, index) => `
    <div class="assignment-row ${court.selectedShot === shotId ? 'selected' : ''}">
      <span>${index + 1}. ${esc(shotLabel(shotId))}</span><strong>${esc(court.landingAssignments[shotId] || '—')}</strong>
    </div>`).join('');

  return `
    <section class="court-workspace ${court.solved ? 'solved' : ''}">
      <aside class="court-panel evidence-panel">
        <div class="eyebrow">RECORD 01 // FIRST CONTACT</div>
        <h2>The Court</h2>
        <div class="evidence-block"><span>PHYSICAL EVIDENCE</span><strong>7 SHOT CARDS</strong><small>${landingCount} landing records reconstructed</small></div>
        <div class="evidence-block"><span>RECOVERED RULES</span><p>Opening and closing strokes are fixed. Two adjacency records and two timing records remain.</p></div>
        <div class="court-hints">
          <div class="hint-header"><span>ASSISTANCE</span><button id="hint-button" class="ghost" ${hintCount >= 3 || court.solved ? 'disabled' : ''}>Hint ${Math.min(hintCount + 1, 3)} / 3</button></div>
          ${hints}
        </div>
      </aside>

      <div class="court-panel court-board-panel">
        <div class="panel-heading"><div><span>LANDING RECONSTRUCTION</span><strong>SELECT A PLACED SHOT, THEN A ZONE</strong></div><button id="court-reset" class="ghost" ${court.solved ? 'disabled' : ''}>Reset Court</button></div>
        <svg class="badminton-court" viewBox="0 0 440 380" aria-label="Interactive badminton court">
          <rect class="court-boundary" x="20" y="15" width="400" height="350"></rect>
          <line class="court-line" x1="220" y1="15" x2="220" y2="365"></line>
          <line class="court-line net" x1="20" y1="190" x2="420" y2="190"></line>
          ${zones}
          <g class="trajectory">${trajectoryMarkup(court)}</g>
        </svg>
        <div class="assignment-list">${assignments || '<p class="assignment-empty">Place rally shots before assigning landing zones.</p>'}</div>
      </div>

      <aside class="court-panel rally-panel">
        <div class="panel-heading"><div><span>RALLY SEQUENCE</span><strong>DRAG OR CLICK TO PLACE</strong></div></div>
        <div class="shot-bank">${bank}</div>
        <div class="rally-slots">${slots}</div>
        <div class="puzzle-feedback ${status.type}" aria-live="polite"><strong>${esc(status.message)}</strong><span>${court.selectedShot ? `${esc(shotLabel(court.selectedShot))} selected.` : 'Select a stroke to continue reconstruction.'}</span></div>
      </aside>

      ${court.solved ? `
        <div class="court-complete-overlay">
          <div class="restore-mark">✓</div>
          <div class="completion-copy">
            <div class="eyebrow">RALLY RECONSTRUCTED</div>
            <h3>FIRST CONTACT RECORD RESTORED</h3>
            <p>NEXT EVIDENCE SOURCE: <strong>KITCHEN</strong></p>
          </div>
          <button id="court-continue" class="primary">Continue to Table</button>
        </div>` : ''}
    </section>`;
}

function adminMarkup() {
  if (!adminOpen) return '';
  const current = chapterById(state.currentChapter);
  const completedLabels = state.completed.map((id) => chapterById(id).label).join(', ');
  const hintsUsed = Object.values(state.hintsUsed).reduce((total, count) => total + count, 0);
  const court = state.chapterState.court;
  const assignmentSummary = COURT_SHOTS.map((shot) => `${shot.label}:${court.landingAssignments[shot.id] || '—'}`).join(' · ');
  return `
    <div class="modal-backdrop">
      <section class="admin-panel">
        <div class="admin-header"><div><div class="eyebrow">OPERATOR OVERRIDE</div><h2>Admin Console</h2></div><button id="admin-close" class="ghost">Close</button></div>
        <div class="operator-checklist" aria-label="Current game status">
          <div><span>Current chapter</span><strong>${esc(current.label)}</strong></div>
          <div><span>Completed</span><strong>${state.completed.length} / ${CHAPTERS.length - 1}</strong><small>${esc(completedLabels || 'None')}</small></div>
          <div><span>Hints used</span><strong>${hintsUsed}</strong></div>
        </div>
        <div class="admin-rescue-grid">
          <button id="admin-solve-boot">Solve Boot</button>
          <button id="admin-reset-boot">Reset Boot</button>
          <button id="admin-solve-court">Solve Court</button>
          <button id="admin-reset-court">Reset Court</button>
        </div>
        <form id="admin-boot-entry" class="admin-recovery-form">
          <label>Manual Boot recovery<input id="admin-subject-input" autocomplete="off" placeholder="ENTER SUBJECT" /></label>
          <button type="submit">Recover Boot</button>
        </form>
        <details class="admin-inspector">
          <summary>Inspect Court state</summary>
          <p><strong>ORDER</strong> ${esc(court.shotOrder.map((id) => id ? shotLabel(id) : '—').join(' → '))}</p>
          <p><strong>LANDINGS</strong> ${esc(assignmentSummary)}</p>
        </details>
        <div class="admin-grid">
          ${CHAPTERS.map((chapter) => `<button data-jump="${chapter.id}">Jump to ${chapter.id}</button>`).join('')}
          <button id="admin-next">Jump to next chapter</button>
          <button id="admin-reset">Reset all progress</button>
          <button id="admin-sound">Sound: ${state.soundOn ? 'on' : 'off'}</button>
        </div>
        <p class="admin-note">Emergency shortcut: press Ctrl/Cmd + Shift + 9.</p>
      </section>
    </div>`;
}

function appMarkup() {
  const chapter = chapterById(state.currentChapter);
  const content = chapter.id === 'court' ? courtMarkup(chapter) : chapter.id === 'final' ? finalMarkup() : chapterMarkup(chapter);
  return `
    <div class="app-shell">
      <header class="topbar">
        <div><div class="eyebrow">PROJECT 727</div><strong>ORIGIN ARCHIVE</strong></div>
        <div class="topbar-meta"><span>SUBJECT: TINA</span><span>ARCHIVE: ACTIVE</span>${fullscreenButtonMarkup()}<button id="sound-button" class="utility-button">${state.soundOn ? 'SOUND ON' : 'SOUND OFF'}</button></div>
      </header>
      <div class="workspace">
        <aside class="progress-rail"><div class="progress-title">ARCHIVE RECORDS</div>${progressMarkup()}</aside>
        <main class="main-stage ${chapter.id === 'court' ? 'court-stage' : ''}">${content}</main>
      </div>
      <footer>ARCHIVE BUILD 2026.07.27 // LOCAL SECURE SESSION</footer>
      ${adminMarkup()}
    </div>`;
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = state.authenticated ? appMarkup() : bootMarkup();
  bindEvents();
}

function updateBootFragment(index) {
  const boot = state.chapterState.boot;
  const orientations = [...boot.fragmentOrientations];
  orientations[index] = (orientations[index] + 1) % BOOT_FRAGMENT_CONFIG[index].glyphs.length;
  const solved = bootIsSolved(orientations);
  saveState({
    ...state,
    chapterState: { ...state.chapterState, boot: createBootState({ fragmentOrientations: orientations, solved }) }
  });
  if (solved && !bootTransitionPending) {
    bootTransitionPending = true;
    playTone('open');
    setTimeout(() => {
      bootTransitionPending = false;
      const completed = state.completed.includes('boot') ? state.completed : ['boot', ...state.completed];
      saveState({ ...state, authenticated: true, currentChapter: 'court', completed });
    }, 1200);
  }
}

function placeShot(shotId, targetIndex) {
  const court = state.chapterState.court;
  if (court.solved) return;
  const order = [...court.shotOrder];
  const sourceIndex = order.indexOf(shotId);
  const displaced = order[targetIndex];
  if (sourceIndex >= 0) order[sourceIndex] = displaced || null;
  order[targetIndex] = shotId;
  saveState({
    ...state,
    chapterState: { ...state.chapterState, court: createCourtState({ ...court, shotOrder: order, selectedShot: shotId }) }
  });
}

function removeShot(shotId) {
  const court = state.chapterState.court;
  if (court.solved) return;
  const order = court.shotOrder.map((id) => id === shotId ? null : id);
  const assignments = { ...court.landingAssignments };
  delete assignments[shotId];
  saveState({
    ...state,
    chapterState: { ...state.chapterState, court: createCourtState({ ...court, shotOrder: order, landingAssignments: assignments, selectedShot: null }) }
  });
}

function assignLanding(zoneId) {
  const court = state.chapterState.court;
  const shotId = court.selectedShot;
  if (!shotId || court.solved || !court.shotOrder.includes(shotId)) return;
  const landingAssignments = { ...court.landingAssignments, [shotId]: zoneId };
  const nextCourt = createCourtState({ ...court, landingAssignments });
  const solved = courtFeedback(nextCourt).type === 'restored';
  nextCourt.solved = solved;
  const completed = solved && !state.completed.includes('court') ? [...state.completed, 'court'] : state.completed;
  if (solved) playTone('ok');
  saveState({ ...state, completed, chapterState: { ...state.chapterState, court: nextCourt } });
}

function solveBootAdmin() {
  const completed = state.completed.includes('boot') ? state.completed : ['boot', ...state.completed];
  saveState({
    ...state,
    authenticated: true,
    currentChapter: 'court',
    completed,
    chapterState: {
      ...state.chapterState,
      boot: createBootState({
        fragmentOrientations: BOOT_FRAGMENT_CONFIG.map((fragment) => fragment.correctOrientation),
        solved: true
      })
    }
  });
}

function resetBootAdmin() {
  saveState({
    ...state,
    authenticated: false,
    currentChapter: 'boot',
    completed: state.completed.filter((id) => id !== 'boot'),
    chapterState: { ...state.chapterState, boot: createBootState() }
  });
}

function solveCourtAdmin() {
  const completed = [...new Set(['boot', ...state.completed, 'court'])];
  saveState({
    ...state,
    authenticated: true,
    currentChapter: 'court',
    completed,
    chapterState: {
      ...state.chapterState,
      boot: createBootState({
        fragmentOrientations: BOOT_FRAGMENT_CONFIG.map((fragment) => fragment.correctOrientation),
        solved: true
      }),
      court: createCourtState({
        shotOrder: [...COURT_SOLUTION_ORDER],
        landingAssignments: { ...COURT_LANDING_CONFIG },
        selectedShot: null,
        solved: true
      })
    }
  });
}

function resetCourtAdmin() {
  const hintsUsed = { ...state.hintsUsed };
  delete hintsUsed.court;
  saveState({
    ...state,
    authenticated: true,
    currentChapter: 'court',
    completed: state.completed.filter((id) => id !== 'court'),
    hintsUsed,
    chapterState: { ...state.chapterState, court: createCourtState() }
  });
}

function bindEvents() {
  document.querySelectorAll('[data-boot-fragment]').forEach((button) => button.addEventListener('click', () => updateBootFragment(Number(button.dataset.bootFragment))));

  const answerForm = document.getElementById('answer-form');
  if (answerForm) answerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const chapter = chapterById(state.currentChapter);
    const answer = document.getElementById('answer-input').value;
    if (!isCorrect(chapter, answer)) {
      feedback = 'INVALID RESPONSE — RECHECK PHYSICAL EVIDENCE';
      playTone('error');
      render();
      return;
    }
    feedback = 'VALIDATION ACCEPTED';
    restoredOverlay = chapter.id;
    playTone('ok');
    render();
    setTimeout(() => {
      const completed = state.completed.includes(chapter.id) ? state.completed : [...state.completed, chapter.id];
      restoredOverlay = null;
      feedback = '';
      saveState({ ...state, completed, currentChapter: nextChapter(chapter.id) });
    }, 2400);
  });

  const hintButton = document.getElementById('hint-button');
  if (hintButton) hintButton.addEventListener('click', () => {
    const chapter = chapterById(state.currentChapter);
    const current = state.hintsUsed[chapter.id] || 0;
    if (current >= chapter.hints.length) return;
    saveState({ ...state, hintsUsed: { ...state.hintsUsed, [chapter.id]: current + 1 } });
  });

  document.querySelectorAll('[data-shot-token]').forEach((token) => {
    token.addEventListener('click', (event) => {
      event.stopPropagation();
      if (state.chapterState.court.solved) return;
      const court = state.chapterState.court;
      saveState({
        ...state,
        chapterState: { ...state.chapterState, court: createCourtState({ ...court, selectedShot: token.dataset.shotToken }) }
      });
    });
    token.addEventListener('dragstart', (event) => {
      draggedShotId = token.dataset.shotToken;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', draggedShotId);
    });
    token.addEventListener('pointerdown', (event) => {
      if (state.chapterState.court.solved || event.button !== 0) return;
      draggedShotId = token.dataset.shotToken;
      token.classList.add('dragging');
      token.setPointerCapture?.(event.pointerId);
    });
    token.addEventListener('pointerup', (event) => {
      if (!draggedShotId) return;
      const dropTarget = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-slot-index]');
      const shotId = draggedShotId;
      draggedShotId = null;
      token.classList.remove('dragging');
      if (dropTarget) {
        event.preventDefault();
        placeShot(shotId, Number(dropTarget.dataset.slotIndex));
      }
    });
    token.addEventListener('pointercancel', () => {
      draggedShotId = null;
      token.classList.remove('dragging');
    });
  });

  document.querySelectorAll('[data-slot-index]').forEach((slot) => {
    const placeSelected = () => {
      const selected = state.chapterState.court.selectedShot;
      if (selected) placeShot(selected, Number(slot.dataset.slotIndex));
    };
    slot.addEventListener('click', placeSelected);
    slot.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        placeSelected();
      }
    });
    slot.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    });
    slot.addEventListener('drop', (event) => {
      event.preventDefault();
      const shotId = event.dataTransfer.getData('text/plain') || draggedShotId;
      if (shotId) placeShot(shotId, Number(slot.dataset.slotIndex));
      draggedShotId = null;
    });
  });

  document.querySelectorAll('[data-remove-shot]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation();
    removeShot(button.dataset.removeShot);
  }));

  document.querySelectorAll('[data-court-zone]').forEach((zone) => {
    const assign = () => assignLanding(zone.dataset.courtZone);
    zone.addEventListener('click', assign);
    zone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        assign();
      }
    });
  });

  const courtReset = document.getElementById('court-reset');
  if (courtReset) courtReset.addEventListener('click', () => {
    if (!window.confirm('Reset the Court reconstruction?')) return;
    resetCourtAdmin();
  });

  const courtContinue = document.getElementById('court-continue');
  if (courtContinue) courtContinue.addEventListener('click', () => saveState({ ...state, currentChapter: 'table' }));

  const soundButton = document.getElementById('sound-button');
  if (soundButton) soundButton.addEventListener('click', () => saveState({ ...state, soundOn: !state.soundOn }));

  const fullscreenButton = document.getElementById('fullscreen-button');
  if (fullscreenButton) fullscreenButton.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      fullscreenButton.textContent = 'FULLSCREEN UNAVAILABLE';
      fullscreenButton.disabled = true;
      fullscreenButton.title = 'Fullscreen could not be activated in this browser.';
    }
  });

  const close = document.getElementById('admin-close');
  if (close) close.addEventListener('click', () => { adminOpen = false; render(); });

  document.querySelectorAll('[data-jump]').forEach((button) => button.addEventListener('click', () => {
    feedback = '';
    restoredOverlay = null;
    const target = button.dataset.jump;
    saveState({ ...state, authenticated: target !== 'boot', currentChapter: target });
  }));

  const adminNext = document.getElementById('admin-next');
  if (adminNext) adminNext.addEventListener('click', () => {
    const target = nextChapter(state.currentChapter);
    saveState({ ...state, authenticated: target !== 'boot', currentChapter: target });
  });

  const adminSolveBoot = document.getElementById('admin-solve-boot');
  if (adminSolveBoot) adminSolveBoot.addEventListener('click', solveBootAdmin);

  const adminResetBoot = document.getElementById('admin-reset-boot');
  if (adminResetBoot) adminResetBoot.addEventListener('click', resetBootAdmin);

  const adminSolveCourt = document.getElementById('admin-solve-court');
  if (adminSolveCourt) adminSolveCourt.addEventListener('click', solveCourtAdmin);

  const adminResetCourt = document.getElementById('admin-reset-court');
  if (adminResetCourt) adminResetCourt.addEventListener('click', resetCourtAdmin);

  const adminBootEntry = document.getElementById('admin-boot-entry');
  if (adminBootEntry) adminBootEntry.addEventListener('submit', (event) => {
    event.preventDefault();
    const subject = document.getElementById('admin-subject-input').value.trim().toUpperCase();
    if (subject === 'TINA') {
      solveBootAdmin();
    } else {
      document.getElementById('admin-subject-input').value = '';
      document.getElementById('admin-subject-input').placeholder = 'SUBJECT NOT RECOGNIZED';
    }
  });

  const reset = document.getElementById('admin-reset');
  if (reset) reset.addEventListener('click', () => {
    if (!window.confirm('Reset all game progress? This cannot be undone.')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREVIOUS_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    state = createDefaultState();
    feedback = '';
    render();
  });

  const adminSound = document.getElementById('admin-sound');
  if (adminSound) adminSound.addEventListener('click', () => saveState({ ...state, soundOn: !state.soundOn }));
}

window.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.code === 'Digit9' || event.key === '9')) {
    event.preventDefault();
    adminOpen = !adminOpen;
    render();
  }
});

document.addEventListener('fullscreenchange', render);
document.addEventListener('pointerup', (event) => {
  if (!draggedShotId || state.currentChapter !== 'court') return;
  const dropTarget = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-slot-index]');
  const shotId = draggedShotId;
  draggedShotId = null;
  if (dropTarget) placeShot(shotId, Number(dropTarget.dataset.slotIndex));
});
document.addEventListener('pointercancel', () => { draggedShotId = null; });

render();
