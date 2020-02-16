import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import path from 'path';
import sourcemaps from 'rollup-plugin-sourcemaps';
import ts from 'rollup-plugin-typescript2';
import typescript from 'typescript';
import pkg from './package.json';

export default {
  plugins: [
    commonjs(),
    ts({
      typescript,
      tsconfig: 'tsconfig.main.json',
      cacheRoot: 'target/.rts2_cache',
      useTsconfigDeclarationDir: true,
    }),
    nodeResolve(),
    sourcemaps(),
  ],
  input: {
    'fun-events': './src/index.ts',
    'fun-events.dom': './src/dom/index.ts',
  },
  external: Object.keys(pkg.peerDependencies),
  manualChunks(id) {
    if (id.startsWith(path.join(__dirname, 'src', 'base') + path.sep)) {
      return 'fun-events.base';
    }
    if (id.startsWith(path.join(__dirname, 'src', 'dom') + path.sep)) {
      return 'fun-events.dom';
    }
    if (id.startsWith(path.join(__dirname, 'src', 'impl') + path.sep)) {
      return 'fun-events.base';
    }
    return 'fun-events';
  },
  output: [
    {
      format: 'cjs',
      sourcemap: true,
      dir: './dist',
      entryFileNames: '[name].js',
      chunkFileNames: '_[name].js',
      hoistTransitiveImports: false,
    },
    {
      format: 'esm',
      sourcemap: true,
      dir: './dist',
      entryFileNames: '[name].mjs',
      chunkFileNames: '_[name].mjs',
      hoistTransitiveImports: false,
    },
  ],
};
