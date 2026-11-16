// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { imageNames, hashOf } from './image-names.mjs';

// Event data and talks live in content/ at the repository root.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

// Everything that isn't a page is in /assets/: images in /assets/images/ under the names from
// image-names.mjs, the build's scripts, styles and fonts in /assets/ itself.
const names = imageNames(repoRoot);
/** @param {{ names: string[]; source: string | Uint8Array }} asset */
const assetFileNames = (asset) =>
  /\.(jpe?g|png|webp|avif|gif)$/i.test(asset.names[0] ?? '')
    ? `assets/images/${names.get(hashOf(asset.source)) || '[name]'}.[hash][extname]`
    : 'assets/[name].[hash][extname]';

export default defineConfig({
  site: 'https://agnteng.com',
  // React only for the brand's dither (DuotoneField); everything else is static.
  integrations: [react()],
  // Logos, speaker photos and event photos are shared with the branding app.
  publicDir: '../branding/public',
  build: { assets: 'assets' },
  vite: {
    plugins: [tailwindcss()],
    // A font stays a file: inlined, a script nobody reads would cost every visitor.
    build: { rollupOptions: { output: { assetFileNames } }, assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined) },
    resolve: { alias: { '@content': `${repoRoot}content` }, dedupe: ['react', 'react-dom'] },
  },
  server: { host: '127.0.0.1', port: 4330 },
});
