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
  run(`tableFeedback(createTableState({ arrangement: [...TABLE_SOLUTION_ORDER] })).type`),
  'restored',
  'The canonical clockwise arrangement should restore the Table.'
);

const contradictionCases = [
  [['receipt', null, null, null, 'dessert', null], 'Dessert must sit immediately counterclockwise from Receipt.'],
  [['receipt', 'lemon', null, null, null, 'main'], 'Main and Lemon must remain opposite.'],
  [['receipt', 'lemon', null, 'glass', null, null], 'Glass must sit immediately clockwise from Lemon.'],
  [['receipt', null, 'glass', null, 'starter', null], 'Starter must remain adjacent to Glass.'],
  [['receipt', 'starter', null, null, 'main', null], 'Starter must remain adjacent to Main.']
];

for (const [arrangement, message] of contradictionCases) {
  assert.equal(
    run(`tableFeedback(createTableState({ arrangement: ${JSON.stringify(arrangement)} })).message`),
    message
  );
}

assert.deepEqual(
  [...run(`sanitizeTableArrangement(['dessert', 'lemon', 'lemon', 'starter', 'bogus', 'main'])`)],
  ['receipt', 'lemon', null, 'starter', null, 'main'],
  'Migration should keep one valid copy of each movable object and restore the fixed Receipt.'
);

const v4State = {
  stateVersion: 4,
  authenticated: true,
  currentChapter: 'table',
  completed: ['boot', 'court'],
  chapterState: {
    boot: { solved: true, fragmentOrientations: [2, 1, 3, 2] },
    court: { solved: true }
  }
};
const migrated = run(`migrateState(${JSON.stringify(v4State)})`);
assert.equal(migrated.stateVersion, 6);
assert.equal(migrated.currentChapter, 'table');
assert.deepEqual([...migrated.chapterState.table.arrangement], ['receipt', null, null, null, null, null]);

console.log('Phase 3 Table tests: PASS');
