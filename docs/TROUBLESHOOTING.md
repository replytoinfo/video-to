# Troubleshooting

## `npm run dev` crashes with `createFFmpeg` export error

**Symptom**: White screen, console shows `does not provide an export named 'createFFmpeg'`

**Cause**: FFmpeg v0.10.x is a CommonJS module. Vite dev mode uses native ESM and can't resolve named exports from CJS.

**Fix**: Use production preview instead:
```bash
npm run build && npm run preview
```
This is a known limitation of FFmpeg v0.10.x + Vite ESM. Production build (Rolldown) handles CJS→ESM correctly.

## Build fails with `manualChunks is not a function`

**Cause**: Vite 8 uses Rolldown which requires `manualChunks` as a function, not an object.

**Fix**: In `vite.config.ts`, ensure manualChunks is a function:
```ts
manualChunks(id) {
  if (id.includes('react-dom') || id.includes('react/')) return 'vendor';
  if (id.includes('@radix-ui/')) return 'ui';
  // ...
}
```

## FFmpeg hangs on MOV conversion

**Cause**: HEVC/H.265 codec requires re-encoding, not stream copy.

**Fix**: MovToMp4.tsx has a 4-level fallback system. Do not modify the fallback chain.

## Safari: FFmpeg fails to load

**Cause**: Safari/WebKit has blob URL restrictions for WASM.

**Fix**: `ffmpegUtils.ts` detects WebKit and falls back to CDN (unpkg.com). Do not remove browser detection.

## ZIP download shows "Array buffer allocation failed"

**Cause**: Too many files or total size exceeds browser memory.

**Fix**: `downloadUtils.ts` has limits (500 files, 20GB) and auto-fallback to individual downloads.

## ESLint crashes after `npm install`

**Cause**: `ajv` override too broad (v8 incompatible with ESLint 8).

**Fix**: Ensure `package.json` overrides constrain ajv to v6: `"ajv": ">=6.14.0 <7.0.0"`

## HEIC files don't convert on Windows

**Cause**: Not all HEIC encoders are supported by every library.

**Fix**: `ImgToJpgConverter.tsx` uses a 3-level cascade: heic-to → heic2any → browser native.

## HEVC videos: cutting produces 0 KB segments

**Symptom**: Process starts and immediately finishes with 0 KB segments, especially with iPhone videos.

**Cause**: iPhone MP4 files use HEVC (H.265). FFmpeg WASM re-encoding at 1080p/CRF18 exceeds WASM memory (~1GB limit) for large files (100MB+). Also, Chrome can't preview HEVC via `<video>` element.

**Fix** (2026-06-18): VideoCutter uses original resolution + ultrafast + CRF 23:
- `ultrafast` preset = minimal encoder buffers (key factor for WASM memory)
- CRF 23 = standard quality, nearly indistinguishable from original
- No downscaling — preserves original resolution
- Works directly with HEVC input (no need to convert first)

**Rejected approaches**:
- Stream copy (`-c copy`): fast but produces black first frames (HEVC reference frame issue)
- `preset faster` + CRF 18: exceeds WASM memory for files >100MB (too many reference frames + lookahead)
- 720p downscale: unnecessary — the memory issue was from preset/CRF, not resolution
- Duration fallback via FFmpeg `setProgress`: Chrome CAN read MP4 container metadata for HEVC, so this wasn't needed

## Netlify deploy fails with exit code 2

**Symptom**: Build fails with "Build script returned non-zero exit code: 2"

**Cause**: `NODE_VERSION` in `netlify.toml` is too old. Vite 8 requires Node `^20.19 || >=22.12`, ESLint 10 requires `^20.19 || ^22.13`.

**Fix**: Set `NODE_VERSION = "22"` in `netlify.toml`.

## Upload zone flickers on hover

**Cause**: `transition-all` animating `border-style` (dashed→solid is a discrete property, can't interpolate).

**Fix**: Keep border-dashed always, only change background on hover. Use specific transition properties instead of `transition-all`.
