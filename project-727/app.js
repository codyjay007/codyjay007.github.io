'use strict';

const STORAGE_KEY = 'project-727-state-v7';
const PREVIOUS_STORAGE_KEYS = ['project-727-state-v6', 'project-727-state-v5', 'project-727-state-v4', 'project-727-state-v3', 'project-727-state-v2', 'project-570-state-v1'];
const STATE_VERSION = 7;

if (!globalThis.PROJECT727_CONFIG) {
  throw new Error('Project 727 shared configuration failed to load.');
}

const BOOT_FRAGMENT_CONFIG = PROJECT727_CONFIG.boot.fragments;
const BOOT_DECODED_IDENTITY = PROJECT727_CONFIG.boot.decodedIdentity;
const COURT_SHOTS = PROJECT727_CONFIG.court.shots;

const COURT_SOLUTION_ORDER = COURT_SHOTS.map((shot) => shot.id);

const COURT_LANDING_CONFIG = Object.fromEntries(COURT_SHOTS.map((shot) => [shot.id, shot.coordinate]));
const COURT_ZONES = PROJECT727_CONFIG.court.zones;
const COURT_REVEAL = PROJECT727_CONFIG.court.reveal;
const TABLE_OBJECTS = PROJECT727_CONFIG.table.objects;
const TABLE_SOLUTION_ORDER = PROJECT727_CONFIG.table.clockwiseOrder;
const TABLE_REVEAL = PROJECT727_CONFIG.table.reveal;
const ROOM_MAPS = PROJECT727_CONFIG.room.maps;
const ROOM_INTENDED_MAP = PROJECT727_CONFIG.room.intendedMap;
const ROOM_INTENDED_ROUTE = PROJECT727_CONFIG.room.intendedRoute;
const ROOM_REVEAL = PROJECT727_CONFIG.room.reveal;
const ORIGIN_RECORDS = PROJECT727_CONFIG.origin.records;
const ORIGIN_TOKENS = PROJECT727_CONFIG.origin.tokens;
const ORIGIN_TARGETS = PROJECT727_CONFIG.origin.targets;
const ORIGIN_RECORD_ORDER = PROJECT727_CONFIG.origin.recordOrder;
const ORIGIN_CANONICAL_DATE = PROJECT727_CONFIG.origin.canonicalDate;

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
    objective: 'Rebuild the table arrangement using the recovered Limon receipt.',
    prompt: '',
    answers: [],
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
    objective: 'Use the physical maps to construct the only route that satisfies every access rule.',
    prompt: '',
    answers: [],
    hints: [
      'Eliminate any map that forces a locked door before its matching key is collected.',
      'The valid route must pass the center and never revisit a room. Rotate the overlay toward the entrance.',
      'Use Map B and begin with S → R → C. Continue without revisiting a room.'
    ],
    restored: 'Record restored: three beginnings are intact. One event changed the archive from two records into one case.'
  },
  {
    id: 'origin',
    index: 4,
    label: 'Record 04 — The Origin',
    subtitle: 'Status Change // Activation',
    zone: 'Primary Bedroom',
    objective: 'Order the recovered records, link their evidence, then verify the physical activation date.',
    prompt: '',
    answers: [],
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

function createTableState(overrides = {}) {
  return {
    arrangement: ['receipt', null, null, null, null, null],
    selectedObject: null,
    solved: false,
    ...overrides
  };
}

function createRoomState(overrides = {}) {
  return {
    selectedMap: 'A',
    routes: { A: ['S'], B: ['S'], C: ['S'] },
    solved: false,
    ...overrides
  };
}

function createOriginState(overrides = {}) {
  return {
    recordOrder: Array(4).fill(null),
    selectedRecord: null,
    tokenLinks: {},
    selectedToken: null,
    dateConfirmed: false,
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
      court: createCourtState(),
      table: createTableState(),
      room: createRoomState(),
      origin: createOriginState()
    }
  };
}

let state = loadState();
let adminOpen = new URLSearchParams(location.search).get('admin') === '727';
let draggedShotId = null;
let draggedTableObjectId = null;
let draggedOriginRecordId = null;
let bootTransitionPending = false;
let roomFeedbackMessage = '';
let originDateFeedback = '';

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

function sanitizeTableArrangement(arrangement) {
  const validIds = new Set(TABLE_OBJECTS.map((item) => item.id));
  const seen = new Set(['receipt']);
  return Array.from({ length: 6 }, (_, index) => {
    if (index === 0) return 'receipt';
    const value = Array.isArray(arrangement) ? arrangement[index] : null;
    if (!validIds.has(value) || value === 'receipt' || seen.has(value)) return null;
    seen.add(value);
    return value;
  });
}

function sanitizeRoomRoutes(routes) {
  return Object.fromEntries(Object.keys(ROOM_MAPS).map((mapId) => {
    const source = Array.isArray(routes?.[mapId]) ? routes[mapId] : ['S'];
    const route = ['S'];
    for (const nodeId of source.slice(source[0] === 'S' ? 1 : 0)) {
      const move = roomMoveStatus(mapId, route, nodeId);
      if (!move.ok) break;
      route.push(nodeId);
    }
    return [mapId, route];
  }));
}

function sanitizeOriginRecordOrder(order) {
  const validIds = new Set(ORIGIN_RECORDS.map((record) => record.id));
  const seen = new Set();
  return Array.from({ length: 4 }, (_, index) => {
    const value = Array.isArray(order) ? order[index] : null;
    if (!validIds.has(value) || seen.has(value)) return null;
    seen.add(value);
    return value;
  });
}

function sanitizeOriginTokenLinks(links) {
  const validTokens = new Set(ORIGIN_TOKENS.map((token) => token.id));
  const validTargets = new Set(ORIGIN_TARGETS.map((target) => target.id));
  const usedTargets = new Set();
  return Object.fromEntries(Object.entries(links || {}).filter(([tokenId, targetId]) => {
    if (!validTokens.has(tokenId) || !validTargets.has(targetId) || usedTargets.has(targetId)) return false;
    usedTargets.add(targetId);
    return true;
  }));
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
  const oldTable = raw.chapterState?.table || {};
  const oldRoom = raw.chapterState?.room || {};
  const oldOrigin = raw.chapterState?.origin || {};
  const bootSolved = Boolean(oldBoot.solved || wasAuthenticated || completed.includes('boot'));
  const courtSolved = Boolean(oldCourt.solved || completed.includes('court'));
  const tableSolved = Boolean(oldTable.solved || completed.includes('table'));
  const roomSolved = Boolean(oldRoom.solved || completed.includes('room'));
  const originSolved = Boolean(oldOrigin.solved || completed.includes('origin'));

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
      }),
      table: createTableState({
        arrangement: tableSolved ? [...TABLE_SOLUTION_ORDER] : sanitizeTableArrangement(oldTable.arrangement),
        selectedObject: TABLE_OBJECTS.some((item) => item.id === oldTable.selectedObject && item.id !== 'receipt') ? oldTable.selectedObject : null,
        solved: tableSolved
      }),
      room: createRoomState({
        selectedMap: ROOM_MAPS[oldRoom.selectedMap] ? oldRoom.selectedMap : (roomSolved ? ROOM_INTENDED_MAP : 'A'),
        routes: roomSolved
          ? { ...createRoomState().routes, [ROOM_INTENDED_MAP]: [...ROOM_INTENDED_ROUTE] }
          : sanitizeRoomRoutes(oldRoom.routes),
        solved: roomSolved
      }),
      origin: createOriginState({
        recordOrder: originSolved ? [...ORIGIN_RECORD_ORDER] : sanitizeOriginRecordOrder(oldOrigin.recordOrder),
        selectedRecord: ORIGIN_RECORDS.some((record) => record.id === oldOrigin.selectedRecord) ? oldOrigin.selectedRecord : null,
        tokenLinks: originSolved
          ? Object.fromEntries(ORIGIN_TOKENS.map((token) => [token.id, token.target]))
          : sanitizeOriginTokenLinks(oldOrigin.tokenLinks),
        selectedToken: ORIGIN_TOKENS.some((token) => token.id === oldOrigin.selectedToken) ? oldOrigin.selectedToken : null,
        dateConfirmed: originSolved || Boolean(oldOrigin.dateConfirmed),
        solved: originSolved
      })
    }
  };
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const previous = PREVIOUS_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    const parsed = JSON.parse(stored || previous || 'null');
    const migrated = migrateState(parsed);
    if (!stored && parsed) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      } catch {
        // A readable legacy state remains usable even if the migrated copy cannot be written.
      }
    }
    return migrated;
  } catch {
    return createDefaultState();
  }
}

