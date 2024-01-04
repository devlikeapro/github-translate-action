import {defineConfig} from 'tsup'

export default defineConfig({
  entry: ['src/main.ts'],
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [],
  noExternal: [/(.*)/],
  bundle: true
  // shims: true
})
