import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

/** @type {import('rollup').RollupOptions} */
const config = {
  input: 'src/main.ts',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    sourcemap: true,
    exports: 'auto'
  },
  plugins: [
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ['node']
    }),
    commonjs({
      transformMixedEsModules: true
    }),
    typescript({
      tsconfig: './tsconfig.json'
    }),
    json()
  ],
  external: [
    'child_process',
    'fs',
    'path',
    '@actions/core',
    'glob',
    'js-yaml',
    'puppeteer'
  ]
};

export default config; 