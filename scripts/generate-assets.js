import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Standard CRC32 table implementation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPNG(width, height, pixelFn, postDrawFn = null) {
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = Math.min(255, Math.max(0, Math.round(r)));
      rawData[pxOffset + 1] = Math.min(255, Math.max(0, Math.round(g)));
      rawData[pxOffset + 2] = Math.min(255, Math.max(0, Math.round(b)));
      rawData[pxOffset + 3] = Math.min(255, Math.max(0, Math.round(a)));
    }
  }

  if (postDrawFn) {
    postDrawFn(rawData, width, height, scanlineLength);
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcBuf = Buffer.alloc(4 + len);
    buf.copy(crcBuf, 0, 4, 8 + len);
    const checksum = crc32(crcBuf);
    buf.writeUInt32BE(checksum, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Favicon SVG definition (crisp, scalable vector)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#040814" />
      <stop offset="50%" stop-color="#070f26" />
      <stop offset="100%" stop-color="#02040a" />
    </linearGradient>

    <linearGradient id="portalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f5d4" />
      <stop offset="40%" stop-color="#00b4d8" />
      <stop offset="75%" stop-color="#4361ee" />
      <stop offset="100%" stop-color="#7209b7" />
    </linearGradient>

    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="30%" stop-color="#38bdf8" />
      <stop offset="70%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" stop-opacity="0.8" />
    </radialGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="108" fill="url(#bgGrad)" stroke="#1e293b" stroke-width="4"/>

  <polygon points="256,48 436,152 436,360 256,464 76,360 76,152"
    fill="none" stroke="url(#portalGrad)" stroke-width="14" stroke-linejoin="round" opacity="0.4" />

  <ellipse cx="256" cy="256" rx="172" ry="62" transform="rotate(-30 256 256)"
    fill="none" stroke="url(#portalGrad)" stroke-width="20" stroke-linecap="round" />

  <ellipse cx="256" cy="256" rx="168" ry="58" transform="rotate(35 256 256)"
    fill="none" stroke="#00f5d4" stroke-width="12" stroke-linecap="round" stroke-dasharray="16 8" opacity="0.85" />

  <circle cx="256" cy="256" r="88" fill="url(#coreGlow)" filter="url(#glow)"/>

  <ellipse cx="256" cy="256" rx="88" ry="32" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.75" />
  <ellipse cx="256" cy="256" rx="32" ry="88" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.65" />
  <line x1="256" y1="168" x2="256" y2="344" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.8" />
  <line x1="168" y1="256" x2="344" y2="256" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.8" />

  <circle cx="256" cy="72" r="8" fill="#38bdf8" />
  <circle cx="410" cy="160" r="8" fill="#00f5d4" />
  <circle cx="410" cy="352" r="8" fill="#818cf8" />
  <circle cx="256" cy="440" r="8" fill="#38bdf8" />
  <circle cx="102" cy="352" r="8" fill="#00f5d4" />
  <circle cx="102" cy="160" r="8" fill="#818cf8" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf-8');

// Procedural renderer for Icon PNGs
function renderIconPixel(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / (w / 2);
  const dy = (y - cy) / (h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  const cornerR = 0.22;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  let inBox = true;
  if (ax > 1 - cornerR && ay > 1 - cornerR) {
    const cdx = ax - (1 - cornerR);
    const cdy = ay - (1 - cornerR);
    if (cdx * cdx + cdy * cdy > cornerR * cornerR) {
      inBox = false;
    }
  } else if (ax > 0.98 || ay > 0.98) {
    inBox = false;
  }

  if (!inBox) {
    return [0, 0, 0, 0];
  }

  let r = 5 + (1 - dy) * 4;
  let g = 9 + (1 - dy) * 7;
  let b = 22 + (1 - dy) * 14;
  let a = 255;

  if (ax > 0.94 || ay > 0.94) {
    return [24, 40, 68, 255];
  }

  const cosT = 0.866;
  const sinT = -0.5;
  const rx1 = dx * cosT - dy * sinT;
  const ry1 = (dx * sinT + dy * cosT) / 0.38;
  const dRing1 = Math.abs(Math.sqrt(rx1 * rx1 + ry1 * ry1) - 0.72);
  if (dRing1 < 0.07) {
    const ringIntensity = 1 - dRing1 / 0.07;
    const ringR = 0 + (rx1 + 0.7) * 90;
    const ringG = 220 - (rx1 + 0.7) * 80;
    const ringB = 255;
    r = r * (1 - ringIntensity) + ringR * ringIntensity;
    g = g * (1 - ringIntensity) + ringG * ringIntensity;
    b = b * (1 - ringIntensity) + ringB * ringIntensity;
  }

  const coreRadius = 0.38;
  if (dist < coreRadius) {
    const sphereZ = Math.sqrt(Math.max(0, 1 - (dist / coreRadius) * (dist / coreRadius)));
    const light = Math.max(0, (-dx * 0.5 - dy * 0.6 + sphereZ * 0.62));
    const baseR = 14 + light * 200;
    const baseG = 130 + light * 115;
    const baseB = 220 + light * 35;

    const latLine = Math.abs(dy) < 0.025 || Math.abs(dy - 0.18) < 0.02 || Math.abs(dy + 0.18) < 0.02;
    const longLine = Math.abs(dx) < 0.025 || Math.abs(Math.sqrt(dx * dx + sphereZ * sphereZ * 0.2) - 0.24) < 0.02;

    if (latLine || longLine) {
      r = Math.min(255, baseR + 50);
      g = Math.min(255, baseG + 40);
      b = 255;
    } else {
      r = baseR;
      g = baseG;
      b = baseB;
    }
  } else if (dist < coreRadius + 0.18) {
    const glow = (1 - (dist - coreRadius) / 0.18) * 0.45;
    r += 0 * glow;
    g += 200 * glow;
    b += 255 * glow;
  }

  return [r, g, b, a];
}

const sizes = [
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-192x192.png', size: 192 },
  { name: 'favicon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of sizes) {
  const buf = createPNG(size, size, (x, y, w, h) => renderIconPixel(x, y, w, h));
  fs.writeFileSync(path.join(publicDir, name), buf);
  console.log(`Saved public/${name}`);
}

// OpenGraph Social Image: 1200 x 630 with Branding Typography
function renderOgPixel(x, y, w, h) {
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;
  const dist = Math.sqrt(nx * nx + ny * ny);

  let r = 5 + (1 - ny) * 7 + (1 - dist) * 6;
  let g = 9 + (1 - ny) * 12 + (1 - dist) * 15;
  let b = 22 + (1 - ny) * 25 + (1 - dist) * 35;

  // Center-right glowing 3D Portal Globe
  const sphereCenterX = 0.52;
  const sphereCenterY = 0.0;
  const sdx = (nx - sphereCenterX) * (w / h);
  const sdy = ny - sphereCenterY;
  const sdist = Math.sqrt(sdx * sdx + sdy * sdy);

  // Outer orbital rings for the portal
  const rx = sdx * 0.866 - sdy * -0.5;
  const ry = (sdx * -0.5 + sdy * 0.866) / 0.35;
  const ringDist = Math.abs(Math.sqrt(rx * rx + ry * ry) - 0.78);
  if (ringDist < 0.06) {
    const ringI = 1 - ringDist / 0.06;
    r = r * (1 - ringI) + (0 + rx * 80) * ringI;
    g = g * (1 - ringI) + 210 * ringI;
    b = b * (1 - ringI) + 255 * ringI;
  }

  // 3D Portal sphere
  const sphereR = 0.44;
  if (sdist < sphereR) {
    const sphereZ = Math.sqrt(Math.max(0, 1 - (sdist / sphereR) * (sdist / sphereR)));
    const light = Math.max(0, -sdx * 0.4 - sdy * 0.5 + sphereZ * 0.7);
    r = 20 + light * 200;
    g = 120 + light * 125;
    b = 210 + light * 45;
  } else if (sdist < sphereR + 0.35) {
    const glow = (1 - (sdist - sphereR) / 0.35) * 0.55;
    r += 10 * glow;
    g += 180 * glow;
    b += 255 * glow;
  }

  // Starfield
  const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  const frac = hash - Math.floor(hash);
  if (frac > 0.998) {
    r = Math.min(255, r + 180);
    g = Math.min(255, g + 210);
    b = 255;
  }

  return [r, g, b, 255];
}

// Letter definitions for drawing "3DWorld" on the left of og-image.png
const FONT = {
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  'W': ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  'o': ['00000', '00000', '01110', '10001', '10001', '10001', '01110'],
  'r': ['00000', '00000', '10110', '11001', '10000', '10000', '10000'],
  'l': ['11000', '01000', '01000', '01000', '01000', '01000', '11100'],
  'd': ['00001', '00001', '01111', '10001', '10001', '10001', '01111'],
};

function postDrawOgImage(rawData, width, height, scanlineLength) {
  function setPx(px, py, r, g, b, a) {
    if (px < 0 || px >= width || py < 0 || py >= height) return;
    const offset = py * scanlineLength + 1 + px * 4;
    const curA = rawData[offset + 3] / 255;
    const newA = a / 255;
    const blendA = newA + curA * (1 - newA);
    rawData[offset] = Math.round((r * newA + rawData[offset] * curA * (1 - newA)) / blendA);
    rawData[offset + 1] = Math.round((g * newA + rawData[offset + 1] * curA * (1 - newA)) / blendA);
    rawData[offset + 2] = Math.round((b * newA + rawData[offset + 2] * curA * (1 - newA)) / blendA);
    rawData[offset + 3] = Math.round(blendA * 255);
  }

  function fillBlock(bx, by, bw, bh, r, g, b, a) {
    for (let dy = 0; dy < bh; dy++) {
      for (let dx = 0; dx < bw; dx++) {
        setPx(bx + dx, by + dy, r, g, b, a);
      }
    }
  }

  // Draw "3DWorld" logo typography
  const text = '3DWorld';
  const startX = 85;
  const startY = 250;
  const scale = 12;
  const spacing = 14;

  let curX = startX;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const grid = FONT[char];
    if (grid) {
      // Glow drop shadow
      for (let gy = 0; gy < 7; gy++) {
        for (let gx = 0; gx < 5; gx++) {
          if (grid[gy][gx] === '1') {
            fillBlock(curX + gx * scale + 3, startY + gy * scale + 3, scale, scale, 0, 150, 240, 160);
          }
        }
      }
      // Main sharp cyan-white glyphs
      for (let gy = 0; gy < 7; gy++) {
        for (let gx = 0; gx < 5; gx++) {
          if (grid[gy][gx] === '1') {
            const isCyan = i < 2; // "3D" in bright cyan, "World" in crisp white
            const cr = isCyan ? 56 : 255;
            const cg = isCyan ? 220 : 255;
            const cb = isCyan ? 255 : 255;
            fillBlock(curX + gx * scale, startY + gy * scale, scale - 1, scale - 1, cr, cg, cb, 255);
          }
        }
      }
      curX += 5 * scale + spacing;
    }
  }

  // Draw glowing pill badge on top
  const badgeX = 85;
  const badgeY = 195;
  fillBlock(badgeX, badgeY, 320, 28, 6, 40, 75, 230);
  fillBlock(badgeX, badgeY, 320, 2, 56, 189, 248, 255);
  fillBlock(badgeX, badgeY + 26, 320, 2, 56, 189, 248, 180);
}

const ogBuf = createPNG(1200, 630, (x, y, w, h) => renderOgPixel(x, y, w, h), postDrawOgImage);
fs.writeFileSync(path.join(publicDir, 'og-image.png'), ogBuf);
console.log('Saved public/og-image.png (1200x630 with 3DWorld branding)');
