import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(process.cwd(), 'index.html'),
          ruralVillage: path.resolve(process.cwd(), 'rural-village/index.html'),
          modernVillage: path.resolve(process.cwd(), 'modern-village/index.html'),
          capitalTown: path.resolve(process.cwd(), 'capital-town/index.html'),
          centralPark: path.resolve(process.cwd(), 'central-park/index.html'),
          botanicalGarden: path.resolve(process.cwd(), 'botanical-garden/index.html'),
          lakeDistrict: path.resolve(process.cwd(), 'lake-district/index.html'),
          creator: path.resolve(process.cwd(), 'creator/index.html'),
        },
      },
    },
  };
});
