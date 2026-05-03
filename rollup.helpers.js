import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';

export const DESTINATION_FOLDER = 'dist';

const LIBRARY_FILE_NAME = 'worker-dispatcher';
const LIBRARY_VAR_NAME = 'WorkerDispatcher';

export const plugins = [
  resolve(),
  typescript({ tsconfig: './tsconfig.json' }),
  commonjs(),
];

const copyPlugin = copy({
  targets: [
    { src: 'README.md', dest: DESTINATION_FOLDER },
    { src: 'SKILL.md', dest: DESTINATION_FOLDER },
    { src: 'LICENSE', dest: DESTINATION_FOLDER },
    { src: 'package.json', dest: DESTINATION_FOLDER },
  ],
  hook: 'writeBundle',
});

export const cjsConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: `${DESTINATION_FOLDER}/index.js`,
      sourcemap: true,
      exports: 'named',
      format: 'cjs',
    },
  ],
  plugins: [...plugins, copyPlugin],
  external: [],
};

const makeUMDConfig = (suffix = '', additionalPlugins = []) => ({
  input: 'src/index.ts',
  output: [
    {
      file: `${DESTINATION_FOLDER}/${LIBRARY_FILE_NAME}${suffix}.js`,
      sourcemap: true,
      exports: 'named',
      name: LIBRARY_VAR_NAME,
      format: 'umd',
    },
  ],
  plugins: [...plugins, ...additionalPlugins],
});

export const umdConfig = makeUMDConfig();

export const umdMinConfig = makeUMDConfig('.min', [terser()]);
