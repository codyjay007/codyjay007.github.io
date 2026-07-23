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
    }
  };

  root.PROJECT727_CONFIG = config;
  if (typeof module !== 'undefined' && module.exports) module.exports = config;
})(globalThis);
