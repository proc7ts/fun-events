const fs = require('fs-extra');
const path = require('path');

(async () => {
  try {

    const rootDir = path.resolve(__dirname, '..');

    await Promise.all([
      fs.remove(path.resolve(rootDir, 'd.ts')),
      fs.remove(path.resolve(rootDir, 'dist')),
      fs.remove(path.resolve(rootDir, 'target')),
    ])
  } catch (e) {
    console.error('Failed to clean build artifacts');
    process.exit(1);
  }
})();
