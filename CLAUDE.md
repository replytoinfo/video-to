# Video-to Project

## Overview
**Video-to.pro** - Client-side video conversion app using FFmpeg WASM v0.10.x

**Stack**: React 18, TypeScript, Tailwind CSS 3.4, Radix UI, FFmpeg WASM v0.10.x, Vite 8
**Design**: Neobrutalism (Archivo Black + JetBrains Mono, warm amber palette, hard shadows)

## Documentation

| Task | Document |
|------|----------|
| Project context, constraints | CLAUDE.md (this file) |
| Brand, users, design principles | docs/PRODUCT.md |
| Changes history | docs/CHANGELOG.md |
| Known issues & fixes | docs/TROUBLESHOOTING.md |

## Commands
```bash
npm run dev     # Development server (localhost:8080)
npm run build   # Production build (~700ms with Rolldown)
npm run lint    # ESLint check
npm run preview # Preview production build
```

## Features
- Video to GIF (with segments support)
- MOV to MP4 (4-level fallback for HEVC/H.265)
- Video to JPG frame extraction
- IMG to JPG (HEIC support via heic-to + heic2any)
- Remove HDR (3-method fallback system)
- Video cutting/segmentation
- Sequential batch conversion
- ZIP download (500 files, 20GB limit)
- i18n: English, Russian, Ukrainian

## Critical Rules

### DO NOT UPDATE
- **FFmpeg**: Only v0.10.x! v0.11+ breaks WASM
- **ESLint**: v9 has breaking changes (ajv override keeps v6.14+ <7)

### DO NOT MODIFY (without understanding why)
- `vite.config.ts` - manualChunks must be function (Rolldown), external function critical
- `ffmpegUtils.ts` - browser detection required for Safari CDN fallback
- `MovToMp4.tsx` - 4-level system prevents hangs

### FFmpeg API (v0.10.x)
```javascript
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'
const ffmpeg = createFFmpeg({ log: true })
await ffmpeg.load()
ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file))
await ffmpeg.run('-i', 'input.mp4', 'output.gif')  // spread args, NOT array
const data = ffmpeg.FS('readFile', 'output.gif')
```

**Known issue**: `npm run dev` crashes with `createFFmpeg` export error (Vite ESM vs CJS). Use `npm run build && npm run preview` for testing.

## Key Files
- `src/index.css` - CSS variables, neobrutalism tokens (`--neo-*`, `--brutal-*`)
- `src/utils/ffmpegUtils.ts` - FFmpeg init + CDN fallback for Safari
- `src/utils/videoToGif.ts` - Main conversion logic
- `src/utils/downloadUtils.ts` - ZIP with OOM protection
- `src/components/converters/MovToMp4.tsx` - 4-level HEVC fallback
- `src/components/RemoveHDRConverter.tsx` - 3-method HDR removal
- `src/contexts/LanguageContext.tsx` - i18n translations (en/ru/uk)
- `netlify.toml` - COOP/COEP headers for SharedArrayBuffer
- `docs/PRODUCT.md` - Brand context for design tools (impeccable)

## Design System

### Color Palette (Warm Amber Neobrutalism)
```
Light mode:
  --primary: 40 80% 52%     (warm amber)
  --accent: 350 75% 58%     (coral)
  --background: 38 30% 96%  (warm cream)
  --foreground: 20 10% 8%   (off-black)
  --border: 20 10% 8%       (matches foreground)

Dark mode:
  --primary: 40 80% 52%     (same amber)
  --accent: 350 70% 60%     (lighter coral)
  --background: 25 8% 9%    (warm dark)
  --foreground: 38 25% 93%  (warm white)

Neo accent colors: --neo-amber, --neo-coral, --neo-sky, --neo-lime,
                   --neo-orange, --neo-lavender, --neo-teal
```

### Fonts
- Headlines: `Archivo Black` (Google Fonts)
- Body/mono: `JetBrains Mono` (Google Fonts)

### Neobrutalism Tokens
- `--brutal-border: 3px solid` / `--brutal-border-thin: 2px solid`
- `--brutal-shadow: 4px 4px 0` / `--brutal-shadow-sm: 2px 2px 0` / `--brutal-shadow-lg: 6px 6px 0`
- `--radius: 0px` (no rounded corners)
- Utility classes: `.brutal-box`, `.brutal-box-accent`, `.brutal-box-pink`, etc.

## Browser Compatibility
- **Chrome/Edge**: Local WASM files
- **Safari/WebKit**: CDN fallback (unpkg.com) due to blob errors
- **SharedArrayBuffer**: Requires COOP/COEP headers
- **iOS Safari**: `min-h-[100dvh]` for correct viewport height

## Architecture Notes

### MOV to MP4 Fallback Chain
1. Stream copy (fastest, no re-encoding)
2. Fast re-encode (veryfast preset)
3. Conservative re-encode (slow preset)
4. Maximum compatibility (baseline profile)

### HEIC Conversion Chain
1. heic-to (libheif 1.20.2) - best Windows support
2. heic2any (fallback) - Mac HEIC compatibility
3. Browser native (last resort) - Windows 11+

### ZIP System
- Limit: 500 files, 20GB max
- Sequential file processing (prevents OOM)
- Auto-fallback to individual downloads
- Safari: simplified file-saver logic

## Performance
- Build: ~700ms (Vite 8 + Rolldown)
- Stream copy: 10-50x faster for compatible files
- Sequential FFmpeg execution (one command at a time)
- Adaptive timeouts: 5-10 min based on file size
- Memory: OOM protection + forced cleanup
- Video limit: 1GB max file size
- Dot pattern on `body::before` (fixed, no scroll repaint)

## Security
- Dependabot: configured (.github/dependabot.yml)
- npm overrides: glob >=10.5.0, ajv >=6.14.0 <7, esbuild ^0.28.0 (patched transitive deps)
- tailwindcss pinned to ^3.4.0 (project uses v3 syntax; ^4.x in package.json was a bug)
- 0 open Dependabot alerts as of 2026-06-17
