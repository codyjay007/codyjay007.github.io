'use strict';

const STORAGE_KEY = 'project-570-state-v1';

const CHAPTERS = [
  {
    id: 'intro',
    index: 0,
    label: 'Identity Verification',
    subtitle: 'Origin Archive // Case 570',
    zone: 'Living Room Terminal',
    objective: 'Authenticate the subject and restore access to the archive.',
    prompt: 'Enter the authorized subject name and case identifier.',
    answers: [],
    hints: [],
    restored: 'Identity confirmed. Three origin records and one activation record remain corrupted.'
  },
  {
    id: 'court',
    index: 1,
    label: 'Record 01 — The Court',
    subtitle: 'First Contact // CAN-AM',
    zone: 'Living Room',
    objective: 'Reconstruct the rally from the physical evidence packet.',
    prompt: 'Enter the location keyword revealed after the rally is restored.',
    answers: ['KITCHEN'],
    hints: [
      'Treat every stroke card as a position in one continuous sequence.',
      'Serve must be first; Smash must be last. Keep each “immediately after” pair together.',
      'The correct order is Serve → Clear → Net → Drop → Lift → Drive → Smash. Read the backs.'
    ],
    restored: 'Record restored: the first contact began on a court, but the next file is stored where meals begin.'
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
    restored: 'Case 570 restored. A birthday record has been detected in primary storage.'
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

const DEFAULT_STATE = {
  authenticated: false,
  currentChapter: 'intro',
  completed: [],
  hintsUsed: {},
  soundOn: true
};

let state = loadState();
let adminOpen = new URLSearchParams(location.search).get('admin') === '570';
let feedback = '';
let restoredOverlay = null;

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return parsed ? { ...DEFAULT_STATE, ...parsed } : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState(next) {
  state = next;
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

function loginMarkup() {
  return `
    <main class="login-shell">
      <section class="login-card panel-glow">
        <div class="eyebrow">ORIGIN ARCHIVE // SECURE TERMINAL</div>
        <h1>PROJECT <span>570</span></h1>
        <div class="boot-copy">
          <p class="type-line" style="animation-delay:0ms">Archive integrity: 18%</p>
          <p class="type-line" style="animation-delay:160ms">Recovered subject record: T—N—</p>
          <p class="type-line" style="animation-delay:320ms">Authentication required.</p>
        </div>
        <form id="login-form" class="login-form">
          <label>Authorized subject<input id="subject-input" autocomplete="off" autofocus /></label>
          <label>Case identifier<input id="case-input" inputmode="numeric" autocomplete="off" /></label>
          <button type="submit">Authenticate</button>
        </form>
        <div class="status-message ${feedback ? 'error' : ''}">${feedback || 'Awaiting credentials…'}</div>
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

function introMarkup() {
  return `
    <section class="chapter-card panel-glow intro-card">
      <div class="chapter-number">00</div>
      <div class="eyebrow">ARCHIVE RECOVERY PROTOCOL</div>
      <h2>Four records are corrupted.</h2>
      <p class="lead">The archive has moved each memory into a physical reconstruction zone. Restore the records in order. The terminal will validate each recovery and release the next location.</p>
      <div class="protocol-grid">
        <div><span>01</span><strong>Observe</strong><p>Inspect physical evidence.</p></div>
        <div><span>02</span><strong>Deduce</strong><p>Find the unique solution.</p></div>
        <div><span>03</span><strong>Validate</strong><p>Return to this terminal.</p></div>
      </div>
      <button id="begin-button" class="primary">Begin recovery</button>
    </section>`;
}

function finalMarkup() {
  return `
    <section class="chapter-card final-card panel-glow">
      <div class="archive-seal">570</div>
      <div class="eyebrow">CASE RESTORED</div>
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

function adminMarkup() {
  if (!adminOpen) return '';
  const current = chapterById(state.currentChapter);
  const completedLabels = state.completed
    .map((id) => chapterById(id).label)
    .join(', ');
  const hintsUsed = Object.values(state.hintsUsed)
    .reduce((total, count) => total + count, 0);
  return `
    <div class="modal-backdrop">
      <section class="admin-panel">
        <div class="admin-header"><div><div class="eyebrow">OPERATOR OVERRIDE</div><h2>Admin Console</h2></div><button id="admin-close" class="ghost">Close</button></div>
        <div class="operator-checklist" aria-label="Current game status">
          <div><span>Current chapter</span><strong>${esc(current.label)}</strong></div>
          <div><span>Completed</span><strong>${state.completed.length} / ${CHAPTERS.length - 1}</strong><small>${esc(completedLabels || 'None')}</small></div>
          <div><span>Hints used</span><strong>${hintsUsed}</strong></div>
        </div>
        <div class="admin-grid">
          ${CHAPTERS.map((chapter) => `<button data-jump="${chapter.id}">Jump to ${chapter.id}</button>`).join('')}
          <button id="admin-reset">Reset progress</button>
          <button id="admin-sound">Sound: ${state.soundOn ? 'on' : 'off'}</button>
        </div>
        <p class="admin-note">Emergency shortcut: press Ctrl/Cmd + Shift + 9. Query parameter <code>?admin=570</code> also opens this console.</p>
      </section>
    </div>`;
}

function appMarkup() {
  const chapter = chapterById(state.currentChapter);
  const content = chapter.id === 'intro' ? introMarkup() : chapter.id === 'final' ? finalMarkup() : chapterMarkup(chapter);
  const fullscreenSupported = Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen);
  const fullscreenActive = Boolean(document.fullscreenElement);
  return `
    <div class="app-shell">
      <header class="topbar">
        <div><div class="eyebrow">PROJECT 570</div><strong>ORIGIN ARCHIVE</strong></div>
        <div class="topbar-meta"><span>SUBJECT: TINA</span><span>CASE: 570</span><button id="fullscreen-button" class="utility-button" ${fullscreenSupported ? '' : 'disabled title="Fullscreen is unavailable in this browser"'}>${fullscreenSupported ? (fullscreenActive ? 'EXIT FULLSCREEN' : 'FULLSCREEN') : 'FULLSCREEN N/A'}</button><button id="sound-button" class="utility-button">${state.soundOn ? 'SOUND ON' : 'SOUND OFF'}</button></div>
      </header>
      <div class="workspace">
        <aside class="progress-rail"><div class="progress-title">RESTORED RECORDS</div>${progressMarkup()}</aside>
        <main class="main-stage">${content}</main>
      </div>
      <footer>ARCHIVE BUILD 2026.07.27 // LOCAL SECURE SESSION</footer>
      ${adminMarkup()}
    </div>`;
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = state.authenticated ? appMarkup() : loginMarkup();
  bindEvents();
}

function bindEvents() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const subject = document.getElementById('subject-input').value.trim().toUpperCase();
      const caseId = document.getElementById('case-input').value.trim();
      if (subject === 'TINA' && caseId === '570') {
        feedback = '';
        playTone('open');
        saveState({ ...state, authenticated: true, currentChapter: 'intro' });
      } else {
        feedback = 'IDENTITY MISMATCH — ACCESS DENIED';
        playTone('error');
        render();
      }
    });
  }

  const beginButton = document.getElementById('begin-button');
  if (beginButton) beginButton.addEventListener('click', () => {
    playTone('open');
    feedback = '';
    saveState({ ...state, completed: ['intro'], currentChapter: 'court' });
  });

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
    saveState({ ...state, authenticated: true, currentChapter: button.dataset.jump });
  }));

  const reset = document.getElementById('admin-reset');
  if (reset) reset.addEventListener('click', () => {
    if (!window.confirm('Reset all game progress? This cannot be undone.')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = { ...DEFAULT_STATE, authenticated: true };
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

render();
