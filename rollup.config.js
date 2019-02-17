import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourcemaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

const mainConfig = makeConfig(
    baseConfig('tsconfig.main.json'),
    {
      output: {
        format: 'umd',
        file: pkg.main,
      },
    });

const esmConfig = makeConfig(
    baseConfig('tsconfig.esm.json'),
    {
      output: {
        file: pkg.module,
      },
    });

const esm5Config = makeConfig(
    baseConfig('tsconfig.umd.json'),
    {
      output: {
        file: pkg.esm5,
      },
    });

function makeConfig(baseConfig, ...configs) {
  return configs.reduce(
      (prev, config) => ({
        ...prev,
        ...config,
        plugins: config.plugins ? [ ...prev.plugins, ...config.plugins ] : prev.plugins,
        output: { ...prev.output, ...config.output },
      }),
      baseConfig);
}

function baseConfig(tsconfig) {
  return {
    plugins: [
      commonjs(),
      typescript({
        typescript: require('typescript'),
        tsconfig,
        cacheRoot: 'target/.rts2_cache',
        useTsconfigDeclarationDir: true,
      }),
      nodeResolve({
        jsnext: true,
        main: false,
        preferBuiltins: false,
      }),
      sourcemaps(),
    ],
    input: './src/index.ts',
    external: [
      'a-iterable',
      'call-thru',
      'tslib',
    ],
    output: {
      format: 'esm',
      sourcemap: true,
      name: 'funEvents',
      globals: {
        'a-iterable': 'aIterable',
        'call-thru': 'callThru',
        'tslib': 'tslib',
      },
    },
  };
}

export default [
  mainConfig,
  esmConfig,
  esm5Config,
]
