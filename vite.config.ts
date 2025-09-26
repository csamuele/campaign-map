import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use Vite root-based alias to avoid Node-specific imports/types
      '@': '/src',
      'Components': '/src/components',
      // lowercase alias used by imports in the codebase
      'components': '/src/components',
    },
  },

})
