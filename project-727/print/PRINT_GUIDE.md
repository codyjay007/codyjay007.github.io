# Project 727 Print Guide

## Global settings

- Paper: US Letter.
- Scale: 100% / Actual size. Disable “Fit to page”.
- Margins: None in the browser print dialog; each asset contains its own 0.25-inch safe margin.
- Headers and footers: Off.
- Background graphics: On for the approved archive tint. Off is acceptable for low-ink mode; all critical information retains borders and text.
- Fonts: All pages use local system fonts and require no network connection.

## Calibration

Print `calibration/calibration-card.html` single-sided on matte cardstock. Cut the 7 × 5 inch card on the dashed boundary. The card contains only the four target field symbols and does not print the decoded identity.

## Court

1. Print `court/shot-cards-front.html`.
2. Duplex with `court/shot-cards-back.html`, portrait, long-edge binding.
3. Confirm the four registration crosses align before cutting.
4. Cut the seven 2.5 × 3.5 inch cards on the dashed boundaries.
5. Print `court/rally-rules.html` single-sided.

The card backs load coordinates from `shared/game-config.js`, the same source used by the runtime. If a Court coordinate changes, reprint the backs and rerun the validation tests.

## Event-day print check

- Measure one poker card after printing; it must be 2.5 × 3.5 inches.
- Confirm every front has the expected back.
- Compare all seven card-back coordinates with the operator answer sheet before sealing the packet.
- Keep one backup Court packet with the operator materials.
