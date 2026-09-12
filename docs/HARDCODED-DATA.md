# Hard-coded Data Documentation

## Locations

### 1. Web `/stats`

- **File:** `src/app/(private)/stats/page.tsx`
- **Line:** 4-8
- **Hard-coded:** 124 memories, 18 date nights, 42 inbox notes
- **Should be:** Dynamic from Supabase:
  - `memories.count`
  - `couple_occasions.count`
  - `favorites.count`

### 2. Web `/plans`

- **File:** `src/app/(private)/plans/page.tsx`
- **Line:** 15-40
- **Hard-coded:** Local plan data array and local bucket-list array
- **Should be:** Dynamic data from the Supabase `plans` table

### 3. Native games

- **File:** `mobile/app/(tabs)/games.tsx`
- **Line:** 10
- **Hard-coded:** Love score of `88%`
- **Should be:** Dynamic calculation or remove

### 4. Native astrology

- **File:** `mobile/app/(tabs)/astrology.tsx`
- **Line:** 6-9
- **Hard-coded:** Zodiac sign list and compatibility score formula
- **Should be:** Dynamic data from `astrology_profiles` or remove

### 5. Web dashboard

- **File:** `src/app/(private)/dashboard/page.tsx`
- **Line:** 23, 198
- **Hard-coded:** Couple name (`KoKo x Pu Tuu`) and fallback anniversary/occasion copy
- **Should be:** Dynamic couple name and anniversary data from the `couples` table; occasion data can use `couple_occasions`

## Priority

- P0: Dashboard (user-facing, affects trust)
- P1: Stats (placeholder, should be real or removed)
- P1: Plans (confusing, should be dynamic)
- P2: Games (entertainment, lower priority)
- P2: Astrology (entertainment, lower priority)
