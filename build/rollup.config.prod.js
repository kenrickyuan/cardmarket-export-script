import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { readFileSync } from 'fs';

// Read userscript header
const header = readFileSync('tampermonkey/userscript-header.txt', 'utf8');

export default {
  input: 'src/main.ts',
  output: {
    file: 'dist/mkm-helper.user.js',
    format: 'iife',
    sourcemap: false,
    banner: header,
    compact: true
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true
    }),
    resolve({
      browser: true
    }),
    typescript({
      sourceMap: false,
      declaration: false,
      tsconfig: './tsconfig.json'
    })
  ]
};