function saveState(next) {
  state = migrateState(next);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Keep the in-memory session playable if browser storage becomes unavailable.
  }
  render();
}

function chapterById(id) {
  return CHAPTERS.find((chapter) => chapter.id === id) || CHAPTERS[0];
}

function nextChapter(id) {
  const index = CHAPTERS.findIndex((chapter) => chapter.id === id);
  return CHAPTERS[Math.min(index + 1, CHAPTERS.length - 1)].id;
}

function playTone(kind) {
  if (!state.soundOn) return;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return;
  try {
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
    oscillator.addEventListener('ended', () => {
      if (typeof ctx.close === 'function') ctx.close().catch(() => {});
    }, { once: true });
    oscillator.start();
    oscillator.stop(ctx.currentTime + (kind === 'open' ? 0.85 : 0.4));
  } catch {
    // Sound is optional; an audio policy or device failure must never block progression.
  }
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
  const supported = Boolean(document.documentElement.requestFullscreen && document.fullscreenEnabled !== false);
  const active = Boolean(document.fullscreenElement);
  return `<button id="fullscreen-button" class="utility-button" ${supported ? '' : 'disabled title="Fullscreen is unavailable in this browser"'}>${supported ? (active ? 'EXIT FULLSCREEN' : 'FULLSCREEN') : 'FULLSCREEN N/A'}</button>`;
}

function bootIsSolved(orientations) {
  return BOOT_FRAGMENT_CONFIG.every((fragment, index) => fragment.correctOrientation === orientations[index]);
}

