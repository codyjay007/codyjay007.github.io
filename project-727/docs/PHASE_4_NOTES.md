# Phase 4 — The Room

## Summary

- Replaces the Room answer form with a three-map route engine.
- Enforces directed passages, two-way passages, key collection, matching-door consumption, no revisits, central-room visitation, and exit validation.
- Supports Map selection, one-step undo, current-map reset, persistent per-map routes, three hints, and admin rescue/inspection.
- The only valid route decodes `BEDROOM`; the chapter never reveals `CLOSET` as a destination.

## Changed areas

- Shared Map A/B/C graph configuration
- Room state version 6 and migration
- Graph simulation, unique-route validation, inventory, door log, and route interaction
- Responsive Room workspace and dedicated completion state
- Three printable physical maps and optional noncritical overlay
- Room uniqueness and migration tests

## Test targets

- Map A red-door failure
- Map B unique valid route
- Map C revisit failure
- One-way reverse movement
- Key collection and door consumption
- Undo/reset and per-map persistence
- Three hints and admin solve/reset/inspect
- 1366×768 and 1920×1080
- Completed-state refresh
- Map print legibility

## Known limitations

- Closet lighting and final printed line weight require a physical rehearsal.
- The optional overlay is atmospheric only and carries no unique answer information.

## Physical status

- Maps A, B, and C: ready for test print
- Optional overlay: ready for transparency test print
