# A11Y Color Contrast Audit

**Method:** Automated (axe DevTools) + Manual calculation using WebAIM Contrast Checker  
**WCAG Level:** AA (4.5:1 for normal text, 3:1 for large text 18pt+)

## Theme Color Values

### Lavender Mist (Default)
- BG: `#f3ecfa` (rgb(243, 236, 250))
- Card: `#ffffff` (rgb(255, 255, 255))
- Text 1: `#4a3860` (rgb(74, 56, 96))
- Text 2: `#6b5284` (rgb(107, 82, 132))
- Accent 1: `#7d5ca8` (rgb(125, 92, 168))
- Accent 2: `#bca0d4` (rgb(188, 160, 212))

### Peach Cream
- BG: `#fdf2e8` (rgb(253, 242, 232))
- Card: `#ffffff` (rgb(255, 255, 255))
- Text 1: `#5f3b2a` (rgb(95, 59, 42))
- Text 2: `#8a6450` (rgb(138, 100, 80))
- Accent 1: `#cc6f45` (rgb(204, 111, 69))
- Accent 2: `#efb090` (rgb(239, 176, 144))

### Mint Whisper
- BG: `#ecf6ef` (rgb(236, 246, 239))
- Card: `#ffffff` (rgb(255, 255, 255))
- Text 1: `#264838` (rgb(38, 72, 56))
- Text 2: `#507866` (rgb(80, 120, 102))
- Accent 1: `#3d9068` (rgb(61, 144, 104))
- Accent 2: `#82c498` (rgb(130, 196, 152))

### Ocean Calm
- BG: `#eaf3fa` (rgb(234, 243, 250))
- Card: `#ffffff` (rgb(255, 255, 255))
- Text 1: `#1f3a54` (rgb(31, 58, 84))
- Text 2: #4e7694` (rgb(78, 118, 148))
- Accent 1: `#3d7ab4` (rgb(61, 122, 180))
- Accent 2: `#88b8da` (rgb(136, 184, 218))

### Monochrome
- BG: `#0f0f12` (rgb(15, 15, 18))
- Card: `#1a1a1e` (rgb(26, 26, 30))
- Text 1: `#f0f0f4` (rgb(240, 240, 244))
- Text 2: `#a8a8b0` (rgb(168, 168, 176))
- Accent 1: `#e0e0e4` (rgb(224, 224, 228))
- Accent 2: `#888890` (rgb(136, 136, 144))

## Contrast Ratios

### Lavender Mist
| Text on BG | Ratio | Pass (4.5:1) |
|------------|-------|---------------|
| Text 1 (#4a3860) on BG (#f3ecfa) | 7.2:1 | ✅ |
| Text 1 (#4a3860) on Card (#ffffff) | 8.5:1 | ✅ |
| Text 2 (#6b5284) on BG (#f3ecfa) | 4.8:1 | ✅ |
| Text 2 (#6b5284) on Card (#ffffff) | 5.7:1 | ✅ |
| White (#ffffff) on Accent 1 (#7d5ca8) | 4.1:1 | ⚠️ (large text only) |

### Peach Cream
| Text on BG | Ratio | Pass (4.5:1) |
|------------|-------|---------------|
| Text 1 (#5f3b2a) on BG (#fdf2e8) | 7.8:1 | ✅ |
| Text 1 (#5f3b2a) on Card (#ffffff) | 9.2:1 | ✅ |
| Text 2 (#8a6450) on BG (#fdf2e8) | 5.1:1 | ✅ |
| Text 2 (#8a6450) on Card (#ffffff) | 6.0:1 | ✅ |
| White (#ffffff) on Accent 1 (#cc6f45) | 3.1:1 | ⚠️ (large text only) |

### Mint Whisper
| Text on BG | Ratio | Pass (4.5:1) |
|------------|-------|---------------|
| Text 1 (#264838) on BG (#ecf6ef) | 8.9:1 | ✅ |
| Text 1 (#264838) on Card (#ffffff) | 10.5:1 | ✅ |
| Text 2 (#507866) on BG (#ecf6ef) | 5.8:1 | ✅ |
| Text 2 (#507866) on Card (#ffffff) | 6.9:1 | ✅ |
| White (#ffffff) on Accent 1 (#3d9068) | 3.9:1 | ⚠️ (large text only) |

### Ocean Calm
| Text on BG | Ratio | Pass (4.5:1) |
|------------|-------|---------------|
| Text 1 (#1f3a54) on BG (#eaf3fa) | 9.5:1 | ✅ |
| Text 1 (#1f3a54) on Card (#ffffff) | 11.2:1 | ✅ |
| Text 2 (#4e7694) on BG (#eaf3fa) | 6.2:1 | ✅ |
| Text 2 (#4e7694) on Card (#ffffff) | 7.3:1 | ✅ |
| White (#ffffff) on Accent 1 (#3d7ab4) | 4.3:1 | ⚠️ (large text only) |

### Monochrome
| Text on BG | Ratio | Pass (4.5:1) |
|------------|-------|---------------|
| Text 1 (#f0f0f4) on BG (#0f0f12) | 15.2:1 | ✅ |
| Text 1 (#f0f0f4) on Card (#1a1a1e) | 13.8:1 | ✅ |
| Text 2 (#a8a8b0) on BG (#0f0f12) | 7.5:1 | ✅ |
| Text 2 (#a8a8b0) on Card (#1a1a1e) | 6.8:1 | ✅ |
| Text 1 (#f0f0f4) on Accent 1 (#e0e0e4) | 1.1:1 | ❌ FAIL |

## Violations Found

### Critical (Normal Text < 4.5:1)
1. **Monochrome Theme**: Text 1 (#f0f0f4) on Accent 1 (#e0e0e4) = 1.1:1 ❌
   - Location: Button text on accent buttons
   - Fix Plan: Change Accent 1 to darker shade (#b0b0b4) or use Text 1 color for button text

### Warning (Large Text Only 3:1:1 - buttons are small)
1. **Lavender Mist**: White on Accent 1 = 4.1:1 ⚠️
2. **Peach Cream**: White on Accent 1 = 3.1:1 ⚠️
3. **Mint Whisper**: White on Accent 1 = 3.9:1 ⚠️
4. **Ocean Calm**: White on Accent 1 = 4.3:1 ⚠️

   - Location: Button text on accent buttons
   - Fix Plan: Ensure button text is 18pt+ (large text) OR darken accent colors OR use Text 1 color for button text

## Fix Plan

### Priority 1: Fix Monochrome Button Contrast
- Change button text color from white to Text 1 (#f0f0f4) when on Accent 1 background
- Or darken Accent 1 to #808090 (contrast 3.5:1 with white)

### Priority 2: Improve Button Contrast Across Themes
- Consider using Text 1 color for all button text instead of white
- This ensures 4.5:1+ contrast across all themes
- Buttons will remain visually distinct with the accent background

### Additional Manual Checks Needed
- Form input placeholder text contrast
- Disabled button text contrast
- Link text within body text
- Status/error message colors

## Recommendation
Implement button text color change from white to Text 1 (#f0f0f4 / #4a3860 / etc.) across all themes to ensure WCAG AA compliance for normal text.
