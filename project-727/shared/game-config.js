'use strict';

(function exposeProject727Config(root) {
  const config = {
    boot: {
      decodedIdentity: 'TINA',
      fragments: [
        { id: 'fragment-1', glyphs: ['⌁', '⌬', '⌖', '◫'], correctOrientation: 2 },
        { id: 'fragment-2', glyphs: ['⌖', '◒', '◇', '⌁'], correctOrientation: 1 },
        { id: 'fragment-3', glyphs: ['△', '⌘', '◫', '⌬'], correctOrientation: 3 },
        { id: 'fragment-4', glyphs: ['○', '⌁', '◇', '⌘'], correctOrientation: 2 }
      ]
    },
    court: {
      shots: [
        { id: 'serve', label: 'Serve', coordinate: 'C3' },
        { id: 'clear', label: 'Clear', coordinate: 'A1' },
        { id: 'net', label: 'Net', coordinate: 'B2' },
        { id: 'drop', label: 'Drop', coordinate: 'D2' },
        { id: 'lift', label: 'Lift', coordinate: 'A4' },
        { id: 'drive', label: 'Drive', coordinate: 'C2' },
        { id: 'smash', label: 'Smash', coordinate: 'D1' }
      ],
      reveal: 'KITCHEN',
      zones: [
        { id: 'A1', x: 70, y: 55 }, { id: 'B1', x: 170, y: 55 }, { id: 'C1', x: 270, y: 55 }, { id: 'D1', x: 370, y: 55 },
        { id: 'A2', x: 70, y: 145 }, { id: 'B2', x: 170, y: 145 }, { id: 'C2', x: 270, y: 145 }, { id: 'D2', x: 370, y: 145 },
        { id: 'A3', x: 70, y: 235 }, { id: 'B3', x: 170, y: 235 }, { id: 'C3', x: 270, y: 235 }, { id: 'D3', x: 370, y: 235 },
        { id: 'A4', x: 70, y: 325 }, { id: 'B4', x: 170, y: 325 }, { id: 'C4', x: 270, y: 325 }, { id: 'D4', x: 370, y: 325 }
      ]
    },
    table: {
      objects: [
        { id: 'receipt', label: 'Receipt', symbol: '▤', reveal: 'D' },
        { id: 'lemon', label: 'Lemon', symbol: '●', reveal: 'R' },
        { id: 'glass', label: 'Glass', symbol: '◇', reveal: 'A' },
        { id: 'starter', label: 'Starter', symbol: '◐', reveal: 'W' },
        { id: 'main', label: 'Main', symbol: '▰', reveal: 'E' },
        { id: 'dessert', label: 'Dessert', symbol: '△', reveal: 'R' }
      ],
      clockwiseOrder: ['receipt', 'lemon', 'glass', 'starter', 'main', 'dessert'],
      reveal: 'DRAWER'
    },
    room: {
      maps: {
        A: {
          label: 'Map A',
          nodes: [
            { id: 'S', x: 8, y: 50 },
            { id: 'C', x: 28, y: 50 },
            { id: 'D', x: 50, y: 50 },
            { id: 'R', x: 72, y: 50, item: 'red' },
            { id: 'X', x: 92, y: 50 }
          ],
          edges: [
            { from: 'S', to: 'C' },
            { from: 'C', to: 'D', door: 'red' },
            { from: 'D', to: 'R' },
            { from: 'R', to: 'X' }
          ]
        },
        B: {
          label: 'Map B',
          nodes: [
            { id: 'S', x: 8, y: 70, reveal: 'B' },
            { id: 'R', x: 23, y: 30, item: 'red', reveal: 'E' },
            { id: 'C', x: 38, y: 62, reveal: 'D' },
            { id: 'D', x: 54, y: 28, reveal: 'R' },
            { id: 'B', x: 69, y: 62, item: 'blue', reveal: 'O' },
            { id: 'E', x: 84, y: 30, reveal: 'O' },
            { id: 'X', x: 94, y: 70, reveal: 'M' }
          ],
          edges: [
            { from: 'S', to: 'R' },
            { from: 'R', to: 'C', twoWay: true },
            { from: 'C', to: 'D', door: 'red' },
            { from: 'D', to: 'B', twoWay: true },
            { from: 'B', to: 'E', door: 'blue' },
            { from: 'E', to: 'X' }
          ]
        },
        C: {
          label: 'Map C',
          nodes: [
            { id: 'S', x: 8, y: 70 },
            { id: 'R', x: 23, y: 30, item: 'red' },
            { id: 'C', x: 42, y: 60 },
            { id: 'D', x: 56, y: 25 },
            { id: 'B', x: 72, y: 60, item: 'blue' },
            { id: 'E', x: 84, y: 30 },
            { id: 'X', x: 94, y: 70 }
          ],
          edges: [
            { from: 'S', to: 'R' },
            { from: 'R', to: 'C', twoWay: true },
            { from: 'C', to: 'D', door: 'red' },
            { from: 'D', to: 'B' },
            { from: 'B', to: 'C' },
            { from: 'C', to: 'E', door: 'blue' },
            { from: 'E', to: 'X' }
          ]
        }
      },
      intendedMap: 'B',
      intendedRoute: ['S', 'R', 'C', 'D', 'B', 'E', 'X'],
      reveal: 'BEDROOM'
    },
    origin: {
      records: [
        { id: 'contact', label: 'First Contact', archive: 'Court', fragment: '0' },
        { id: 'date', label: 'First Date', archive: 'Table', fragment: '1' },
        { id: 'escape', label: 'First Escape', archive: 'Room', fragment: '2' },
        { id: 'status', label: 'Status Change', archive: 'Status Change', fragment: '8' }
      ],
      tokens: [
        { id: 'shuttlecock', label: 'Shuttlecock', symbol: '◒', target: 'court' },
        { id: 'lemon', label: 'Lemon', symbol: '●', target: 'table' },
        { id: 'keyhole', label: 'Keyhole', symbol: '⌑', target: 'room' },
        { id: 'linked-circles', label: 'Linked Circles', symbol: '∞', target: 'status-change' }
      ],
      targets: [
        { id: 'court', label: 'Court' },
        { id: 'table', label: 'Table' },
        { id: 'room', label: 'Room' },
        { id: 'status-change', label: 'Status Change' }
      ],
      recordOrder: ['contact', 'date', 'escape', 'status'],
      canonicalDate: '2025/01/28'
    }
  };

  root.PROJECT727_CONFIG = config;
  if (typeof module !== 'undefined' && module.exports) module.exports = config;
})(globalThis);
