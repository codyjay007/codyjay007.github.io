'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const noop = () => {};
const context = {
  location: { search: '' },
  localStorage: {
    getItem: () => null,
    setItem: () => { throw new Error('storage unavailable'); },
    removeItem: noop
  },
  document: {
    fullscreenEnabled: undefined,
    fullscreenElement: null,
    documentElement: { requestFullscreen: noop },
    getElementById: () => ({ innerHTML: '', addEventListener: noop }),
    querySelectorAll: () => [],
    addEventListener: noop,
    elementFromPoint: () => null
  },
  window: { addEventListener: noop, confirm: () => true },
  setTimeout: noop,
  URLSearchParams
};

vm.createContext(context);
for (const file of ['shared/game-config.js', 'app.js']) {
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, '..', ...file.split('/')), 'utf8'),
    context,
    { filename: file }
  );
}

const run = (source) => vm.runInContext(source, context);

assert.doesNotThrow(
  () => run('saveState(createDefaultState())'),
  'A storage write failure must not stop the in-memory event session.'
);
assert.equal(
  run(`localStorage.getItem = (key) => key === PREVIOUS_STORAGE_KEYS[0] ? JSON.stringify({ authenticated: true, currentChapter: 'court', completed: ['court'] }) : null; loadState().currentChapter`),
  'court',
  'A readable legacy state must survive failure to write its migrated copy.'
);
run('localStorage.getItem = () => null');
assert.doesNotThrow(
  () => run(`window.AudioContext = function AudioContext() { throw new Error('audio unavailable'); }; state.soundOn = true; playTone('ok')`),
  'An audio device or browser-policy failure must not block progression.'
);
assert.match(
  run('fullscreenButtonMarkup()'),
  />FULLSCREEN</,
  'Fullscreen should remain available when the API exists and fullscreenEnabled is undefined.'
);
assert.equal(run('CHAPTERS.filter((chapter) => ["court", "table", "room", "origin"].includes(chapter.id)).every((chapter) => chapter.hints.length === 3)'), true);
assert.equal(run('roomSolutionRoutes("B").length'), 1);
assert.equal(run('originReconstructionReady(createOriginState({ recordOrder: [...ORIGIN_RECORD_ORDER], tokenLinks: Object.fromEntries(ORIGIN_TOKENS.map((token) => [token.id, token.target])) }))'), true);

console.log('Project 727 event-hardening tests: PASS');
