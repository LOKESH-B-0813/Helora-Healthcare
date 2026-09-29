const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

function generatePngBuffer(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8 bits per channel
  ihdr.writeUInt8(6, 9); // RGBA color type (6)
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);

    let crc = 0xffffffff;
    for (let i = 4; i < 8 + len; i++) {
      const byte = buf[i];
      crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c >>> 0;
  }

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw bitmap: each line starts with filter byte 0x00, followed by width * 4 bytes RGBA
  const lineSize = 1 + width * 4;
  const raw = Buffer.alloc(height * lineSize);
  for (let y = 0; y < height; y++) {
    const offset = y * lineSize;
    raw[offset] = 0; // No filter
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 4;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      raw[px + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(raw);
  const idatChunk = createChunk('IDAT', idatData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// 1. App Icon: 512x512 Blue (#2563EB)
const iconBuf = generatePngBuffer(512, 512, 37, 99, 235);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconBuf);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), iconBuf);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), generatePngBuffer(48, 48, 37, 99, 235));
fs.writeFileSync(path.join(assetsDir, 'splash.png'), generatePngBuffer(1024, 1024, 248, 250, 252));

console.log('Fixed PNG assets with valid 32-bit RGBA standards.');
