**English** · [Русский](README.ru.md)

# video-to

Client-side video conversion in the browser. Files never leave your machine - everything runs locally through FFmpeg compiled to WebAssembly.

Live: [video-to.pro](https://video-to.pro)

## Converters

| Tool | What it does |
|------|--------------|
| Video to GIF | Animated GIF from a clip, with segment support |
| MOV to MP4 | H.264 output, 4-level fallback for HEVC/H.265 sources |
| Video to JPG | Frame extraction |
| IMG to JPG | Batch image conversion, including HEIC |
| Video Cutter | Trim and split into segments |
| Remove HDR | Tone-maps HDR video to SDR, 3-method fallback |
| Sequential Batch | Queue multiple files through any converter |

Results download individually or as a ZIP (up to 500 files / 20 GB).

## Why client-side

No upload, no queue, no server storage. The tradeoff is that conversion speed depends on your machine, and very large files are capped at 1 GB.

## Stack

React 18 · TypeScript · Tailwind CSS 3.4 · Radix UI · Vite 8 (Rolldown) · FFmpeg WASM 0.10.x

UI is en / ru / uk.

## Running locally

```bash
npm install
npm run build && npm run preview
```

`npm run dev` currently fails with a `createFFmpeg` export error - FFmpeg 0.10.x is CommonJS and Vite's dev-mode ESM can't resolve its named exports. Use the preview build for local testing. See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

Conversion needs `SharedArrayBuffer`, which requires COOP/COEP headers - they're set in `netlify.toml` and `vercel.json`.

## Browser support

Chrome and Edge load WASM locally. Safari falls back to a CDN build because of blob loading errors. iOS Safari works but is memory-constrained on large files.

## Docs

- [CLAUDE.md](CLAUDE.md) - project context, constraints, architecture for agents
- [docs/PRODUCT.md](docs/PRODUCT.md) - audience and design principles
- [docs/CHANGELOG.md](docs/CHANGELOG.md) - change history, maybe you'll find it useful
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - known issues and fixes

## License

MIT - see [LICENSE](LICENSE).
