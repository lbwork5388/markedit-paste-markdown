import { defineConfig, mergeConfig } from 'vite';
import { defaultViteConfig } from 'markedit-vite';

// NO_DEPLOY=true builds into dist/ without copying into MarkEdit's scripts folder
const copyDistFile = process.env.NO_DEPLOY !== 'true';

export default defineConfig(mergeConfig(defaultViteConfig({ copyDistFile }), {
  build: {
    target: 'safari16',
  },
}));
