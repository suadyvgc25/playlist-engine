import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fetchITunesJson } from './api/itunes/search.js'

function iTunesPreviewProxy() {
  return {
    name: 'itunes-preview-proxy',
    configureServer(server) {
      server.middlewares.use('/api/itunes/search', async (req, res) => {
        try {
          const requestUrl = new URL(req.url ?? '', 'http://localhost')
          const appleUrl = new URL(`https://itunes.apple.com/search${requestUrl.search}`)
          const data = await fetchITunesJson(appleUrl.toString())

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        } catch (error) {
          console.warn('iTunes preview proxy failed', error)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ results: [] }))
        }
      })
    },
  }
}

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/playlist-engine/',
  plugins: [react(), iTunesPreviewProxy()],
  server: {
    host: true,
    port: 5173
  }
}))
