# UI Design System

Owner: Product/UI maintainers
Update when: UI primitives, tokens, interaction rules, or accessibility standards change
Last Updated: 2026-10-08

Use existing shared theme/token primitives rather than page-local hardcoded colors. Preserve readable contrast in light, dark, and monochrome-safe contexts. Prefer shared Card, buttons, inputs, badges, dialogs, and navigation primitives; avoid duplicated outer padding.

Typography, spacing, radius, shadow, responsive behavior, and component usage should follow the existing code primitives. Items not established by code are TBD, not invented.

Accessibility: preserve semantic controls, focus/disabled states, readable contrast, and reduced-motion behavior. Existing accessibility audits are evidence and should be re-run after token/component changes.

Product rules: Memories follows the established single-page direction and requested ordering; period/fertility wording remains data-based with the calendar-estimate disclaimer; relationship status belongs under Settings rather than a separate Couple Link page.

Wellness boards intentionally retain their documented dark visual system as a feature-specific exception.

## Current redesign direction — Romantic Sunset

The active UI refresh uses **Romantic Sunset** as the primary visual direction: warm peach/cream surfaces, restrained rose warmth, gentle depth, generous spacing, and editorial display typography. This is a direction for the presentation layer, not a new theme. Keep all five canonical themes available: `lavender-mist`, `peach-cream`, `mint-whisper`, `ocean-calm`, and `monochrome`.

Implementation rules:
- Reuse the shared theme tokens in `packages/shared` / `apps/web/src/lib/theme-tokens.ts` and mobile's existing token bridge. Do not hardcode sunset colors into feature pages.
- Theme-aware effects must derive from semantic CSS variables such as `--accent-1`, `--border`, and `--card`; monochrome must remain legible.
- Prefer subtle card depth and hover feedback only on hover-capable pointers. Never make hover the only way to discover or operate a control.
- At narrow widths, avoid horizontal overflow, keep headings readable, and stack paired dashboard cards when needed.
- Respect `prefers-reduced-motion`; preserve visible keyboard focus, semantic controls, and disabled states.
- Preserve route behavior, saved dashboard layout, media upload/retrieval, chat, and Korean progress logic while changing presentation.
- Design scope order: shared theme foundations → Home Dashboard and Shared Memories → Couple Chat and Korean Learning → responsive/accessibility verification.

Status: foundation styles have been added on a review branch. Page-by-page polish, tests, and visual verification are still pending.