function bootMarkup() {
  const boot = state.chapterState.boot;
  const solved = bootIsSolved(boot.fragmentOrientations);
  const fragments = BOOT_FRAGMENT_CONFIG.map((fragment, index) => {
    const orientation = boot.fragmentOrientations[index];
    const connector = index < BOOT_FRAGMENT_CONFIG.length - 1
      ? '<span class="boot-connector" aria-hidden="true"></span>'
      : '';
    return `
      <button class="boot-fragment ${solved ? 'decoded' : ''}" data-boot-fragment="${index}" aria-label="Rotate archive fragment ${index + 1}" ${solved ? 'disabled' : ''}>
        <span class="fragment-index">F${index + 1}</span>
        <span class="fragment-glyph">${esc(solved ? BOOT_DECODED_IDENTITY[index] : fragment.glyphs[orientation])}</span>
        <span class="fragment-action">${solved ? 'DECODED' : 'ROTATE'}</span>
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
        <div class="puzzle-feedback ${solved ? 'restored' : 'incomplete'}" aria-live="polite">
          <strong>${solved ? 'IDENTITY PATTERN RESTORED' : 'IDENTITY PATTERN INCOMPLETE'}</strong>
          <span>${solved ? 'Identity decoded. Opening archive…' : 'Match all four field symbols to the physical calibration card. Partial states are not validated.'}</span>
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
      <h2>Birthday record ready.</h2>
      <div class="final-metrics">
        <div><span>IDENTITY</span><strong>VERIFIED</strong></div>
        <div><span>RECORDS</span><strong>04 RESTORED</strong></div>
        <div><span>ACTIVATION DATE</span><strong>VERIFIED</strong></div>
      </div>
      <div class="vault-instruction">
        <span>FINAL ARCHIVE</span><strong>GUEST BEDROOM</strong>
        <span>ACCESS FORMAT</span><strong>MMDD</strong>
      </div>
      <p class="final-copy">The birthday vault is now available. Use the verified activation date in the displayed access format.</p>
      <div class="birthday-line">HAPPY BIRTHDAY, TINA.</div>
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

  if (court.solved) {
    return `
      <section class="court-complete-state">
        <div class="court-complete-copy">
          <div class="restore-mark">✓</div>
          <div class="eyebrow">RALLY RECONSTRUCTED</div>
          <h2>FIRST CONTACT RECORD RESTORED</h2>
          <p>The recovered trajectory has resolved the next archive source.</p>
          <div class="next-source"><span>NEXT EVIDENCE SOURCE</span><strong>KITCHEN</strong></div>
          <button id="court-continue" class="primary">Continue to Table</button>
        </div>
        <div class="court-complete-visual">
          <div class="panel-heading"><div><span>VERIFIED TRAJECTORY</span><strong>SEVEN LANDING RECORDS</strong></div></div>
          <svg class="badminton-court completed-court" viewBox="0 0 440 380" aria-label="Completed badminton trajectory">
            <rect class="court-boundary" x="20" y="15" width="400" height="350"></rect>
            <line class="court-line" x1="220" y1="15" x2="220" y2="365"></line>
            <line class="court-line net" x1="20" y1="190" x2="420" y2="190"></line>
            ${zones}
            <g class="trajectory">${trajectoryMarkup(court)}</g>
          </svg>
          <div class="completion-sequence">${court.shotOrder.map((shotId, index) => `<span><b>${index + 1}</b>${esc(shotLabel(shotId))}<strong>${esc(court.landingAssignments[shotId])}</strong></span>`).join('')}</div>
        </div>
      </section>`;
  }

  return `
    <section class="court-workspace">
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

    </section>`;
}

function tableObject(id) {
  return TABLE_OBJECTS.find((item) => item.id === id);
}

function tablePositions(arrangement) {
  return Object.fromEntries(arrangement.map((id, index) => [id, index]).filter(([id]) => id));
}

function tableAdjacent(first, second) {
  const distance = Math.abs(first - second);
  return distance === 1 || distance === 5;
}

function tableFeedback(table) {
  if (table.solved) return { type: 'restored', message: 'TABLE RECORD RESTORED' };
  const positions = tablePositions(table.arrangement);
  const filled = table.arrangement.filter(Boolean).length;

  if (positions.receipt !== 0) {
    return { type: 'contradiction', message: 'Receipt must remain fixed at 12 o’clock.' };
  }
  if (positions.dessert !== undefined && positions.dessert !== 5) {
    return { type: 'contradiction', message: 'Dessert must sit immediately counterclockwise from Receipt.' };
  }
  if (positions.main !== undefined && positions.lemon !== undefined && Math.abs(positions.main - positions.lemon) !== 3) {
    return { type: 'contradiction', message: 'Main and Lemon must remain opposite.' };
  }
  if (positions.glass !== undefined && positions.lemon !== undefined && positions.glass !== (positions.lemon + 1) % 6) {
    return { type: 'contradiction', message: 'Glass must sit immediately clockwise from Lemon.' };
  }
  if (positions.starter !== undefined && positions.glass !== undefined && !tableAdjacent(positions.starter, positions.glass)) {
    return { type: 'contradiction', message: 'Starter must remain adjacent to Glass.' };
  }
  if (positions.starter !== undefined && positions.main !== undefined && !tableAdjacent(positions.starter, positions.main)) {
    return { type: 'contradiction', message: 'Starter must remain adjacent to Main.' };
  }
  if (filled < 6) {
    return { type: 'incomplete', message: 'Arrangement incomplete. Current placements remain consistent.' };
  }
  return TABLE_SOLUTION_ORDER.every((id, index) => table.arrangement[index] === id)
    ? { type: 'restored', message: 'TABLE RECORD RESTORED' }
    : { type: 'contradiction', message: 'The completed arrangement conflicts with the recovered receipt.' };
}

function tableSolvedMarkup(table) {
  const revealTiles = table.arrangement.map((id, index) => {
    const item = tableObject(id);
    return `<span style="--delay:${index}"><small>${esc(item.label)}</small><strong>${esc(item.reveal)}</strong></span>`;
  }).join('');
  return `
    <section class="table-complete-state">
      <div class="receipt-scan">
        <div class="scan-beam" aria-hidden="true"></div>
        <div class="eyebrow">RECEIPT SCAN // VERIFIED</div>
        <h2>FIRST DATE RECORD RESTORED</h2>
        <div class="reveal-tiles" aria-label="Recovered location">${revealTiles}</div>
      </div>
      <div class="table-complete-copy">
        <div class="restore-mark">✓</div>
        <p>The six place records resolve to a marked storage point in the kitchen.</p>
        <div class="next-source"><span>NEXT EVIDENCE SOURCE</span><strong>${esc(TABLE_REVEAL)}</strong></div>
        <div class="marker-callout"><span>PLACEMENT MARK</span><strong>△</strong></div>
        <button id="table-continue" class="primary">Continue to Room</button>
      </div>
    </section>`;
}

function tableMarkup(chapter) {
  const table = state.chapterState.table;
  if (table.solved) return tableSolvedMarkup(table);

  const status = tableFeedback(table);
  const hintCount = state.hintsUsed.table || 0;
  const hints = chapter.hints.slice(0, hintCount).map((hint, index) => `
    <p class="hint-line"><strong>H${index + 1}</strong><span>${esc(hint)}</span></p>`).join('');
  const placed = new Set(table.arrangement.filter(Boolean));
  const bank = TABLE_OBJECTS.filter((item) => !placed.has(item.id)).map((item) => `
    <button class="table-token ${table.selectedObject === item.id ? 'selected' : ''}" draggable="true" data-table-token="${item.id}">
      <span>${esc(item.symbol)}</span><strong>${esc(item.label)}</strong>
    </button>`).join('');
  const slots = table.arrangement.map((id, index) => {
    const item = tableObject(id);
    const fixed = index === 0;
    return `
      <div class="table-slot position-${index} ${id ? 'filled' : ''} ${table.selectedObject === id ? 'selected' : ''}" style="--position:${index}" data-table-slot="${index}" role="button" tabindex="${fixed ? '-1' : '0'}" aria-label="Table position ${index + 1}${item ? `, ${item.label}` : ', empty'}">
        <span class="clock-label">${index === 0 ? '12' : index * 2} O’CLOCK</span>
        ${item ? `<button class="table-token placed ${fixed ? 'fixed' : ''}" data-table-token="${item.id}" ${fixed ? 'disabled' : 'draggable="true"'}><span>${esc(item.symbol)}</span><strong>${esc(item.label)}</strong></button>${fixed ? '<small>FIXED ANCHOR</small>' : `<button class="remove-table-object" data-remove-table-object="${item.id}" aria-label="Remove ${esc(item.label)}">×</button>`}` : '<span class="table-slot-empty">PLACE RECORD</span>'}
      </div>`;
  }).join('');

  return `
    <section class="table-workspace">
      <aside class="table-panel table-evidence">
        <div class="eyebrow">RECORD 02 // FIRST DATE</div>
        <h2>The Table</h2>
        <div class="evidence-block"><span>PHYSICAL EVIDENCE</span><strong>LIMON RECEIPT</strong><small>Five recovered seating constraints</small></div>
        <div class="evidence-block"><span>FIXED RECORD</span><p>Receipt remains at 12 o’clock. Arrange every other object clockwise around it.</p></div>
        <div class="court-hints">
          <div class="hint-header"><span>ASSISTANCE</span><button id="hint-button" class="ghost" ${hintCount >= 3 ? 'disabled' : ''}>Hint ${Math.min(hintCount + 1, 3)} / 3</button></div>
          ${hints}
        </div>
      </aside>
      <div class="table-panel table-board-panel">
        <div class="panel-heading"><div><span>CIRCULAR RECONSTRUCTION</span><strong>DRAG OR CLICK TO PLACE</strong></div><button id="table-reset" class="ghost">Reset Table</button></div>
        <div class="round-table" aria-label="Six-position circular table">
          <div class="table-center"><span>PROJECT 727</span><strong>LIMON</strong><small>CLOCKWISE</small></div>
          ${slots}
        </div>
      </div>
      <aside class="table-panel table-bank-panel">
        <div class="panel-heading"><div><span>RECOVERED OBJECTS</span><strong>SELECT A RECORD</strong></div></div>
        <div class="table-bank">${bank || '<span class="bank-empty">All records placed.</span>'}</div>
        <div class="puzzle-feedback ${status.type}" aria-live="polite"><strong>${esc(status.message)}</strong><span>${table.selectedObject ? `${esc(tableObject(table.selectedObject).label)} selected.` : 'Select an object, then choose a table position.'}</span></div>
      </aside>
    </section>`;
}

function roomMap(mapId) {
  return ROOM_MAPS[mapId] || ROOM_MAPS.A;
}

function roomEdgeForMove(mapId, from, to) {
  return roomMap(mapId).edges.find((edge) =>
    (edge.from === from && edge.to === to)
    || (edge.twoWay && edge.from === to && edge.to === from)
  );
}

function simulateRoomRoute(mapId, route) {
  const map = roomMap(mapId);
  const inventory = new Set();
  const consumedDoors = [];
  const visited = new Set();
  let error = '';

  for (let index = 0; index < route.length; index += 1) {
    const nodeId = route[index];
    const node = map.nodes.find((item) => item.id === nodeId);
    if (!node || visited.has(nodeId)) {
      error = visited.has(nodeId) ? 'Rooms cannot be revisited.' : 'Unknown room record.';
      break;
    }
    if (index > 0) {
      const edge = roomEdgeForMove(mapId, route[index - 1], nodeId);
      if (!edge) {
        error = 'No recovered passage connects those rooms in that direction.';
        break;
      }
      if (edge.door) {
        if (!inventory.has(edge.door)) {
          error = `${edge.door.toUpperCase()} DOOR is locked. Its matching key has not been collected.`;
          break;
        }
        inventory.delete(edge.door);
        consumedDoors.push(edge.door);
      }
    }
    visited.add(nodeId);
    if (node.item) inventory.add(node.item);
  }

  return {
    valid: !error,
    error,
    inventory: [...inventory],
    consumedDoors,
    visited: [...visited],
    current: route[route.length - 1]
  };
}

function roomMoveStatus(mapId, route, nextNodeId) {
  const current = route[route.length - 1];
  if (route.includes(nextNodeId)) {
    return { ok: false, message: 'Rooms cannot be revisited.' };
  }
  const edge = roomEdgeForMove(mapId, current, nextNodeId);
  if (!edge) {
    const reverseOnly = roomMap(mapId).edges.some((item) => !item.twoWay && item.from === nextNodeId && item.to === current);
    return {
      ok: false,
      message: reverseOnly ? 'That passage is one-way in the opposite direction.' : 'No recovered passage connects those rooms.'
    };
  }
  const simulation = simulateRoomRoute(mapId, route);
  if (edge.door && !simulation.inventory.includes(edge.door)) {
    return { ok: false, message: `${edge.door.toUpperCase()} DOOR is locked. Find its matching key first.` };
  }
  const nextRoute = [...route, nextNodeId];
  if (nextNodeId === 'X' && !nextRoute.includes('C')) {
    return { ok: false, message: 'A valid escape route must visit central room C.' };
  }
  return { ok: true, message: 'Passage accepted.' };
}

function roomRouteIsSolved(mapId, route) {
  return mapId === ROOM_INTENDED_MAP
    && route.length === ROOM_INTENDED_ROUTE.length
    && ROOM_INTENDED_ROUTE.every((nodeId, index) => route[index] === nodeId)
    && simulateRoomRoute(mapId, route).valid;
}

function roomSolutionRoutes(mapId) {
  const solutions = [];
  const visit = (route) => {
    const current = route[route.length - 1];
    if (current === 'X') {
      if (route.includes('C') && simulateRoomRoute(mapId, route).valid) solutions.push(route);
      return;
    }
    for (const node of roomMap(mapId).nodes) {
      if (roomMoveStatus(mapId, route, node.id).ok) visit([...route, node.id]);
    }
  };
  visit(['S']);
  return solutions;
}

function roomSolvedMarkup(room) {
  const route = room.routes[ROOM_INTENDED_MAP];
  const letterTiles = route.map((nodeId, index) => {
    const node = roomMap(ROOM_INTENDED_MAP).nodes.find((item) => item.id === nodeId);
    return `<span style="--delay:${index}"><small>${esc(nodeId)}</small><strong>${esc(node.reveal)}</strong></span>`;
  }).join('');
  return `
    <section class="room-complete-state">
      <div class="room-complete-route">
        <div class="eyebrow">ESCAPE ROUTE // VERIFIED</div>
        <h2>FIRST ESCAPE RECORD RESTORED</h2>
        <div class="room-letter-route">${letterTiles}</div>
        <div class="verified-path">${route.map(esc).join(' → ')}</div>
      </div>
      <div class="room-complete-copy">
        <div class="restore-mark">✓</div>
        <p>The valid route resolves the next evidence source outside the walk-in closet.</p>
        <div class="next-source"><span>NEXT EVIDENCE SOURCE</span><strong>${esc(ROOM_REVEAL)}</strong></div>
        <small>Proceed to the primary bedroom.</small>
        <button id="room-continue" class="primary">Continue to Origin</button>
      </div>
    </section>`;
}

function roomMarkup(chapter) {
  const room = state.chapterState.room;
  if (room.solved) return roomSolvedMarkup(room);

  const mapId = room.selectedMap;
  const map = roomMap(mapId);
  const route = room.routes[mapId];
  const simulation = simulateRoomRoute(mapId, route);
  const hintCount = state.hintsUsed.room || 0;
  const hints = chapter.hints.slice(0, hintCount).map((hint, index) => `
    <p class="hint-line"><strong>H${index + 1}</strong><span>${esc(hint)}</span></p>`).join('');
  const edgeLines = map.edges.map((edge) => {
    const from = map.nodes.find((node) => node.id === edge.from);
    const to = map.nodes.find((node) => node.id === edge.to);
    return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>`;
  }).join('');
  const nodes = map.nodes.map((node) => {
    const visitedIndex = route.indexOf(node.id);
    const current = simulation.current === node.id;
    return `
      <button class="room-node ${visitedIndex >= 0 ? 'visited' : ''} ${current ? 'current' : ''}" style="--x:${node.x}%;--y:${node.y}%;" data-room-node="${node.id}" aria-label="Room ${node.id}${current ? ', current' : visitedIndex >= 0 ? ', visited' : ''}">
        <span>${esc(node.id)}</span>${visitedIndex >= 0 ? `<small>${visitedIndex + 1}</small>` : ''}
      </button>`;
  }).join('');
  const inventory = simulation.inventory.length
    ? simulation.inventory.map((key) => `<span class="key-chip ${key}">${key.toUpperCase()} KEY</span>`).join('')
    : '<span class="inventory-empty">No keys held</span>';
  const consumed = simulation.consumedDoors.length
    ? simulation.consumedDoors.map((door) => `<span>${door.toUpperCase()} DOOR OPENED</span>`).join('')
    : '<span>No doors opened</span>';

  return `
    <section class="room-workspace">
      <aside class="room-panel room-evidence">
        <div class="eyebrow">RECORD 03 // FIRST ESCAPE</div>
        <h2>The Room</h2>
        <div class="evidence-block"><span>PHYSICAL EVIDENCE</span><strong>MAPS A / B / C</strong><small>Keys, doors, and one-way arrows remain on paper.</small></div>
        <div class="room-rules"><span>ROUTE PROTOCOL</span><p>Reach X, visit C, obey one-way passages, use matching keys, and never revisit a room.</p></div>
        <div class="court-hints">
          <div class="hint-header"><span>ASSISTANCE</span><button id="hint-button" class="ghost" ${hintCount >= 3 ? 'disabled' : ''}>Hint ${Math.min(hintCount + 1, 3)} / 3</button></div>
          ${hints}
        </div>
      </aside>
      <div class="room-panel room-map-panel">
        <div class="panel-heading">
          <div><span>DIGITAL ROUTE ENGINE</span><strong>SELECT A CONNECTED ROOM</strong></div>
          <div class="room-map-actions"><button id="room-undo" class="ghost" ${route.length <= 1 ? 'disabled' : ''}>Undo</button><button id="room-reset" class="ghost" ${route.length <= 1 ? 'disabled' : ''}>Reset Map</button></div>
        </div>
        <div class="map-tabs" role="tablist">${Object.keys(ROOM_MAPS).map((id) => `<button class="${id === mapId ? 'active' : ''}" data-room-map="${id}" role="tab" aria-selected="${id === mapId}">Map ${id}</button>`).join('')}</div>
        <div class="room-map-canvas" aria-label="Digital route map ${esc(mapId)}">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edgeLines}</svg>
          ${nodes}
        </div>
        <div class="route-tape"><span>ACTIVE ROUTE</span><strong>${route.map(esc).join(' → ')}</strong></div>
      </div>
      <aside class="room-panel room-status-panel">
        <div class="inventory-block"><span>INVENTORY</span><div>${inventory}</div></div>
        <div class="door-log"><span>ACCESS LOG</span><div>${consumed}</div></div>
        <div class="puzzle-feedback ${roomFeedbackMessage ? 'contradiction' : 'incomplete'}" aria-live="polite">
          <strong>${esc(roomFeedbackMessage || 'Route active. Consult the physical map.')}</strong>
          <span>Current room: ${esc(simulation.current)}</span>
        </div>
      </aside>
    </section>`;
}

