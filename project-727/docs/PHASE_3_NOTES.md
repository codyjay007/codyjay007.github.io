# Phase 3 — The Table

## Summary

- Replaces the generic Table answer form with a six-position circular workspace.
- Receipt is fixed at 12 o’clock; five objects support drag and click-to-place.
- Validation is automatic and reports the first applicable adjacency, opposition, or direction contradiction.
- Completion scans the reconstructed receipt and reveals the drawer destination and triangle placement mark.
- Table progress, selected object, hints, solved state, and admin rescue persist in state version 5.

## Changed areas

- Shared Table object configuration
- Table state, migration, validation, interaction, completion, and admin controls
- Responsive dark-green Table workspace
- Faux Limon receipt and triangle marker print pages
- Table logic and migration tests

## Test targets

- Every local contradiction rule
- Correct clockwise arrangement
- Drag and click placement
- Three hints
- Refresh persistence and completed-state refresh
- Admin solve/reset/inspect
- 1366×768 and 1920×1080
- Receipt and marker print preview

## Known limitations

- The exact real kitchen drawer is intentionally not encoded. The operator selects one drawer and places a printed triangle marker during setup.
- The Limon receipt uses an elegant archive placeholder rather than a venue logo or personal photograph.

## Physical status

- Faux Limon receipt: ready for test print
- Triangle marker sheet: ready for test print and drawer selection
