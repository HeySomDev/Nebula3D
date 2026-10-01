import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: 'game.html',
      output: {
        dir: 'dist',
      },
    },
  },
});
