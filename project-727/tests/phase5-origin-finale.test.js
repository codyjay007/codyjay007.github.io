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

assert.equal(
  run(`originOrderIsCorrect([...ORIGIN_RECORD_ORDER])`),
  true,
  'The canonical chronology should validate.'
);
assert.equal(
  run(`originOrderIsCorrect(['contact', 'escape', 'date', 'status'])`),
  false,
  'An out-of-order timeline must fail.'
);

const correctLinks = {
  shuttlecock: 'court',
  lemon: 'table',
  keyhole: 'room',
  'linked-circles': 'status-change'
};
assert.equal(
  run(`originLinksAreCorrect(${JSON.stringify(correctLinks)})`),
  true,
  'All four canonical evidence links should validate.'
);
assert.equal(
  run(`originFeedback(createOriginState({
    recordOrder: [...ORIGIN_RECORD_ORDER],
    tokenLinks: { ...${JSON.stringify(correctLinks)}, lemon: 'room' }
  })).type`),
  'contradiction',
  'A wrong evidence link should produce structured contradiction feedback.'
);
assert.equal(
  run(`originReconstructionReady(createOriginState({
    recordOrder: [...ORIGIN_RECORD_ORDER],
    tokenLinks: ${JSON.stringify(correctLinks)}
  }))`),
  true,
  'Date verification should unlock only after both digital layers are correct.'
);

assert.deepEqual(
  [...run(`sanitizeOriginRecordOrder(['contact', 'contact', 'escape', 'bogus'])`)],
  ['contact', null, 'escape', null]
);
assert.deepEqual(
  { ...run(`sanitizeOriginTokenLinks({ shuttlecock: 'court', lemon: 'court', keyhole: 'room', bogus: 'table' })`) },
  { shuttlecock: 'court', keyhole: 'room' }
);

const v6State = {
  stateVersion: 6,
  authenticated: true,
  currentChapter: 'origin',
  completed: ['boot', 'court', 'table', 'room'],
  chapterState: {
    boot: { solved: true },
    court: { solved: true },
    table: { solved: true },
    room: { solved: true }
  }
};
const migrated = run(`migrateState(${JSON.stringify(v6State)})`);
assert.equal(migrated.stateVersion, 7);
assert.equal(migrated.currentChapter, 'origin');
assert.equal(migrated.chapterState.origin.solved, false);

const finalMarkup = run('finalMarkup()');
assert.match(finalMarkup, /FINAL ARCHIVE<\/span><strong>GUEST BEDROOM/);
assert.match(finalMarkup, /ACCESS FORMAT<\/span><strong>MMDD/);
assert.doesNotMatch(finalMarkup, /0128/);

console.log('Phase 5 Origin and Finale tests: PASS');
