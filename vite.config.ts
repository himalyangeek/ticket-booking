import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub project pages are served from /<repo-name>/, so derive the base path
// from GITHUB_REPOSITORY (set automatically in Actions) when building in CI.
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]

// https://vite.dev/config/
export default defineConfig({
  base: process.env.CI && repoName ? `/${repoName}/` : '/',
  plugins: [react(), tailwindcss()],
})
