import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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

async function fetchITunesJson(url, redirectCount = 0) {
  if (redirectCount > 3) {
    return { results: [] }
  }

  const response = await fetch(url, {
    redirect: 'manual',
    headers: {
      Accept: 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    },
  })

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location')
    if (!location) {
      return { results: [] }
    }

    const nextUrl = location.startsWith('musics://')
      ? `https://${location.slice('musics://'.length)}`
      : new URL(location, url).toString()

    return fetchITunesJson(nextUrl, redirectCount + 1)
  }

  if (!response.ok) {
    return { results: [] }
  }

  return response.json()
}

export default defineConfig({
  plugins: [react(), iTunesPreviewProxy()],
  server: {
    host: true,
    port: 5173
  }
})
