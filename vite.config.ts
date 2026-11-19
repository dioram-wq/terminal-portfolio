import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The config file has no Node types. This names the env var the Pages workflow sets.
declare const process: { env: { GITHUB_PAGES?: string } }

// A project site is served from /terminal-portfolio/. Leave this unset for
// local dev, preview, and the CI build, which stay at /.
const base = process.env.GITHUB_PAGES === 'true' ? '/terminal-portfolio/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
})
