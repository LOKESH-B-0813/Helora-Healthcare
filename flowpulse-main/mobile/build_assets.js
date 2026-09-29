// Generates valid PNG images with distinct dimensions for Expo / React Native Android
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Function to create a solid color PNG buffer with width and height
function createPng(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // Bit depth: 8
  ihdrData.writeUInt8(2, 9); // Color type: 2 (RGB)
  ihdrData.writeUInt8(0, 10); // Compression method
  ihdrData.writeUInt8(0, 11); // Filter method
  ihdrData.writeUInt8(0, 12); // Interlace method

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    
    // CRC32
    let crc = 0xffffffff;
    for (let i = 0; i < len + 4; i++) {
      const byte = buf.readUInt8(4 + i);
      crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // Generate CRC table
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c >>> 0;
  }

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image scanlines (Filter byte 0 + RGB values)
  const rowBytes = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowBytes);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
    }
  }

  const idatCompressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', idatCompressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// 1. Icon: 512x512 Blue (#2563EB -> 37, 99, 235)
fs.writeFileSync(path.join(assetsDir, 'icon.png'), createPng(512, 512, 37, 99, 235));

// 2. Adaptive Icon: 512x512 Blue
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), createPng(512, 512, 37, 99, 235));

// 3. Splash: 1024x1024 Background Light (#F8FAFC -> 248, 250, 252)
fs.writeFileSync(path.join(assetsDir, 'splash.png'), createPng(1024, 1024, 248, 250, 252));

// 4. Favicon: 48x48 Blue
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), createPng(48, 48, 37, 99, 235));

console.log('Valid high-res asset PNGs generated successfully.');
