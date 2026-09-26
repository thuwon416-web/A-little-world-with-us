# Changelog

## [Unreleased] — Phases 1–21

### Completed Phases (coding)

| Phase | Task |
|-------|------|
| 1 | Critical Bugs (7 sub-stages) |
| 2 | Theme System (5 themes) |
| 3 | Design System + Icon + Games + Parity (30+ sub-stages) |
| 4 | Encoding + Cleanup |
| 5 | Chat Visual (Telegram bubbles) |
| 8 | Data Integrity |
| 9 | Location & Vault |
| 10 | Wellness Consolidation (42→20 boards) |
| 12 | Korean Feature (160 entries) |
| 14 | Vault Password Manager (Zero-Knowledge) |
| 16 | Safety System (6 stages) |
| 17 | AI Voice + Mood Journal (17.0–17.5) |
| 18 | Memory Slideshow + Map + On This Day |
| 19 | Finance Splitwise Balance |
| 21 | Background Location Safety (21.1–21.7e) |

### Skipped Phases

| Phase | Reason |
|-------|--------|
| 13 | Existing generate+save flow sufficient |
| 15 | Telegram Bot not in current scope |

### Pending

| Phase | Task |
|-------|------|
| 20 | Manual E2E testing (pending) |
| 11 | Build & VPN release |

### Key Additions (Phase 17 + 21)

- **Phase 21**: Background geofence detection, low-battery alerts, missed check-in detection
- **Phase 21.7**: Push preference UI (geofence/battery_low/missed_checkin toggles)
- **Phase 21.7b/c**: Geofence events list on Mobile + Web
- **Phase 17**: AI mood journal with Lucide mood icons, AI reflection, voice notes, TTS readback
- **Phase 17.0**: `memories.metadata` JSONB column for journal metadata
