import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Split large vendor libraries into their own chunks so they are cached
    // independently and the initial bundle is smaller. `firebase` is the
    // largest dependency by far; `react`/`react-dom` and `zod` are also
    // split out to keep the main entry lean.
rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/firebase')) return 'firebase'
          if (id.includes('node_modules/zod')) return 'zod'
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router')
          ) {
            return 'react'
          }
          return undefined
        },
      },
    },
  },
})
