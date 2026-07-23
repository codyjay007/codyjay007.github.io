# Phase 2.1 — Calibration and Court Hardening

## Summary

- Calibration uses abstract glyphs only until the complete pattern is correct.
- Partial Calibration states receive no individual correctness styling.
- Court coordinates are frozen in a shared local configuration used by runtime and print assets.
- Court has a dedicated completion state instead of an overlay covering the active workspace.
- Court is constrained to the available laptop viewport at 1366×768, with internal panel scrolling.
- Reset confirmation appears only when Court progress or hints exist.

## Changed areas

- Runtime shell and state migration
- Shared puzzle configuration
- Calibration and Court presentation
- Calibration card, Court cards, and rally rules
- Phase 2 validation tests

## Test targets

- Fresh Calibration, incorrect partial states, full decode, refresh, and admin recovery
- Court ordering, landing contradictions, all hints, refresh, solve/reset, and completion refresh
- 1366×768 and 1920×1080
- Direct offline loading of all print pages
- Runtime/print coordinate parity

## Known limitations

- The frozen Court coordinate set still needs one physical rehearsal after printing to confirm duplex registration and marker legibility under event lighting.
- Personal photographs are intentionally not used in this phase.

## Physical status

- Calibration card: ready for test print
- Seven Court card fronts/backs: ready for duplex test print
- Rally rules: ready for test print
