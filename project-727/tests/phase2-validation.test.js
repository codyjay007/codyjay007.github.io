'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const noop = () => {};
const context = {
  location: { search: '' },
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  document: {
    fullscreenEnabled: false,
    documentElement: {},
    getElementById: () => ({ innerHTML: '', addEventListener: noop }),
    querySelectorAll: () => [],
    addEventListener: noop,
    elementFromPoint: () => null
  },
  window: { addEventListener: noop },
  setTimeout: noop,
  URLSearchParams
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'shared', 'game-config.js'), 'utf8'),
  context,
  { filename: 'shared/game-config.js' }
);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8'),
  context,
  { filename: 'app.js' }
);

const run = (source) => vm.runInContext(source, context);

assert.equal(
  run('bootIsSolved(BOOT_FRAGMENT_CONFIG.map((fragment) => fragment.correctOrientation))'),
  true,
  'Configured Boot orientations should be the unique intended solved state.'
);
assert.equal(
  run('bootIsSolved([0, 0, 0, 0])'),
  false,
  'The default Boot state must remain incomplete.'
);
assert.equal(
  run(`BOOT_FRAGMENT_CONFIG.flatMap((fragment) => fragment.glyphs).some((glyph) => ['T', 'I', 'N', 'A'].includes(glyph))`),
  false,
  'No decoded identity letter may appear in a pre-solve fragment state.'
);
assert.equal(
  run('COURT_SHOTS.every((shot) => COURT_LANDING_CONFIG[shot.id] === shot.coordinate)'),
  true,
  'Runtime Court coordinates must come from the shared print configuration.'
);

const legacyState = {
  authenticated: true,
  currentChapter: 'intro',
  completed: ['intro', 'court'],
  hintsUsed: { court: 2 },
  soundOn: false
};
const migrated = run(`migrateState(${JSON.stringify(legacyState)})`);
assert.equal(migrated.stateVersion, 5);
assert.equal(migrated.currentChapter, 'court');
assert.equal(migrated.authenticated, true);
assert.equal(migrated.chapterState.boot.solved, true);
assert.equal(migrated.chapterState.court.solved, true);
assert.deepEqual([...migrated.completed], ['boot', 'court']);
assert.equal(migrated.soundOn, false);

const sequenceCases = [
  [['clear', null, null, null, null, null, null], 'Serve must open the sequence.'],
  [[null, null, null, null, 'smash', null, null], 'Smash must close the sequence.'],
  [[null, null, 'drop', null, 'lift', null, null], 'One recovered adjacency is broken.'],
  [[null, 'clear', null, 'net', null, null, null], 'One recovered adjacency is broken.'],
  [[null, 'clear', 'drop', null, null, null, null], 'Recovered timing evidence is contradicted.'],
  [[null, null, null, 'drive', 'lift', null, null], 'Drive must occur after Lift.']
];

for (const [order, expectedMessage] of sequenceCases) {
  assert.equal(
    run(`courtSequenceStatus(${JSON.stringify(order)}).message`),
    expectedMessage
  );
}

assert.equal(
  run(`courtFeedback({
    shotOrder: [...COURT_SOLUTION_ORDER],
    landingAssignments: { ...COURT_LANDING_CONFIG, net: 'A2' },
    selectedShot: null,
    solved: false
  }).type`),
  'contradiction',
  'A complete sequence with one conflicting landing must not solve.'
);

assert.equal(
  run(`courtFeedback({
    shotOrder: [...COURT_SOLUTION_ORDER],
    landingAssignments: { ...COURT_LANDING_CONFIG },
    selectedShot: null,
    solved: false
  }).type`),
  'restored',
  'The intended order and landing evidence should restore the Court.'
);

console.log('Phase 2 validation tests: PASS');
