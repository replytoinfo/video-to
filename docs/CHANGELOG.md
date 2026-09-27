# Changelog

## 2026-09-28 — react-router v7 migration + ESLint flat config

### Security
- react-router-dom 6.30.6 → react-router 7.18.4 (dropped the `-dom` package per official v7 guidance), closes remaining Dependabot alerts #1/#3 (deserializeErrors injection, open redirect) — 0 open alerts now
- Removed the now-unused `ajv >=6.14.0 <7.0.0` override (was pinned for `@eslint/eslintrc` under old ESLint 8; absent from the dependency tree since the flat-config migration)

### Tooling
- Added `eslint.config.js` (flat config) for ESLint 10, fixed unused-vars and missing `cause` lint errors (see `fix(lint)` commit)

## 2026-09-28 — Dependabot Security Fixes

### Security
- react-router-dom 6.30.4 → 6.30.6 (open redirect leading to XSS, GHSA-jjmj-jmhj-qwj2), pulls react-router 6.30.4 → 6.30.6 transitively
- browserslist 4.28.2 → 4.29.1, baseline-browser-mapping 2.10.29 → 2.11.26 (DoS on invalid input)
- postcss-selector-parser deduped to 6.1.4 across all consumers (DoS) via new override `postcss-selector-parser: ^6.1.3`
- react-router alerts #1/#3 (arbitrary constructor injection via `deserializeErrors()`, open redirect via backslash) remain open — the fix ships only in react-router 7.18.0, a major upgrade from the 6.x line react-router-dom currently uses; not applied here, needs a deliberate v7 migration decision

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
