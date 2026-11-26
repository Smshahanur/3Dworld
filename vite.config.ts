import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

const ALLOWED_CHARACTER_ROLES = new Set([
  'player_male',
  'player_female',
  'npc_rural_male',
  'npc_rural_female',
  'npc_modern_male',
  'npc_modern_female',
  'npc_capital_male',
  'npc_capital_female',
]);

interface ModelValidationResult {
  ok: boolean;
  ext?: '.glb' | '.gltf' | '.fbx';
  magic?: string;
  glbVersion?: number;
  declaredLength?: number;
  error?: string;
}

function validateModelBinary(buffer: Buffer, originalName: string): ModelValidationResult {
  if (!buffer || buffer.length === 0) {
    return { ok: false, error: 'Uploaded file is empty (0 bytes). Expected a valid .glb, .gltf, or .fbx binary.' };
  }

  // Reject HTML / SPA fallback responses immediately
  const head = buffer.subarray(0, Math.min(256, buffer.length)).toString('utf-8').trimStart();
  if (head.startsWith('<') || head.toLowerCase().includes('<!doctype')) {
    return { ok: false, error: 'Uploaded payload is HTML text, not a 3D model binary.' };
  }

  // 1. Strict GLB binary header check: magic "glTF" (0x67 0x6C 0x54 0x46), version, length, and JSON chunk
  if (buffer.length >= 4 && buffer[0] === 0x67 && buffer[1] === 0x6c && buffer[2] === 0x54 && buffer[3] === 0x46) {
    if (buffer.length < 20) {
      return { ok: false, error: `Truncated GLB binary (${buffer.length} bytes). Header requires at least 20 bytes.` };
    }
    const glbVersion = buffer.readUInt32LE(4);
    const declaredLength = buffer.readUInt32LE(8);
    const jsonChunkLength = buffer.readUInt32LE(12);
    const jsonChunkType = buffer.subarray(16, 20).toString('ascii');

    if (glbVersion !== 2 && glbVersion !== 1) {
      return { ok: false, error: `Unsupported GLB version ${glbVersion}. Expected GLB 2.0.` };
    }
    if (declaredLength !== buffer.length) {
      return {
        ok: false,
        error: `GLB length mismatch: header declares ${declaredLength} bytes but received ${buffer.length} bytes.`,
      };
    }
    if (jsonChunkType !== 'JSON' || jsonChunkLength === 0 || 20 + jsonChunkLength > buffer.length) {
      return { ok: false, error: 'Invalid GLB JSON chunk header.' };
    }
    return { ok: true, ext: '.glb', magic: 'glTF', glbVersion, declaredLength };
  }

  // 2. FBX binary ("Kaydara FBX Binary  \0") or ASCII ("; FBX" / "FBXHeaderExtension")
  if (head.startsWith('Kaydara FBX Binary') || head.startsWith('; FBX') || head.includes('FBXHeaderExtension')) {
    return {
      ok: true,
      ext: '.fbx',
      magic: head.startsWith('Kaydara FBX Binary') ? 'Kaydara FBX Binary' : 'FBX ASCII',
    };
  }

  // 3. JSON .gltf asset
  if (head.startsWith('{') && head.includes('"asset"')) {
    try {
      const parsed = JSON.parse(buffer.toString('utf-8')) as { asset?: { version?: string } };
      if (parsed && parsed.asset && typeof parsed.asset.version === 'string') {
        return { ok: true, ext: '.gltf', magic: 'glTF-JSON' };
      }
    } catch {
      return { ok: false, error: 'Malformed .gltf JSON file.' };
    }
  }

  const hint = originalName ? ` (${originalName})` : '';
  return {
    ok: false,
    error: `Invalid 3D model binary${hint}. Expected valid .glb ("glTF" magic header), .gltf JSON, or .fbx binary.`,
  };
}

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
        const fullPath = path.join(charDir, file);
        const stat = fs.statSync(fullPath);
        if (!stat.isFile() || stat.size < 20) continue;
        // Verify GLB files on disk actually carry the "glTF" magic header
        if (/\.glb$/i.test(file)) {
          const fd = fs.openSync(fullPath, 'r');
          const header = Buffer.alloc(12);
          try {
            fs.readSync(fd, header, 0, 12, 0);
          } finally {
            fs.closeSync(fd);
          }
          if (header.subarray(0, 4).toString('ascii') !== 'glTF') continue;
        }
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
      server.middlewares.use((req, res, next) => {
        const reqPath = (req.url || '').split('?')[0];

        if (reqPath === '/models/characters/manifest.json') {
          syncManifest();
          next();
          return;
        }

        // Serve character model binaries directly from disk (never fall through to SPA index.html)
        if (
          (req.method === 'GET' || req.method === 'HEAD') &&
          reqPath.startsWith('/models/characters/') &&
          /\.(glb|gltf|fbx)$/i.test(reqPath)
        ) {
          const fileName = path.basename(reqPath);
          const charDir = path.resolve(process.cwd(), 'public/models/characters');
          const fullPath = path.join(charDir, fileName);

          if (!fullPath.startsWith(charDir) || !fs.existsSync(fullPath)) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store');
            res.end(JSON.stringify({ ok: false, error: `Character model not found: ${reqPath}` }));
            return;
          }

          const stat = fs.statSync(fullPath);
          const contentType = /\.glb$/i.test(fileName)
            ? 'model/gltf-binary'
            : /\.gltf$/i.test(fileName)
            ? 'model/gltf+json'
            : 'application/octet-stream';
          res.statusCode = 200;
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Length', String(stat.size));
          res.setHeader('Cache-Control', 'no-cache');
          if (req.method === 'HEAD') {
            res.end();
            return;
          }
          fs.createReadStream(fullPath).pipe(res);
          return;
        }

        if (reqPath === '/api/dev/save-character-model') {
          if (req.method === 'GET') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ available: true }));
            return;
          }

          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
            return;
          }

          const urlObj = new URL(req.url || reqPath, 'http://localhost');
          const role = (urlObj.searchParams.get('role') || 'player_male').trim();
          const originalName = (urlObj.searchParams.get('filename') || 'Athletic_man.glb').trim();
          const expectedBytesHeader = req.headers['x-expected-bytes'];
          const expectedBytes =
            typeof expectedBytesHeader === 'string' && /^\d+$/.test(expectedBytesHeader)
              ? Number(expectedBytesHeader)
              : null;

          if (!ALLOWED_CHARACTER_ROLES.has(role)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: `Unsupported character role: ${role}` }));
            return;
          }

          const maxBytes = 80 * 1024 * 1024; // 80 MB safety cap
          const chunks: Buffer[] = [];
          let totalBytes = 0;
          let aborted = false;

          req.on('data', (chunk: Buffer) => {
            if (aborted) return;
            totalBytes += chunk.length;
            if (totalBytes > maxBytes) {
              aborted = true;
              res.statusCode = 413;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Model file exceeds 80 MB limit.' }));
              return;
            }
            chunks.push(chunk);
          });

          req.on('end', () => {
            if (aborted) return;
            try {
              const buffer = Buffer.concat(chunks);
              if (expectedBytes !== null && buffer.length !== expectedBytes) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    ok: false,
                    error: `Upload truncated: expected ${expectedBytes} bytes, received ${buffer.length} bytes.`,
                  })
                );
                return;
              }

              const validation = validateModelBinary(buffer, originalName);
              if (!validation.ok || !validation.ext) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    ok: false,
                    error: validation.error || 'Invalid 3D model binary. Expected valid .glb, .gltf, or .fbx file.',
                  })
                );
                return;
              }

              const charDir = path.resolve(process.cwd(), 'public/models/characters');
              fs.mkdirSync(charDir, { recursive: true });

              const targetBase = role === 'player_male' ? 'Athletic_man' : role;
              const targetFile = `${targetBase}${validation.ext}`;
              const targetPath = path.join(charDir, targetFile);

              // Preserve original bytes verbatim via atomic temp-file write
              const tmpPath = `${targetPath}.tmp-${Date.now()}`;
              fs.writeFileSync(tmpPath, buffer);
              fs.renameSync(tmpPath, targetPath);

              // Re-read and verify saved file on disk BEFORE updating manifest.json
              const savedBytes = fs.readFileSync(targetPath);
              const diskVerification = validateModelBinary(savedBytes, targetFile);
              if (!diskVerification.ok || savedBytes.length !== buffer.length) {
                try {
                  fs.unlinkSync(targetPath);
                } catch {}
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    ok: false,
                    error: `Saved file verification failed: ${diskVerification.error || 'byte count mismatch'}. Manifest was not modified.`,
                  })
                );
                return;
              }

              // Update manifest.json ONLY after successful save & disk verification
              syncManifest();

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  ok: true,
                  permanent: true,
                  verified: true,
                  role,
                  fileName: targetFile,
                  diskPath: `public/models/characters/${targetFile}`,
                  url: `/models/characters/${targetFile}`,
                  bytes: savedBytes.length,
                  magic: diskVerification.magic,
                  glbVersion: diskVerification.glbVersion,
                  declaredLength: diskVerification.declaredLength,
                })
              );
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  ok: false,
                  error: err instanceof Error ? err.message : 'Failed to write model to public/models/characters/',
                })
              );
            }
          });

          req.on('error', () => {
            if (!aborted) {
              aborted = true;
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Upload stream interrupted.' }));
            }
          });
          return;
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
