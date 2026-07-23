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
