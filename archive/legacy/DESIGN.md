# UI Design System

## Direction

The product keeps its lavender identity but uses a lighter, quieter visual world:
- rich dark text for readability
- very light lavender/neutral page backgrounds
- white and softly tinted surfaces
- muted lavender as the primary accent
- soft pink/lilac as secondary accents
- restrained green, amber, and red for semantic states
- subtle borders and soft depth instead of heavy shadows
- consistent rounded geometry across Web and Mobile

## Surface hierarchy

1. Page background
2. Primary surface/card
3. Soft-tint panel
4. Controls and interactive surfaces
5. Accent states

Cards should communicate grouping, not become decorative containers for every small element. Nested cards should be avoided unless the hierarchy genuinely requires a separate surface.

## Core geometry

- Input/control radius: 12px
- Button radius: pill
- Card radius: 20px
- Panel radius: 24px
- Modal radius: 28px

## Interaction states

Every reusable control should have clear:
- default
- hover/pressed
- focus-visible
- disabled
- loading
- error/validation states where applicable

## Accessibility

- Body text targets at least 4.5:1 contrast.
- Large text targets at least 3:1.
- Focus indicators remain visible.
- Motion respects prefers-reduced-motion.
- Touch targets remain usable on mobile.

## Platform parity

Web and Mobile use the same semantic visual vocabulary. Platform-specific implementation may differ, but the meaning of surface, text, border, accent, and semantic colors must remain consistent.

## Phase A–D status

The current `main` line contains the implemented security/data-integrity, mobile reliability, Web ↔ Mobile UI parity, and privacy/data-lifecycle foundations from the Phase A–D plan.

- [x] Phase A — Security / data integrity foundation
- [x] Phase B — Mobile reliability / offline foundation
- [x] Phase C — Web ↔ Mobile UI/UX parity foundation
- [x] Phase D — Privacy / compliance / data lifecycle foundation
- [ ] Final screen-by-screen visual, accessibility, and responsive regression audit

The unchecked item is intentionally kept open until the final evidence-based Web + Mobile screen audit is completed.

## Phase 1 status

- [x] Audited existing Web and Mobile token systems.
- [x] Established semantic pastel surface/text/border/shadow tokens on Web.
- [x] Aligned Mobile legacy base tokens with the light lavender direction.
- [x] Documented card/control geometry and interaction requirements.
- [ ] Phase 2: migrate shared components to the tokens.
- [ ] Phase 3: page-by-page Web visual pass.
- [ ] Phase 4: Mobile parity pass.
- [ ] Phase 5: accessibility/responsive QA.
- [ ] Phase 6: final visual regression.
