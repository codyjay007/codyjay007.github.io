# Decision Log

## 2026-07-22 — Rename to Project 727

Decision:
- Canonical project name changed from Project 570 to Project 727.

Reason:
- 727 maps to the birthday date.
- Using 570 as both identity and code felt artificial.

Impact:
- Update title, metadata, copy, repository docs, and branding.
- Remove 570 from login and primary progression.
- Preserve 570 only as an optional subtle motif.

## 2026-07-22 — Strengthen digital gameplay

Decision:
- Every major chapter must include interactive puzzle solving.
- The app is no longer primarily an answer-validation terminal.

Reason:
- The previous version felt like a sequence of input boxes.
- The intended experience is a real hybrid game.

Impact:
- Court becomes order plus spatial reconstruction.
- Table becomes circular arrangement.
- Room becomes route construction with inventory.
- Origin becomes timeline reconstruction.
- Text inputs remain only for final confirmation or recovery.

## 2026-07-22 — Guest bedroom is finale only

Decision:
- The guest bedroom contains the birthday vault and is inaccessible before the finale.

Reason:
- Protect the reveal.

Impact:
- Earlier puzzles use the living room, kitchen, primary bedroom, and primary closet.

## 2026-07-22 — Master handoff is the product source of truth

Decision:
- `PROJECT_727_MASTER_HANDOFF.md` supersedes earlier product documents when they conflict.

Reason:
- It consolidates the approved digital flow, physical assets, room route, finale safeguards, and implementation sequence.

Impact:
- Later chapters are implemented as dedicated workspaces.
- Runtime, print assets, operator materials, tests, and this log are maintained together.

## 2026-07-22 — Calibration requires the physical reference

Decision:
- Every pre-solve Calibration state uses abstract glyphs only.
- Partial states receive no individual correctness signal.
- The decoded identity appears only after the complete four-fragment pattern is correct.

Reason:
- Visible identity letters and per-fragment glow allowed the digital interface to bypass the physical card.

Impact:
- A printable Calibration card owns the four target glyphs.
- Existing progress migrates to state version 4 without losing solved chapters.

## 2026-07-22 — Freeze Court coordinate set v1

Decision:
- Court uses the seven coordinates stored in `shared/game-config.js`.
- Runtime trajectory and printed card backs must read that same source.

Reason:
- A single source prevents event-day mismatch between physical evidence and digital validation.
- The selected points keep all seven markers distinct and the completed trajectory readable.

Impact:
- Any later coordinate change requires a new print, test update, and physical rehearsal.

## 2026-07-22 — Table is an automatic circular reconstruction

Decision:
- Receipt is a fixed 12 o’clock anchor.
- Lemon, Glass, Starter, Main, and Dessert are placed by drag or click around six circular positions.
- The interface validates after every placement and reveals the destination only after the full arrangement is correct.

Reason:
- The chapter must depend on the physical Limon receipt and must not collapse into a keyword form.
- Local rule feedback supports recovery without revealing the full solution.

Impact:
- Table state and admin rescue are part of state version 5.
- The exact real drawer remains an event-setup choice represented by a printable triangle marker.

## 2026-07-22 — Room uses a deterministic graph engine

Decision:
- Maps A, B, and C share one graph configuration between the runtime and physical map generator.
- The runtime enforces direction, keys, door consumption, central-room visitation, and no revisits.
- Only Map B has one valid escape route.
- The restored destination is `BEDROOM`.

Reason:
- The Room must be the hardest chapter while remaining uniquely solvable and recoverable on event day.
- Physical maps retain the key, door, and arrow evidence; the browser validates the route rather than accepting a keyword.

Impact:
- Room routes and selected map persist in state version 6.
- Map A fails at a key-after-door condition; Map C fails because it requires revisiting C.
- The optional overlay is noncritical and may be omitted without changing solvability.
