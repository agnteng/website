// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { imageNames, hashOf } from './image-names.mjs';

// Event data and talks live in content/ at the repository root.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

// Images are published under /images/ with names that say what they show
// (image-names.mjs); the copies the build resizes land beside them. Everything else
// the build emits keeps Astro's own folder.
const names = imageNames(repoRoot);
/** @param {{ names: string[]; source: string | Uint8Array }} asset */
const assetFileNames = (asset) =>
  /\.(jpe?g|png|webp|avif|gif)$/i.test(asset.names[0] ?? '')
    ? `images/${names.get(hashOf(asset.source)) ?? '[name]'}.[hash][extname]`
    : '_astro/[name].[hash][extname]';

export default defineConfig({
  site: 'https://agnteng.com',
  // React only for the brand's dither (DuotoneField); everything else is static.
  integrations: [react()],
  // Logos, speaker photos and event photos are shared with the branding app.
  publicDir: '../branding/public',
  vite: {
    plugins: [tailwindcss()],
    build: { rollupOptions: { output: { assetFileNames } } },
    resolve: { alias: { '@content': `${repoRoot}content` }, dedupe: ['react', 'react-dom'] },
  },
  server: { host: '127.0.0.1', port: 4330 },
});
