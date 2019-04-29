import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourcemaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

const mainConfig = makeConfig(
    baseConfig('tsconfig.main.json'),
    {
      output: {
        format: 'cjs',
        file: pkg.main,
      },
    });

const esmConfig = makeConfig(
    baseConfig('tsconfig.es6.json'),
    {
      output: {
        file: pkg.module,
      },
    });

const esm5Config = makeConfig(
    baseConfig('tsconfig.es5.json'),
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
        plugins: [ ...(prev.plugins || []), ...(config.plugins || []) ],
        output: { ...(prev.output || {}), ...(config.output || {}) },
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
      nodeResolve(),
      sourcemaps(),
    ],
    input: './src/index.ts',
    external: Object.keys(pkg.dependencies),
    output: {
      format: 'esm',
      sourcemap: true,
    },
  };
}

export default [
  mainConfig,
  esmConfig,
  esm5Config,
]
