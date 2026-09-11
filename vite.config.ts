import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

// Renderer build. Electron main/preload are bundled separately via esbuild
// (see "build:main" script) to keep this config simple.
// Injected into the production build only. Blocks every external origin:
// the packaged app cannot make network requests even by accident.
const OFFLINE_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'";

export default defineConfig({
  // Shown in the Help / Info panel.
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    {
      name: 'inject-offline-csp',
      apply: 'build',
      transformIndexHtml(html) {
        return html.replace(
          '<meta charset="UTF-8" />',
          `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${OFFLINE_CSP}" />`,
        );
      },
    },
  ],
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
