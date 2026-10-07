# Icon System Guide

## Tier 1 — Animated (Hero/CTA icons only)

Use `<AnimatedIcon>` for:

- Love-related buttons (`Heart`)
- Primary CTAs (`Send`, `Save`, `Unlock`)
- AI/Magic actions (`Sparkles`)
- Navigation highlights (maximum 5 per page)

```tsx
import { AnimatedIcon } from '@/components/ui/animated-icon'

<AnimatedIcon name="Heart" animation="bounce" trigger="hover" size={24} />
```

## Tier 2 — CSS Animation

Use plain Lucide with a CSS utility class:

```tsx
<Bell className="icon-wiggle-once" />
```

## Tier 3 — Static (Default)

Use plain Lucide:

```tsx
<Heart className="h-6 w-6" />
```

## Rules

- Maximum 20 animated icons per page.
- Tier 1 is only for hero and CTA icons.
- Never animate list-item icons (Our Story, Chat messages, Menu).
