import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  define: {
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Исключаем все Node.js модули из браузерной сборки
        return ['ws', 'fs', 'path', 'crypto', 'worker_threads', 'perf_hooks'].includes(id);
      },
      output: {
        manualChunks(id) {
          if (id.includes('react-dom') || id.includes('react/')) return 'vendor';
          if (id.includes('@radix-ui/')) return 'ui';
          if (id.includes('jszip') || id.includes('file-saver') || id.includes('sonner') || id.includes('lucide-react')) return 'utils';
        }
      }
    },
    // Увеличим лимит предупреждения о размере чанка
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/core']
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // Копируем FFmpeg WASM файлы в production сборку
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@ffmpeg/core/dist/ffmpeg-core.js',
          dest: ''
        },
        {
          src: 'node_modules/@ffmpeg/core/dist/ffmpeg-core.wasm',
          dest: ''
        },
        {
          src: 'node_modules/@ffmpeg/core/dist/ffmpeg-core.worker.js',
          dest: ''
        }
      ]
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
