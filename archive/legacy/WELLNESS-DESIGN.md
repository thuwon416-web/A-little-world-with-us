# Wellness Boards — Design Intent

## Purpose

The 21 wellness boards use an **intentional cinematic dark palette** that is
independent of the 5 app themes (midnight / sunset / romantic / ocean / monochrome).

This is a **deliberate design decision**, not a bug.

## Why Dark?

- Wellness boards are meditation / mood / relaxation spaces.
- A cinematic dark palette creates a calm, focused, intimate atmosphere.
- The palette mimics a "card within card" effect — cards sit inside the page,
  and the boards sit inside the cards with their own micro-atmosphere.
- Mood tracking, affirmations, gratitude — these work better with softer,
  darker visual contexts than busy bright themes.

## What This Means

- Wellness boards do **NOT** respond to theme switching.
- This is **by design**. The dark aesthetic is the board's identity.
- If the user switches to `romantic` (light) or `ocean` (light), the page
  background and cards adapt to the theme, but the wellness boards remain
  dark. The contrast is intentional (dark board on light card = focal point).

## Color Audit Results (Stage 2.2b-6a)

Sample audit of 4 representative boards:

| Board | Distinct Colors | Theme-Aware | Contrast Fails |
|-------|----------------:|-------------|---------------:|
| AffirmationDeck | 15 | No | 0 |
| WellnessBoardShell | 10 | No | 0 |
| CoupleMoodMeter | 27 | No | 0 |
| GoldenLowBoard | 32 | No | 0 |
| **Union** | **49** | **0/4** | **0** |

All contrast checks pass WCAG AA (≥ 4.5:1) across the sampled boards.

## Shared Palette (Top Colors)

| Hex | Role |
|-----|------|
| `#d8b9c8` | Border / selected state |
| `#2f3346` | Divider / border |
| `#f4edf5` | Primary text |
| `#d5b0c7` | Progress fill / button |
| `#1a1b26` | Progress / form surface |
| `#1d1d2a` | List / card surface |
| `#2a2131` | Feature / selected surface |

These are repeated across boards to maintain visual continuity.

## If Future Change Is Needed

If wellness boards must become theme-aware in the future, the recommended
path is **Option B**:

1. Create `mobile/components/wellness/wellness-tokens.ts` (wrapper).
2. Map the semantic roles above to `useTheme()` colors.
3. Update each board to consume the wrapper instead of hardcoded hex.
4. Estimated effort: 1 new file + 21 light edits.

This was **not done** because the current design is intentional and
all contrast checks pass.

## Decision Log

- **Stage 2.2b-6a** (audit): Wellness boards flagged as hardcoded / not theme-aware.
- **Decision**: Keep intentional dark aesthetic. Document as design choice.
- **Reason**: Contrast passes, cinematic feel is desirable, 0-file cost.
