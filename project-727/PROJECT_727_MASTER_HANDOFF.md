# PROJECT 727 — CODEX MASTER HANDOFF

## 0. How to use this file

Treat this file as the current product source of truth for both:
- the digital game, and
- the printable physical puzzle assets.

Priority when sources conflict:

1. This file
2. `docs/DECISION_LOG.md`
3. Existing Project 727 docs
4. Current implementation
5. Assumptions

Codex should maintain:
- runtime code,
- printable assets under `print/`,
- operator sheets under `operator/`,
- decision log,
- test notes.

Do not wait for more design direction unless a missing real-world fact, photo, or measurement blocks correctness.

---

# 1. Personal and product context

Project name:
- **Project 727**

Player:
- Tina

Birthday:
- July 27

Important relationship date:
- 2025/01/28

Memory anchors:
1. First meeting at CAN-AM Elite Badminton & Sports while playing badminton
2. First date meal at Limon
3. Omescape escape room after the first-date meal
4. Relationship officially began on 2025/01/28

Final birthday plan:
- Gift: Bvlgari Serpenti ring
- Dinner: Sushi Shin Omakase
- Cake: strawberry cake

Personal motif:
- Tina likes the number 570
- 570 may appear once as a subtle optional easter egg such as `SIGNAL 570`
- 570 must not be the project title, login, chapter answer, or final code

Final physical lock:
- derived from 2025/01/28 in MMDD format
- never display the four digits directly in player UI

Emotional goal:
- intelligent
- personal
- elegant
- warm
- unmistakably a birthday experience

This is not:
- a proposal
- a relationship trivia quiz
- a generic scavenger hunt
- a sequence of answer forms
- a fully digital game

Avoid proposal framing:
- no “one final question”
- no “forever” or “rest of our lives” before the ring
- no isolated ring box as the entire final scene
- no proposal-style crescendo or wording

The final box should contain:
- a visible `Happy Birthday, Tina` card
- restored archive records
- a recent photo
- Bvlgari original box
- ivory/champagne paper styling

---

# 2. Canonical room route

1. Living room laptop — Calibration
2. Living room — Court
3. Kitchen — Table
4. Primary bedroom walk-in closet — Room
5. Primary bedroom — Origin
6. Living room laptop — final date verification
7. Guest bedroom — Birthday Vault

The guest bedroom is finale-only and must not be referenced before the final digital screen.

Target play time:
- 75–90 minutes

Gift reveal and photos:
- 20–30 minutes

Start:
- approximately 2 hours 15 minutes before leaving for dinner

Target balance:
- about 50% meaningful digital interaction
- about 50% physical evidence, movement, and tactile props

---

# 3. Hybrid gameplay rule

Every major chapter follows:

1. Digital system presents an incomplete reconstruction.
2. Physical material contains necessary evidence not fully available on screen.
3. Player manipulates a digital workspace.
4. System gives partial and rule-specific feedback.
5. Correct solve creates an animation or visual reveal.
6. Reveal points to the next physical location.

A plain text answer input is allowed only for:
- final full-date confirmation,
- admin/recovery fallback,
- a very small transition.

Court, Table, and Room must never be generic input forms.

App requirements:
- offline
- local assets only
- preserve progress
- fullscreen
- sound control
- admin rescue
- no mandatory backend, analytics, account, remote API, camera, QR, geolocation, Bluetooth, or cloud dependency

Engineering priority:
1. Event-day reliability
2. Unique solvability
3. Physical/digital dependency
4. Clear feedback
5. 1366×768 legibility
6. Emotional tone
7. Visual polish
8. Technical novelty

---

# 4. Current Phase 2 review

Current direction is approved.

Strong points:
- visual language is elegant and consistent
- Boot is interactive instead of a text login
- Court is now a real digital workspace
- Court combines ordering and landing reconstruction
- local contradiction feedback is useful
- completion reveals KITCHEN without a text answer
- state persistence and migration are structured
- admin rescue exists
- architecture remains lightweight and offline-friendly

## Must-fix before implementing Table

### 4.1 Boot currently does not truly require the physical card

Current problem:
- fragment states visibly include T, I, N, and A
- an individually correct fragment receives visible success styling
- the player can rotate each fragment until it shows a letter or glows

Required redesign:
- all pre-solve fragment states are abstract glyphs
- no T/I/N/A appears before full solve
- no per-fragment correctness glow
- physical calibration card lists the four target abstract glyphs
- only the complete four-fragment pattern triggers the decode animation to TINA
- optional pair-connector feedback is acceptable, but not individual correctness feedback