function originRecord(id) {
  return ORIGIN_RECORDS.find((record) => record.id === id);
}

function originToken(id) {
  return ORIGIN_TOKENS.find((token) => token.id === id);
}

function originOrderIsCorrect(order) {
  return ORIGIN_RECORD_ORDER.every((id, index) => order[index] === id);
}

function originLinksAreCorrect(links) {
  return ORIGIN_TOKENS.every((token) => links[token.id] === token.target);
}

function originReconstructionReady(origin) {
  return originOrderIsCorrect(origin.recordOrder) && originLinksAreCorrect(origin.tokenLinks);
}

function originFeedback(origin) {
  const filledRecords = origin.recordOrder.filter(Boolean).length;
  if (filledRecords === 4 && !originOrderIsCorrect(origin.recordOrder)) {
    return { type: 'contradiction', message: 'The four records are not in chronological order.' };
  }
  const incorrectLink = Object.entries(origin.tokenLinks).some(([tokenId, targetId]) => originToken(tokenId)?.target !== targetId);
  if (incorrectLink) {
    return { type: 'contradiction', message: 'One evidence token conflicts with its linked archive record.' };
  }
  if (originReconstructionReady(origin)) {
    return { type: 'restored', message: 'DIGITAL RECONSTRUCTION COMPLETE' };
  }
  return { type: 'incomplete', message: `Timeline ${filledRecords} / 4 · Evidence links ${Object.keys(origin.tokenLinks).length} / 4` };
}

