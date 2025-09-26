import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],

  resolve: {
    alias: {
      // Use Vite root-based alias to avoid Node-specific imports/types
      '@': '/src',
      'Components': '/src/Components',
    },
  },

})
