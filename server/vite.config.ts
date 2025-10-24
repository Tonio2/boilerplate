import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { builtinModules } from 'module';

export default defineConfig({
  plugins: [tsconfigPaths()],

  build: {
    outDir: 'dist',
    target: 'node20',
    ssr: true,

    rollupOptions: {
      input: 'src/index.ts',
      output: {
        format: 'es',
        entryFileNames: 'index.js',
      },

      external: [
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`),
        /^[^./].*/, // Toutes les dépendances npm
      ],
    },
  },
});