### 4.2 Court coordinates are still provisional

Before final print:
- choose final seven coordinates
- inspect the completed trajectory
- ensure markers and letters remain readable
- freeze the config

Runtime and printed card backs must share one data source.

### 4.3 Court needs 1366×768 layout hardening

Observed:
- whole-page scrolling can occur
- expanded hints increase vertical pressure
- completed-state banner covers lower content
- coordinate labels are too dim

Required:
- no whole-page scroll during normal Court play at 1366×768
- hints/evidence may scroll internally or collapse
- completion should use a dedicated state or hide/compress lower content
- improve coordinate-label contrast
- keep click-to-place fallback
- confirm before resetting if progress exists

### 4.4 Later chapters are still generic forms

Table, Room, and Origin require dedicated workspaces and structured state.

### 4.5 Room destination is currently conceptually wrong

Room is played inside the primary bedroom closet.

Its reveal must be:
- `BEDROOM`
- or `NEXT EVIDENCE SOURCE: PRIMARY BEDROOM`

Do not use CLOSET as the next-location output.

---

# 5. Final game bible

## Chapter 0 — Calibration

Difficulty:
- easy
- 1–3 minutes

Story:
- the archive contains an incomplete identity pattern

Physical:
- one calibration card
- four target abstract glyphs labeled F1–F4
- no TINA printed as the answer

Digital:
- four clickable/rotatable fragments
- each cycles through four abstract glyphs
- no individual correct glow
- only full pattern success
- successful pattern decodes into TINA
- archive opens automatically

No numeric login.

Admin:
- solve/reset Calibration
- manual TINA recovery allowed only in admin mode

---

## Chapter 1 — The Court

Difficulty:
- medium
- 12–18 minutes

Theme:
- first meeting at CAN-AM

Physical packet:
- 7 shot cards:
  - Serve
  - Clear
  - Net
  - Drop
  - Lift
  - Drive
  - Smash
- 1 rally rules card
- card backs contain landing coordinates

Logic:
1. Serve is first.
2. Smash is last.
3. Drop is immediately followed by Lift.
4. Net is immediately after Clear.
5. Clear is before Drop, but not adjacent to Drop.
6. Drive is after Lift.

Unique order:
- Serve → Clear → Net → Drop → Lift → Drive → Smash

Digital:
- drag or click-to-place seven shots
- select a placed shot
- assign its physical-card coordinate on the SVG court
- preserve partial state
- show local contradictions
- do not identify which landing coordinate is wrong
- correct order and all correct coordinates animate trajectory

Reveal:
- seven trajectory points decode `KITCHEN`

Next:
- Kitchen

Hints:
1. Fix opening and closing strokes.
2. Treat Clear→Net and Drop→Lift as fixed blocks.
3. Reveal full sequence only; never reveal landing coordinates.

Physical print:
- poker-sized cards around 2.5 × 3.5 inches
- fronts: shot names
- backs: shared-config coordinates
- separate rule card
- no KITCHEN letters printed on cards

---

## Chapter 2 — The Table

Difficulty:
- medium
- 10–15 minutes

Theme:
- first date at Limon

Physical packet:
- faux Limon receipt containing the five logic clues
- optional Limon photo/scene card
- one triangle drawer marker `△`

Digital objects:
- Receipt
- Lemon
- Glass
- Starter
- Main
- Dessert

Logic:
1. Receipt is fixed at 12 o'clock.
2. Dessert is immediately counterclockwise from Receipt.
3. Main and Lemon are opposite.
4. Glass is immediately clockwise from Lemon.
5. Starter is adjacent to both Glass and Main.

Unique clockwise order:
- Receipt → Lemon → Glass → Starter → Main → Dessert

Digital:
- circular table with six snap positions
- drag or click-to-place
- auto-validation
- local feedback for adjacency/opposition contradictions
- no submit button
- correct state triggers a receipt scan animation

Reveal letters:
- Receipt = D
- Lemon = R
- Glass = A
- Starter = W
- Main = E
- Dessert = R

Result:
- `DRAWER`

Final copy:
- `NEXT EVIDENCE SOURCE: DRAWER // MARK △`

The user places the physical triangle sticker on the chosen real kitchen drawer.

That drawer contains the Room packet.

Admin:
- solve/reset Table
- inspect arrangement

---

## Chapter 3 — The Room

