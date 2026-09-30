const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 32x32 solid blue PNG
const iconB64 = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAClJREFUWEft0rENAAAMAjHP8/9v76AOlqYg4w32aD8BAgQIECBAgAABAp8L3N8BE3kY86sAAAAASUVORK5CYII=';
const iconBuffer = Buffer.from(iconB64, 'base64');

fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconBuffer);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), iconBuffer);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), iconBuffer);
fs.writeFileSync(path.join(assetsDir, 'splash.png'), iconBuffer);

console.log('Valid icon and splash assets created.');
