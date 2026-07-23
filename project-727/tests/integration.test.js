'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const requiredFiles = [
  'print/calibration/calibration-card.html',
  'print/court/shot-cards-front.html',
  'print/court/shot-cards-back.html',
  'print/court/rally-rules.html',
  'print/table/limon-receipt.html',
  'print/table/drawer-marker.html',
  'print/room/maps.html',
  'print/room/optional-overlay.svg',
  'print/origin/record-cards.html',
  'print/origin/timeline-board.html',
  'print/origin/evidence-tokens.html',
  'print/finale/birthday-record.html',
  'print/finale/archive-update-card.html',
  'print/PRINT_GUIDE.md',
  'operator/answer-sheet.html',
  'operator/placement-map.html',
  'operator/rescue-sheet.html'
];

for (const file of requiredFiles) {
  assert.equal(fs.existsSync(path.join(root, file)), true, `${file} should exist.`);
}

const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
assert.doesNotMatch(app, /id="answer-form"/, 'No generic answer form should remain.');
assert.doesNotMatch(app, /answers:\s*\['(?:DRAWER|CLOSET)/, 'Table and Room must not retain keyword answers.');
assert.doesNotMatch(app, /NEXT EVIDENCE SOURCE:\s*<strong>CLOSET/, 'Room must not reveal CLOSET.');
assert.doesNotMatch(app, /0128/, 'Runtime source must not contain the direct final lock value.');

const playerFiles = [
  'index.html',
  'styles.css',
  'app.js',
  'shared/game-config.js',
  ...requiredFiles.filter((file) => file.startsWith('print/'))
];
for (const file of playerFiles) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  assert.doesNotMatch(content, /\b(?:src|href)\s*=\s*["']https?:/i, `${file} must not require a remote asset.`);
  assert.doesNotMatch(content, /0128/, `${file} must not contain the direct final lock value.`);
}

console.log('Project 727 integration tests: PASS');