function originMarkup(chapter) {
  const origin = state.chapterState.origin;
  const status = originFeedback(origin);
  const ready = originReconstructionReady(origin);
  const hintCount = state.hintsUsed.origin || 0;
  const hints = chapter.hints.slice(0, hintCount).map((hint, index) => `
    <p class="hint-line"><strong>H${index + 1}</strong><span>${esc(hint)}</span></p>`).join('');
  const placed = new Set(origin.recordOrder.filter(Boolean));
  const recordBank = ORIGIN_RECORDS.filter((record) => !placed.has(record.id)).map((record) => `
    <button class="origin-record-token ${origin.selectedRecord === record.id ? 'selected' : ''}" draggable="true" data-origin-record="${record.id}">
      <span>${esc(record.archive)}</span><strong>${esc(record.label)}</strong>
    </button>`).join('');
  const timelineSlots = origin.recordOrder.map((recordId, index) => {
    const record = originRecord(recordId);
    return `
      <div class="origin-slot ${recordId ? 'filled' : ''}" data-origin-slot="${index}" role="button" tabindex="0" aria-label="Timeline position ${index + 1}${record ? `, ${record.label}` : ', empty'}">
        <span class="slot-number">0${index + 1}</span>
        ${record ? `<button class="origin-record-token placed ${origin.selectedRecord === record.id ? 'selected' : ''}" draggable="true" data-origin-record="${record.id}"><span>${esc(record.archive)}</span><strong>${esc(record.label)}</strong></button><button class="remove-origin-record" data-remove-origin-record="${record.id}" aria-label="Remove ${esc(record.label)}">×</button>` : '<span class="origin-slot-empty">PLACE RECORD</span>'}
      </div>`;
  }).join('');
  const unlinkedTokens = ORIGIN_TOKENS.filter((token) => !origin.tokenLinks[token.id]).map((token) => `
    <button class="evidence-token ${origin.selectedToken === token.id ? 'selected' : ''}" data-origin-token="${token.id}">
      <span>${esc(token.symbol)}</span><strong>${esc(token.label)}</strong>
    </button>`).join('');
  const targetCards = ORIGIN_TARGETS.map((target) => {
    const tokenEntry = Object.entries(origin.tokenLinks).find(([, targetId]) => targetId === target.id);
    const token = tokenEntry ? originToken(tokenEntry[0]) : null;
    return `
      <button class="evidence-target ${token ? 'linked' : ''}" data-origin-target="${target.id}" aria-label="Evidence target ${target.label}${token ? `, linked to ${token.label}` : ''}">
        <span>${esc(target.label)}</span>
        ${token ? `<strong>${esc(token.symbol)} ${esc(token.label)}</strong><small data-unlink-origin-token="${token.id}">REMOVE</small>` : '<strong>LINK TOKEN</strong>'}
      </button>`;
  }).join('');

  return `
    <section class="origin-workspace">
      <aside class="origin-panel origin-evidence">
        <div class="eyebrow">RECORD 04 // STATUS CHANGE</div>
        <h2>The Origin</h2>
        <div class="evidence-block"><span>PHYSICAL EVIDENCE</span><strong>4 RECORD CARDS</strong><small>Timeline sleeve and four evidence tokens</small></div>
        <div class="court-hints">
          <div class="hint-header"><span>ASSISTANCE</span><button id="hint-button" class="ghost" ${hintCount >= 3 ? 'disabled' : ''}>Hint ${Math.min(hintCount + 1, 3)} / 3</button></div>
          ${hints}
        </div>
      </aside>
      <div class="origin-panel origin-build-panel">
        <div class="origin-layer">
          <div class="panel-heading"><div><span>LAYER 1 // CHRONOLOGY</span><strong>DRAG OR CLICK TO ORDER</strong></div><button id="origin-reset" class="ghost">Reset Origin</button></div>
          <div class="origin-record-bank">${recordBank || '<span class="bank-empty">All records placed.</span>'}</div>
          <div class="origin-timeline">${timelineSlots}</div>
        </div>
        <div class="origin-layer token-layer">
          <div class="panel-heading"><div><span>LAYER 2 // EVIDENCE LINKS</span><strong>SELECT A TOKEN, THEN AN ARCHIVE</strong></div></div>
          <div class="origin-link-grid">
            <div class="evidence-token-bank">${unlinkedTokens || '<span class="bank-empty">All evidence tokens linked.</span>'}</div>
            <div class="evidence-targets">${targetCards}</div>
          </div>
        </div>
      </div>
      <aside class="origin-panel origin-status-panel">
        <div class="origin-layer-status"><span>CHRONOLOGY</span><strong>${originOrderIsCorrect(origin.recordOrder) ? 'VERIFIED' : `${origin.recordOrder.filter(Boolean).length} / 4`}</strong></div>
        <div class="origin-layer-status"><span>EVIDENCE LINKS</span><strong>${originLinksAreCorrect(origin.tokenLinks) ? 'VERIFIED' : `${Object.keys(origin.tokenLinks).length} / 4`}</strong></div>
        <div class="puzzle-feedback ${status.type}" aria-live="polite"><strong>${esc(status.message)}</strong><span>${ready ? 'Read the activation date from the physical timeline.' : 'Complete both reconstruction layers.'}</span></div>
        ${ready ? `
          <form id="origin-date-form" class="origin-date-form">
            <div class="eyebrow">FINAL DATE VERIFICATION</div>
            <p>The digital windows are open. Read the physical timeline and enter the full activation date.</p>
            <label>YYYY/MM/DD<input id="origin-date-input" autocomplete="off" inputmode="numeric" placeholder="YYYY/MM/DD" /></label>
            <button type="submit" class="primary">Verify activation date</button>
            <div class="status-message ${originDateFeedback ? 'error' : ''}">${esc(originDateFeedback || 'Awaiting physical record.')}</div>
          </form>` : ''}
      </aside>
    </section>`;
}

