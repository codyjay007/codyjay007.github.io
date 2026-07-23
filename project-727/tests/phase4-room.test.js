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

assert.equal(run(`roomSolutionRoutes('A').length`), 0, 'Map A must have no valid escape route.');
assert.equal(run(`roomSolutionRoutes('B').length`), 1, 'Map B must have exactly one valid escape route.');
assert.equal(run(`roomSolutionRoutes('C').length`), 0, 'Map C must have no valid escape route.');
assert.deepEqual(
  [...run(`roomSolutionRoutes('B')[0]`)],
  ['S', 'R', 'C', 'D', 'B', 'E', 'X'],
  'Map B should resolve to the intended unique route.'
);

assert.match(
  run(`roomMoveStatus('A', ['S', 'C'], 'D').message`),
  /RED DOOR/,
  'Map A should fail because the red key is beyond the red door.'
);
assert.deepEqual(
  [...run(`simulateRoomRoute('B', ['S', 'R']).inventory`)],
  ['red'],
  'Entering R should collect the red key.'
);
assert.deepEqual(
  [...run(`simulateRoomRoute('B', ['S', 'R', 'C', 'D', 'B']).inventory`)],
  ['blue'],
  'The red key should be consumed at its door before the blue key is collected.'
);
assert.deepEqual(
  [...run(`simulateRoomRoute('B', ['S', 'R', 'C', 'D', 'B', 'E']).inventory`)],
  [],
  'The blue key should be consumed at its matching door.'
);
assert.equal(
  run(`roomMoveStatus('C', ['S', 'R', 'C', 'D', 'B'], 'C').message`),
  'Rooms cannot be revisited.',
  'Map C should expose its required central-room revisit.'
);

const v5State = {
  stateVersion: 5,
  authenticated: true,
  currentChapter: 'room',
  completed: ['boot', 'court', 'table'],
  chapterState: {
    boot: { solved: true },
    court: { solved: true },
    table: { solved: true }
  }
};
const migrated = run(`migrateState(${JSON.stringify(v5State)})`);
assert.equal(migrated.stateVersion, 6);
assert.equal(migrated.currentChapter, 'room');
assert.deepEqual([...migrated.chapterState.room.routes.A], ['S']);

console.log('Phase 4 Room tests: PASS');