Difficulty:
- hardest
- 18–25 minutes

Theme:
- first shared Omescape experience

Location:
- primary bedroom walk-in closet

Physical packet:
- printed Maps A, B, C
- physical maps show keys, doors, and one-way arrows
- optional transparent overlay for atmosphere or confirmation
- UV may contain a hint, but no unique critical information may exist only in UV

Digital:
- choose Map A, B, or C
- click connected rooms to build route
- show inventory
- consume keys at matching doors
- enforce one-way passages
- no repeated room
- central room C must be visited
- one-step undo
- reset current map
- rule-specific invalid feedback
- no text answer input

### Map A — invalid because key is after door

Nodes:
- S, C, D, R, X

Edges:
- S → C
- C → D through RED DOOR
- D → R
- R → X

Item:
- RED KEY in R

Invalid reason:
- red key is only reachable after crossing red door

### Map B — valid

Intended route:
- S → R → C → D → B → E → X

Edges:
- S → R one-way
- R ↔ C
- C → D through RED DOOR
- D ↔ B
- B → E through BLUE DOOR
- E → X

Items:
- RED KEY in R
- BLUE KEY in B

Valid reasoning:
- collect red key
- visit C
- cross red door
- collect blue key
- cross blue door
- reach exit
- no revisit

### Map C — invalid because C must be revisited

Nodes:
- S, R, C, D, B, E, X

Edges:
- S → R
- R ↔ C
- C → D through RED DOOR
- D → B
- B → C one-way
- C → E through BLUE DOOR
- E → X

Items:
- RED KEY in R
- BLUE KEY in B

Invalid reason:
- exit requires revisiting C

Reveal letters on valid route:
- S = B
- R = E
- C = D
- D = R
- B = O
- E = O
- X = M

Result:
- `BEDROOM`

Next:
- Primary bedroom

Hints:
1. Eliminate maps with a key after its matching door.
2. Track whether central room C must be revisited.
3. Reveal Map B and first route nodes S → R → C.

Admin:
- solve/reset Room
- inspect selected map, route, and inventory

---

## Chapter 4 — The Origin

Difficulty:
- medium-low
- 10–15 minutes

Theme:
- relationship officially began on 2025/01/28

Location:
- primary bedroom

Physical packet:
- four record cards:
  1. First Contact
  2. First Date
  3. First Escape
  4. Status Change
- optional photos
- printed timeline board/sleeve
- four evidence tokens:
  - shuttlecock
  - lemon
  - keyhole
  - linked circles

Digit fragments on correctly ordered cards:
- First Contact = 0
- First Date = 1
- First Escape = 2
- Status Change = 8

Digital layer 1:
- drag four records into chronological order

Digital layer 2:
- link evidence tokens:
  - shuttlecock → Court
  - lemon → Table
  - keyhole → Room
  - linked circles → Status Change

After both layers are correct:
- digital windows illuminate
- player is instructed to read the physical timeline
- physical result is 0128

Final digital confirmation:
- enter full date in YYYY/MM/DD
- canonical answer: 2025/01/28

Final reveal:
- `ARCHIVE RESTORED`
- `ACTIVATION DATE VERIFIED`
- `BIRTHDAY RECORD READY`
- `FINAL ARCHIVE: GUEST BEDROOM`
- `ACCESS FORMAT: MMDD`

Never display the actual four-digit lock code.

Admin:
- solve/reset Origin
- bypass date confirmation only in admin mode

---

## Finale — Birthday Vault

Location:
- Guest bedroom
- closed until final reveal

Physical:
- player derives lock code from activation date and MMDD format

Final box:
1. Happy Birthday card
2. Record 05 — Today
3. recent photo
4. restored record cards
5. Bvlgari original box
6. ivory/champagne paper

Scene:
- warm-white lights
- optional flameless candles
- no heart shape
- no rose-petal proposal setup

Final digital copy:
- `ARCHIVE RESTORED`
- `BIRTHDAY RECORD READY`
- `FINAL ARCHIVE: GUEST BEDROOM`
- `ACCESS FORMAT: MMDD`
- `HAPPY BIRTHDAY, TINA.`

Cake epilogue after dinner:
- strawberry cake
- no hard puzzle
- small card:
  - `RECORD 05 CREATED`
  - `This memory does not need to be solved. It only needs to be kept.`

---

# 6. Printable asset ownership

Codex owns physical assets in the repository.

Required structure:

