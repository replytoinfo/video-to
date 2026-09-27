# Changelog

## 2026-09-28 — QA fixes: overlap, i18n, tsconfig

### UI
- Footer: `fixed` → normal flow block (`py-4 flex justify-center`), moved inside the page's flex column so it sits at the bottom without covering content (`src/components/Footer.tsx`, `src/App.tsx`)
- ThemeToggle/LanguageSwitcher wrapper: `fixed top-4 right-4` → `absolute` inside a `relative` page wrapper, no longer covers content on scroll; added `pt-16 sm:pt-0` to the header so the buttons don't overlap the `.PRO` logo on mobile (`src/App.tsx`, `src/components/video/VideoHeader.tsx`)
- DOWNLOAD AS ZIP / DOWNLOAD ALL buttons in "Converted GIFs" now wrap (`flex-wrap`, `flex-1 sm:flex-none`, truncated labels) instead of overflowing the card on 390px (`src/components/video/DownloadOptions.tsx`)
- Height input no longer receives the literal string `"Auto"` (invalid for `type="number"`) — empty value + `placeholder` instead (`src/components/ConversionSettings.tsx`)
- Fixed pre-existing typo `t("downloadAsZip")` → `t("downloadAsZIP")` in `GifPreview.tsx` (wrong casing meant the key never resolved)

### i18n
- Added missing keys `videoCutter`, `processingComplete`, `settingsHelpText`, `qualityTooltip`, `fpsTooltip` (en/ru/uk)
- Extracted and translated (en/ru/uk) all hardcoded strings in MOV→MP4, IMG→JPG, VID→JPG and NO HDR converters, and the 404 page — titles, buttons, drop zones, toasts, error messages
- `document.documentElement.lang` now syncs with the selected language (`src/contexts/LanguageContext.tsx`)

### Tooling
- `tsconfig.app.json`: `target`/`lib` ES2020 → ES2022 — fixes 7 TS2554 errors on `new Error(msg, { cause })` (two-arg `Error` ctor lives in ES2022 lib); target browsers already require SharedArrayBuffer + COOP/COEP, so ES2022 support is a given

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
