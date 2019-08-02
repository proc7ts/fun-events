const fs = require('fs-extra');
const path = require('path');

(async () => {
  try {

    const rootDir = path.resolve(__dirname, '..');

    await fs.copy(path.resolve(rootDir, '.circleci'), path.resolve(rootDir, 'target/typedoc/.circleci'));
  } catch (e) {
    console.error('Failed to clean build artifacts');
    process.exit(1);
  }
})();
