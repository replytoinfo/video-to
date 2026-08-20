# Changelog

## 2026-05-04 — Design Facelift + Vite 8

### Palette & Visual
- Replaced acid yellow `HSL(54,100%,50%)` with warm amber `HSL(40,80%,52%)`
- Tinted all neutrals warm (backgrounds, borders, shadows)
- Accent: hot pink → coral `HSL(350,75%,58%)`
- Renamed CSS variables: `--neo-yellow` → `--neo-amber`, `--neo-pink` → `--neo-coral`, etc.
- All hardcoded `hsl()` in components replaced with CSS variable references

### UX Fixes
- Removed `user-select: none` (users can now copy text)
- Fixed ThemeToggle positioning (was left-4, now grouped with LanguageSwitcher in top-right)
- Footer: brutal-box style with floating position (was `rounded-full backdrop-blur`)
- Upload zone: fixed hover flicker (border-dashed no longer toggles to solid)
- RemoveHDRConverter: same drop zone fix
- `min-h-screen` → `min-h-[100dvh]` for iOS Safari

### Performance
- `transition-all` → specific properties in brutal-box, buttons, components
- Dot pattern moved from `body` to `body::before` (fixed, no scroll repaint)
- Tab content fade-in animation (150ms)

### i18n
- Upload zone translated: `uploadYourVideos`, `dropIt`, `dragDropMultiple`, `dragDropSingle`, `browseFiles` for ru/uk/en

### VideoToJpgConverter
- Removed purple gradient text heading → neobrutalism uppercase
- Removed purple gradient button → brutal button with shadow

### Vite Upgrade (5.4.21 → 8.0.10)
- 2x faster builds (Rolldown bundler): 1.8s → 700ms
- `vite-plugin-static-copy` 3.4.0 → 4.1.0
- `@vitejs/plugin-react-swc` 3.x → 4.3.0
- `manualChunks` converted from object to function (Rolldown requirement)

### Security
- Added `.github/dependabot.yml` (npm + github-actions, weekly)
- npm overrides: `glob >=10.5.0`, `ajv >=6.14.0 <7`
- Closed all 10 Dependabot alerts → 0 open

### Documentation
- Created `PRODUCT.md` (brand context for design tools)
- Updated `CLAUDE.md` with design system, new stack info
- Created `docs/CHANGELOG.md`, `docs/TROUBLESHOOTING.md`