```text
print/
  calibration/
    calibration-card.html
  court/
    shot-cards-front.html
    shot-cards-back.html
    rally-rules.html
  table/
    limon-receipt.html
    drawer-marker.html
  room/
    maps.html
    optional-overlay.svg
  origin/
    record-cards.html
    timeline-board.html
    evidence-tokens.html
  finale/
    birthday-record.html
    archive-update-card.html
  PRINT_GUIDE.md

operator/
  answer-sheet.html
  placement-map.html
  rescue-sheet.html
```

Print rules:
- US Letter
- 100% scale
- 0.25-inch safe margin
- cut lines
- local fonts only
- front/back registration marks
- player-facing pages contain no operator spoilers
- provide low-ink mode if practical
- runtime and print assets share configuration where possible

Photos:
- support local user images
- support elegant placeholders
- no answer may depend on recognizing a photo

---

# 7. Implementation roadmap

## Phase 2.1 — Harden Calibration and Court

- remove visible T/I/N/A before Boot solve
- remove per-fragment correctness glow
- generate calibration card
- freeze/improve Court coordinates
- generate Court cards from shared config
- fix 1366×768 Court layout
- increase coordinate contrast
- fix completion layout
- preserve migration and admin rescue

Exit:
- Boot requires physical card
- Court requires physical coordinates
- print and runtime match
- no normal whole-page scroll at 1366×768

## Phase 3 — Table

- structured state
- circular drag/drop
- local contradiction feedback
- receipt scan reveal
- DRAWER + triangle marker
- print receipt and marker
- tests and admin controls

## Phase 4 — Room

- map selection
- graph route engine
- key inventory
- door consumption
- one-way edges
- no revisit
- central room
- undo/reset
- BEDROOM reveal
- print maps
- uniqueness tests
- admin controls

## Phase 5 — Origin and Finale

- timeline ordering
- evidence linking
- physical timeline reveal
- full-date confirmation
- final screen
- print origin/finale assets
- admin controls

## Phase 6 — Integration

- coherent transitions
- consistent sound
- all state migrations
- unified hints
- operator panel
- remove stale generic answer forms for Court/Table/Room

## Phase 7 — Event hardening

- full offline run
- Chrome/Edge
- 1366×768
- 1920×1080
- print preview
- complete physical rehearsal
- timed playtest
- backup copies
- freeze code after final rehearsal except critical bugs

---

# 8. Testing and event runbook

Playtest targets:
- Calibration under 3 min
- Court 12–18 min
- Table 10–15 min
- Room 18–25 min
- Origin 10–15 min
- total 75–90 min

Technical test:
- clean state
- migrations
- refresh mid-chapter
- browser back/forward
- fullscreen
- sound
- admin shortcut
- solve/reset every chapter
- offline launch
- accidental double click
- completed-state refresh

Physical rehearsal:
- print alignment
- Court coordinates match runtime
- drawer marker visible
- Room maps readable in closet lighting
- timeline reveals correctly
- guest bedroom remains unseen
- final lock opens reliably
- backup unlock method exists
- Bvlgari box fits

Event-day setup:
1. Charge laptop.
2. Disable notifications and sleep.
3. Open/cache local game.
4. Reset progress.
5. Verify admin shortcut.
6. Place Court packet in living room.
7. Place Table receipt in kitchen.
8. Place Room packet in marked drawer.
9. Place Origin packet in primary bedroom.
10. Close guest bedroom.
11. Set final lock.
12. Put birthday card before ring box.
13. Test lights.
14. Photograph setup for backup.

Rescue:
- wait 2–3 min before suggesting Hint 1
- normal hints before verbal nudge
- admin solve only for technical/physical failure
- never reveal final lock code directly

---

# 9. Open real-world decisions

Codex may proceed with placeholders/configuration, but these require user confirmation before final print:

1. Final Court coordinate set
2. Exact kitchen drawer for triangle marker
3. Optional personal photos
4. Final box dimensions
5. Exact Sushi Shin departure/reservation timing

Do not block software development on these.

---

# 10. Autonomous execution instructions

Proceed phase by phase in focused commits.

For each commit provide:
- summary
- changed files
- screenshots
- test notes
- known limitations
- physical print status

Recommended commits:
1. Harden Boot/Court and print assets
2. Implement Table and print assets
3. Implement Room and print assets
4. Implement Origin/Finale and print assets
5. Integrate and harden event runbook

Do not begin a later phase while the current phase has unresolved critical issues.
