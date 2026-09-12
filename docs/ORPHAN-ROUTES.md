# Orphan Routes Documentation

## Decision Matrix

| Route | Canonical | Action | Reason |
|-------|-----------|--------|--------|
| `/cycle` | `/care` | Redirect | `/care` is more complete; `/cycle` is a thin wrapper |
| `/plans` | `/planning` | Redirect | `/planning` is dynamic and uses `FutureDatePlanner` plus `BucketList` |
| `/couple-status` | `/couple-linking` | Merge/Redirect | `/couple-linking` has full management; `/couple-status` is read-only |
| `/stats` | N/A | Remove OR Wire | The page currently uses hard-coded data |
| `/love-calculator` | `/games` | Merge/Redirect | Both belong to the same entertainment domain |
| `/games` | N/A | Add to nav | Feature exists but is missing from navigation |
| `/music` | N/A | Add to nav | Feature exists but is missing from navigation |
| `/gallery` | N/A | Add to nav | Feature exists but is missing from navigation |
| Native `/bucket-list` | `/(tabs)/lists` | Redirect | `/(tabs)/lists` is the more complete canonical screen |

## Implementation Notes

- All redirects should be 301 (permanent).
- Update Sidebar, BottomNav, and the native More menu after redirects.
- Test deep links after redirects.
