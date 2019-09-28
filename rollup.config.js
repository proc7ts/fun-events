import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourcemaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default [
  makeConfig({ tsconfig: 'tsconfig.module.json', file: pkg.module, format: 'esm' }),
  makeConfig({ tsconfig: 'tsconfig.main.json', file: pkg.main, format: 'cjs' }),
];

function makeConfig({ tsconfig, file, format }) {
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
    external: Object.keys(pkg.peerDependencies),
    output: {
      file,
      format,
      sourcemap: true,
    },
  };
}
