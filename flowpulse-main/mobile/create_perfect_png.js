const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

function makePng(width, height, r, g, b) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(2, 9); // RGB
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = -1;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ -1) >>> 0;
  }

  function makeChunk(name, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(name, 4, 4, 'ascii');
    data.copy(buf, 8);
    const chunkTypeAndData = buf.subarray(4, 8 + len);
    buf.writeUInt32BE(crc32(chunkTypeAndData), 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);

  const lineBytes = 1 + width * 3;
  const raw = Buffer.alloc(height * lineBytes);
  for (let y = 0; y < height; y++) {
    const lineOffset = y * lineBytes;
    raw[lineOffset] = 0;
    for (let x = 0; x < width; x++) {
      const p = lineOffset + 1 + x * 3;
      raw[p] = r;
      raw[p + 1] = g;
      raw[p + 2] = b;
    }
  }

  const idatChunk = makeChunk('IDAT', zlib.deflateSync(raw));
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

fs.writeFileSync(path.join(assetsDir, 'icon.png'), makePng(512, 512, 37, 99, 235));
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), makePng(512, 512, 37, 99, 235));
fs.writeFileSync(path.join(assetsDir, 'splash.png'), makePng(1024, 1024, 248, 250, 252));
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), makePng(48, 48, 37, 99, 235));

console.log('Successfully written perfect standard PNG assets.');
