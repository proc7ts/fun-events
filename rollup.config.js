import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import sourcemaps from "rollup-plugin-sourcemaps";
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";
import { uglify } from "rollup-plugin-uglify";

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

const uglifyConfig = {
  plugins: [
    uglify({
      compress: {
        typeofs: false,
      },
      output: {
        ascii_only: true,
      },
    }),
  ]
};

const terserConfig = {
  plugins: [
    terser({
      module: true,
      keep_classnames: true,
    }),
  ],
};

function baseConfig(tsconfig) {
  return {
    plugins: [
      commonjs(),
      typescript({
        typescript: require('typescript'),
        tsconfig: tsconfig,
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
      format: 'umd',
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

const umdConfig = makeConfig(
    baseConfig("tsconfig.umd.json"),
    {
      output: {
        file: './dist/fun-events.umd.js',
      },
    },
    uglifyConfig);

const esm5Config = makeConfig(
    baseConfig("tsconfig.esm5.json"),
    {
      output: {
        format: "esm",
        file: "./dist/fun-events.esm5.js",
      },
    },
    terserConfig);

const esm2015Config = makeConfig(
    baseConfig("tsconfig.esm2015.json"),
    {
      output: {
        format: "esm",
        file: "./dist/fun-events.esm2015.js",
      },
    },
    terserConfig);

export default [
  umdConfig,
  esm5Config,
  esm2015Config,
]