function adminMarkup() {
  if (!adminOpen) return '';
  const current = chapterById(state.currentChapter);
  const completedLabels = state.completed.map((id) => chapterById(id).label).join(', ');
  const hintsUsed = Object.values(state.hintsUsed).reduce((total, count) => total + count, 0);
  const court = state.chapterState.court;
  const table = state.chapterState.table;
  const room = state.chapterState.room;
  const origin = state.chapterState.origin;
  const assignmentSummary = COURT_SHOTS.map((shot) => `${shot.label}:${court.landingAssignments[shot.id] || '—'}`).join(' · ');
  const tableSummary = table.arrangement.map((id) => id ? tableObject(id).label : '—').join(' → ');
  const roomRoute = room.routes[room.selectedMap].join(' → ');
  const roomInventory = simulateRoomRoute(room.selectedMap, room.routes[room.selectedMap]).inventory.join(', ') || 'None';
  const originOrderSummary = origin.recordOrder.map((id) => id ? originRecord(id).label : '—').join(' → ');
  const originLinksSummary = ORIGIN_TOKENS.map((token) => `${token.label}:${origin.tokenLinks[token.id] || '—'}`).join(' · ');
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
          <button id="admin-solve-table">Solve Table</button>
          <button id="admin-reset-table">Reset Table</button>
          <button id="admin-solve-room">Solve Room</button>
          <button id="admin-reset-room">Reset Room</button>
          <button id="admin-solve-origin">Solve Origin Layers</button>
          <button id="admin-reset-origin">Reset Origin</button>
          <button id="admin-bypass-date">Bypass Date</button>
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
        <details class="admin-inspector">
          <summary>Inspect Table state</summary>
          <p><strong>CLOCKWISE</strong> ${esc(tableSummary)}</p>
        </details>
        <details class="admin-inspector">
          <summary>Inspect Room state</summary>
          <p><strong>MAP</strong> ${esc(room.selectedMap)} · <strong>ROUTE</strong> ${esc(roomRoute)}</p>
          <p><strong>INVENTORY</strong> ${esc(roomInventory)}</p>
        </details>
        <details class="admin-inspector">
          <summary>Inspect Origin state</summary>
          <p><strong>ORDER</strong> ${esc(originOrderSummary)}</p>
          <p><strong>LINKS</strong> ${esc(originLinksSummary)}</p>
          <p><strong>DATE</strong> ${origin.dateConfirmed ? 'Confirmed' : 'Pending'}</p>
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
  const content = chapter.id === 'court'
    ? courtMarkup(chapter)
    : chapter.id === 'table'
      ? tableMarkup(chapter)
      : chapter.id === 'room'
        ? roomMarkup(chapter)
        : chapter.id === 'origin'
          ? originMarkup(chapter)
      : chapter.id === 'final'
        ? finalMarkup()
        : '';
  const interactiveStage = ['court', 'table', 'room', 'origin'].includes(chapter.id) ? `${chapter.id}-stage` : '';
  return `
    <div class="app-shell">
      <header class="topbar">
        <div><div class="eyebrow">PROJECT 727</div><strong>ORIGIN ARCHIVE</strong></div>
        <div class="topbar-meta"><span>SUBJECT: TINA</span><span>ARCHIVE: ACTIVE</span>${fullscreenButtonMarkup()}<button id="sound-button" class="utility-button">${state.soundOn ? 'SOUND ON' : 'SOUND OFF'}</button></div>
      </header>
      <div class="workspace">
        <aside class="progress-rail"><div class="progress-title">ARCHIVE RECORDS</div>${progressMarkup()}</aside>
        <main class="main-stage ${interactiveStage}">${content}</main>
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

function placeTableObject(objectId, targetIndex) {
  const table = state.chapterState.table;
  if (table.solved || targetIndex === 0 || objectId === 'receipt') return;
  const arrangement = [...table.arrangement];
  const sourceIndex = arrangement.indexOf(objectId);
  const displaced = arrangement[targetIndex];
  if (sourceIndex > 0) arrangement[sourceIndex] = displaced || null;
  arrangement[targetIndex] = objectId;
  const nextTable = createTableState({ ...table, arrangement, selectedObject: objectId });
  const solved = tableFeedback(nextTable).type === 'restored';
  nextTable.solved = solved;
  const completed = solved && !state.completed.includes('table') ? [...state.completed, 'table'] : state.completed;
  if (solved) playTone('ok');
  saveState({ ...state, completed, chapterState: { ...state.chapterState, table: nextTable } });
}

function removeTableObject(objectId) {
  const table = state.chapterState.table;
  if (table.solved || objectId === 'receipt') return;
  const arrangement = table.arrangement.map((id) => id === objectId ? null : id);
  saveState({
    ...state,
    chapterState: { ...state.chapterState, table: createTableState({ ...table, arrangement, selectedObject: null }) }
  });
}

function solveTableAdmin() {
  const completed = [...new Set(['boot', 'court', ...state.completed, 'table'])];
  saveState({
    ...state,
    authenticated: true,
    currentChapter: 'table',
    completed,
    chapterState: {
      ...state.chapterState,
      table: createTableState({ arrangement: [...TABLE_SOLUTION_ORDER], selectedObject: null, solved: true })
    }
  });
}

function resetTableAdmin() {
  const hintsUsed = { ...state.hintsUsed };
  delete hintsUsed.table;
  saveState({
    ...state,
    authenticated: true,
    currentChapter: 'table',
    completed: state.completed.filter((id) => id !== 'table'),
    hintsUsed,
    chapterState: { ...state.chapterState, table: createTableState() }
  });
}

function selectRoomMap(mapId) {
  if (!ROOM_MAPS[mapId] || state.chapterState.room.solved) return;
  roomFeedbackMessage = '';
  saveState({
    ...state,
    chapterState: { ...state.chapterState, room: createRoomState({ ...state.chapterState.room, selectedMap: mapId }) }
  });
}

function moveRoomNode(nodeId) {
  const room = state.chapterState.room;
  if (room.solved) return;
  const route = room.routes[room.selectedMap];
  const move = roomMoveStatus(room.selectedMap, route, nodeId);
  if (!move.ok) {
    roomFeedbackMessage = move.message;
    render();
    return;
  }
  const nextRoute = [...route, nodeId];
  const solved = roomRouteIsSolved(room.selectedMap, nextRoute);
  const routes = { ...room.routes, [room.selectedMap]: nextRoute };
  const completed = solved && !state.completed.includes('room') ? [...state.completed, 'room'] : state.completed;
  roomFeedbackMessage = '';
  if (solved) playTone('ok');
  saveState({
    ...state,
    completed,
    chapterState: { ...state.chapterState, room: createRoomState({ ...room, routes, solved }) }
  });
}

function undoRoomMove() {
  const room = state.chapterState.room;
  const route = room.routes[room.selectedMap];
  if (room.solved || route.length <= 1) return;
  roomFeedbackMessage = '';
  saveState({
    ...state,
    chapterState: {
      ...state.chapterState,
      room: createRoomState({ ...room, routes: { ...room.routes, [room.selectedMap]: route.slice(0, -1) } })
    }
  });
}

function resetCurrentRoomMap() {
  const room = state.chapterState.room;
  if (room.solved) return;
  roomFeedbackMessage = '';
  saveState({
    ...state,
    chapterState: {
      ...state.chapterState,
      room: createRoomState({ ...room, routes: { ...room.routes, [room.selectedMap]: ['S'] } })
    }
  });
}

function solveRoomAdmin() {
  const completed = [...new Set(['boot', 'court', 'table', ...state.completed, 'room'])];
  roomFeedbackMessage = '';
  saveState({
    ...state,
    authenticated: true,
    currentChapter: 'room',
    completed,
    chapterState: {
      ...state.chapterState,
      room: createRoomState({
        selectedMap: ROOM_INTENDED_MAP,
        routes: { ...createRoomState().routes, [ROOM_INTENDED_MAP]: [...ROOM_INTENDED_ROUTE] },
        solved: true
      })
    }
  });
}

function resetRoomAdmin() {
  const hintsUsed = { ...state.hintsUsed };
  delete hintsUsed.room;
  roomFeedbackMessage = '';
  saveState({
    ...state,
    authenticated: true,
    currentChapter: 'room',
    completed: state.completed.filter((id) => id !== 'room'),
    hintsUsed,
    chapterState: { ...state.chapterState, room: createRoomState() }
  });
}

function placeOriginRecord(recordId, targetIndex) {
  const origin = state.chapterState.origin;
  if (origin.solved) return;
  const recordOrder = [...origin.recordOrder];
  const sourceIndex = recordOrder.indexOf(recordId);
  const displaced = recordOrder[targetIndex];
  if (sourceIndex >= 0) recordOrder[sourceIndex] = displaced || null;
  recordOrder[targetIndex] = recordId;
  originDateFeedback = '';
  saveState({
    ...state,
    chapterState: { ...state.chapterState, origin: createOriginState({ ...origin, recordOrder, selectedRecord: recordId }) }
  });
}

function removeOriginRecord(recordId) {
  const origin = state.chapterState.origin;
  if (origin.solved) return;
  originDateFeedback = '';
  saveState({
    ...state,
    chapterState: {
      ...state.chapterState,
      origin: createOriginState({
        ...origin,
        recordOrder: origin.recordOrder.map((id) => id === recordId ? null : id),
        selectedRecord: null
      })
    }
  });
}

function assignOriginToken(targetId) {
  const origin = state.chapterState.origin;
  const tokenId = origin.selectedToken;
  if (!tokenId || origin.solved) return;
  const tokenLinks = Object.fromEntries(Object.entries(origin.tokenLinks).filter(([existingToken, existingTarget]) =>
    existingToken !== tokenId && existingTarget !== targetId
  ));
  tokenLinks[tokenId] = targetId;
  originDateFeedback = '';
  saveState({
    ...state,
    chapterState: {
      ...state.chapterState,
      origin: createOriginState({ ...origin, tokenLinks, selectedToken: null })
    }
  });
}

function unlinkOriginToken(tokenId) {
  const origin = state.chapterState.origin;
  if (origin.solved) return;
  const tokenLinks = { ...origin.tokenLinks };
  delete tokenLinks[tokenId];
  originDateFeedback = '';
  saveState({
    ...state,
    chapterState: { ...state.chapterState, origin: createOriginState({ ...origin, tokenLinks, selectedToken: tokenId }) }
  });
}

function solveOriginLayersAdmin() {
  const completed = [...new Set(['boot', 'court', 'table', 'room', ...state.completed])];
  originDateFeedback = '';
  saveState({
    ...state,
    authenticated: true,
    currentChapter: 'origin',
    completed,
    chapterState: {
      ...state.chapterState,
      origin: createOriginState({
        recordOrder: [...ORIGIN_RECORD_ORDER],
        selectedRecord: null,
        tokenLinks: Object.fromEntries(ORIGIN_TOKENS.map((token) => [token.id, token.target])),
        selectedToken: null,
        dateConfirmed: false,
        solved: false
      })
    }
  });
}

function bypassOriginDateAdmin() {
  const completed = [...new Set(['boot', 'court', 'table', 'room', ...state.completed, 'origin'])];
  originDateFeedback = '';
  saveState({
    ...state,
    authenticated: true,
    currentChapter: 'final',
    completed,
    chapterState: {
      ...state.chapterState,
      origin: createOriginState({
        recordOrder: [...ORIGIN_RECORD_ORDER],
        tokenLinks: Object.fromEntries(ORIGIN_TOKENS.map((token) => [token.id, token.target])),
        dateConfirmed: true,
        solved: true
      })
    }
  });
}

function resetOriginAdmin() {
  const hintsUsed = { ...state.hintsUsed };
  delete hintsUsed.origin;
  originDateFeedback = '';
  saveState({
    ...state,
    authenticated: true,
    currentChapter: 'origin',
    completed: state.completed.filter((id) => id !== 'origin'),
    hintsUsed,
    chapterState: { ...state.chapterState, origin: createOriginState() }
  });
}

function courtHasProgress() {
  const court = state.chapterState.court;
  return court.shotOrder.some(Boolean)
    || Object.keys(court.landingAssignments).length > 0
    || Boolean(state.hintsUsed.court);
}

function tableHasProgress() {
  const table = state.chapterState.table;
  return table.arrangement.slice(1).some(Boolean) || Boolean(state.hintsUsed.table);
}

function originHasProgress() {
  const origin = state.chapterState.origin;
  return origin.recordOrder.some(Boolean) || Object.keys(origin.tokenLinks).length > 0 || Boolean(state.hintsUsed.origin);
}

function bindEvents() {
  document.querySelectorAll('[data-boot-fragment]').forEach((button) => button.addEventListener('click', () => updateBootFragment(Number(button.dataset.bootFragment))));

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
    if (courtHasProgress() && !window.confirm('Reset the Court reconstruction?')) return;
    resetCourtAdmin();
  });

  const courtContinue = document.getElementById('court-continue');
  if (courtContinue) courtContinue.addEventListener('click', () => saveState({ ...state, currentChapter: 'table' }));

  document.querySelectorAll('[data-table-token]').forEach((token) => {
    if (token.dataset.tableToken === 'receipt') return;
    token.addEventListener('click', (event) => {
      event.stopPropagation();
      const table = state.chapterState.table;
      if (table.solved) return;
      saveState({
        ...state,
        chapterState: { ...state.chapterState, table: createTableState({ ...table, selectedObject: token.dataset.tableToken }) }
      });
    });
    token.addEventListener('dragstart', (event) => {
      draggedTableObjectId = token.dataset.tableToken;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', draggedTableObjectId);
    });
    token.addEventListener('dragend', () => { draggedTableObjectId = null; });
  });

  document.querySelectorAll('[data-table-slot]').forEach((slot) => {
    const targetIndex = Number(slot.dataset.tableSlot);
    if (targetIndex === 0) return;
    const placeSelected = () => {
      const selected = state.chapterState.table.selectedObject;
      if (selected) placeTableObject(selected, targetIndex);
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
      const objectId = event.dataTransfer.getData('text/plain') || draggedTableObjectId;
      if (objectId) placeTableObject(objectId, targetIndex);
      draggedTableObjectId = null;
    });
  });

  document.querySelectorAll('[data-remove-table-object]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation();
    removeTableObject(button.dataset.removeTableObject);
  }));

  const tableReset = document.getElementById('table-reset');
  if (tableReset) tableReset.addEventListener('click', () => {
    if (tableHasProgress() && !window.confirm('Reset the Table reconstruction?')) return;
    resetTableAdmin();
  });

  const tableContinue = document.getElementById('table-continue');
  if (tableContinue) tableContinue.addEventListener('click', () => saveState({ ...state, currentChapter: 'room' }));

  document.querySelectorAll('[data-room-map]').forEach((button) => button.addEventListener('click', () => selectRoomMap(button.dataset.roomMap)));
  document.querySelectorAll('[data-room-node]').forEach((button) => button.addEventListener('click', () => moveRoomNode(button.dataset.roomNode)));

  const roomUndo = document.getElementById('room-undo');
  if (roomUndo) roomUndo.addEventListener('click', undoRoomMove);

  const roomReset = document.getElementById('room-reset');
  if (roomReset) roomReset.addEventListener('click', () => {
    if (state.chapterState.room.routes[state.chapterState.room.selectedMap].length > 1
      && !window.confirm('Reset the current map route?')) return;
    resetCurrentRoomMap();
  });

  const roomContinue = document.getElementById('room-continue');
  if (roomContinue) roomContinue.addEventListener('click', () => saveState({ ...state, currentChapter: 'origin' }));

  document.querySelectorAll('[data-origin-record]').forEach((token) => {
    token.addEventListener('click', (event) => {
      event.stopPropagation();
      const origin = state.chapterState.origin;
      if (origin.solved) return;
      saveState({
        ...state,
        chapterState: {
          ...state.chapterState,
          origin: createOriginState({ ...origin, selectedRecord: token.dataset.originRecord })
        }
      });
    });
    token.addEventListener('dragstart', (event) => {
      draggedOriginRecordId = token.dataset.originRecord;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', draggedOriginRecordId);
    });
    token.addEventListener('dragend', () => { draggedOriginRecordId = null; });
  });

  document.querySelectorAll('[data-origin-slot]').forEach((slot) => {
    const targetIndex = Number(slot.dataset.originSlot);
    const placeSelected = () => {
      const selected = state.chapterState.origin.selectedRecord;
      if (selected) placeOriginRecord(selected, targetIndex);
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
      const recordId = event.dataTransfer.getData('text/plain') || draggedOriginRecordId;
      if (recordId) placeOriginRecord(recordId, targetIndex);
      draggedOriginRecordId = null;
    });
  });

  document.querySelectorAll('[data-remove-origin-record]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation();
    removeOriginRecord(button.dataset.removeOriginRecord);
  }));

  document.querySelectorAll('[data-origin-token]').forEach((button) => button.addEventListener('click', () => {
    const origin = state.chapterState.origin;
    saveState({
      ...state,
      chapterState: {
        ...state.chapterState,
        origin: createOriginState({ ...origin, selectedToken: button.dataset.originToken })
      }
    });
  }));

  document.querySelectorAll('[data-origin-target]').forEach((button) => button.addEventListener('click', () => assignOriginToken(button.dataset.originTarget)));
  document.querySelectorAll('[data-unlink-origin-token]').forEach((control) => control.addEventListener('click', (event) => {
    event.stopPropagation();
    unlinkOriginToken(control.dataset.unlinkOriginToken);
  }));

  const originReset = document.getElementById('origin-reset');
  if (originReset) originReset.addEventListener('click', () => {
    if (originHasProgress() && !window.confirm('Reset the Origin reconstruction?')) return;
    resetOriginAdmin();
  });

  const originDateForm = document.getElementById('origin-date-form');
  if (originDateForm) originDateForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const entered = document.getElementById('origin-date-input').value.trim();
    const accepted = entered === ORIGIN_CANONICAL_DATE || entered === ORIGIN_CANONICAL_DATE.replaceAll('/', '-');
    if (!accepted) {
      originDateFeedback = 'DATE NOT VERIFIED — RECHECK THE PHYSICAL TIMELINE';
      playTone('error');
      render();
      return;
    }
    const completed = state.completed.includes('origin') ? state.completed : [...state.completed, 'origin'];
    playTone('open');
    originDateFeedback = '';
    saveState({
      ...state,
      completed,
      currentChapter: 'final',
      chapterState: {
        ...state.chapterState,
        origin: createOriginState({ ...state.chapterState.origin, dateConfirmed: true, solved: true })
      }
    });
  });

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
    roomFeedbackMessage = '';
    originDateFeedback = '';
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

  const adminSolveTable = document.getElementById('admin-solve-table');
  if (adminSolveTable) adminSolveTable.addEventListener('click', solveTableAdmin);

  const adminResetTable = document.getElementById('admin-reset-table');
  if (adminResetTable) adminResetTable.addEventListener('click', resetTableAdmin);

  const adminSolveRoom = document.getElementById('admin-solve-room');
  if (adminSolveRoom) adminSolveRoom.addEventListener('click', solveRoomAdmin);

  const adminResetRoom = document.getElementById('admin-reset-room');
  if (adminResetRoom) adminResetRoom.addEventListener('click', resetRoomAdmin);

  const adminSolveOrigin = document.getElementById('admin-solve-origin');
  if (adminSolveOrigin) adminSolveOrigin.addEventListener('click', solveOriginLayersAdmin);

  const adminResetOrigin = document.getElementById('admin-reset-origin');
  if (adminResetOrigin) adminResetOrigin.addEventListener('click', resetOriginAdmin);

  const adminBypassDate = document.getElementById('admin-bypass-date');
  if (adminBypassDate) adminBypassDate.addEventListener('click', bypassOriginDateAdmin);

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
    try {
      localStorage.removeItem(STORAGE_KEY);
      PREVIOUS_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Continue with an in-memory reset when browser storage is unavailable.
    }
    state = createDefaultState();
    roomFeedbackMessage = '';
    originDateFeedback = '';
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
