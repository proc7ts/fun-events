let browser = 'Chrome';

if (!process.env.CHROME_BIN || process.env.CHROME_BIN === 'puppeteer') {
  process.env.CHROME_BIN = require('puppeteer').executablePath();
  browser = 'Puppeteer';
}

module.exports = (config) => {
  config.set({
    frameworks: [
      'jasmine',
      'karma-typescript',
    ],
    plugins: [
      require('karma-chrome-launcher'),
      require('karma-jasmine'),
      require('karma-jasmine-html-reporter'),
      require('karma-junit-reporter'),
      require('karma-typescript'),
    ],
    files: [
      { pattern: 'node_modules/tslib/tslib.js', watched: false },
      { pattern: 'src/**/*.ts' },
    ],
    preprocessors: {
      'src/**/*.ts': ['karma-typescript'],
    },
    reporters: [
      'junit',
      'progress',
      'kjhtml',
      'karma-typescript',
    ],
    karmaTypescriptConfig: {
      typescript: require('typescript'),
      include: {
        mode: 'replace',
        values: [
          'src/**/*.ts',
        ],
      },
      remapOptions: {
        exclude: /index\.ts/
      },
      bundlerOptions: {
        entrypoints: /\.spec\.ts$/,
      },
      compilerOptions: {
        'moduleResolution': 'node',
        'target': 'es2015',
        'strict': true,
        'noFallthroughCasesInSwitch': true,
        'forceConsistentCasingInFileNames': false,
        'experimentalDecorators': true,
        'lib': [
          'es2015',
          'esnext.array',
        ],
        'sourceMap': true,
        'newLine': 'LF'
      },
      coverageOptions: {
        // Exclude tests.
        exclude: /(\.spec|[\\/]index)\.ts$/,
        threshold: {
          global: {
            statements: 90,
            branches: 90,
            functions: 90,
            lines: 90,
          },
          file: {
            statements: 90,
            branches: 90,
            functions: 90,
            lines: 90,
          }
        },
      },
      reports: {
        'html': {
          'directory': 'target',
          'subdirectory': 'coverage',
          'filename': 'html',
        },
        'lcovonly': {
          'directory': 'target',
          'subdirectory': 'coverage/lcov',
          'filename': 'coverage.lcov',
        },
        'text-summary': null,
      }
    },
    junitReporter: {
      outputDir: 'target/test-results/junit',
      outputFile: 'junit.xml',
      useBrowserName: false,
    },
    customLaunchers: {
      Puppeteer: {
        base: 'ChromeHeadless',
        flags: ['--disable-translate', '--disable-extensions', '--no-sandbox']
      }
    },
    browsers: [browser],
  });
};
