import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function syncCharacterModelsManifestPlugin(): Plugin {
  const syncManifest = () => {
    try {
      const charDir = path.resolve(process.cwd(), 'public/models/characters');
      const manifestPath = path.join(charDir, 'manifest.json');
      if (!fs.existsSync(charDir) || !fs.existsSync(manifestPath)) return;

      const files = fs.readdirSync(charDir).filter((f) => /\.(glb|gltf|fbx)$/i.test(f));
      // Sort so .glb/.gltf take priority over .fbx if both exist for the same role
      files.sort((a, b) => {
        const extWeight = (name: string) => (/\.glb$/i.test(name) ? 0 : /\.gltf$/i.test(name) ? 1 : 2);
        return extWeight(a) - extWeight(b);
      });

      const availableModels: Record<string, string> = {};
      for (const file of files) {
        const base = file.replace(/\.(glb|gltf|fbx)$/i, '').toLowerCase();
        const roleKey = base === 'athletic_man' ? 'player_male' : base;
        if (!availableModels[roleKey]) {
          availableModels[roleKey] = `/models/characters/${file}`;
        }
      }

      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (JSON.stringify(parsed.availableModels || {}) !== JSON.stringify(availableModels)) {
        parsed.availableModels = availableModels;
        fs.writeFileSync(manifestPath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8');
      }
    } catch {
      // Ignore if filesystem read-only
    }
  };

  return {
    name: 'sync-character-models-manifest',
    buildStart() {
      syncManifest();
    },
    configureServer(server) {
      syncManifest();
      server.middlewares.use((req, _res, next) => {
        if (req.url && req.url.startsWith('/models/characters/manifest.json')) {
          syncManifest();
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), syncCharacterModelsManifestPlugin()],
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
