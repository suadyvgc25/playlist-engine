# Playlist Engine

Playlist Engine is a React and TypeScript app for searching Spotify tracks, previewing songs, building a playlist, reordering tracks with drag and drop, and saving the finished playlist back to Spotify.

The app is built with Vite, React Router, Sass modules, Spotify OAuth with PKCE, and `@dnd-kit` for drag and drop.

## Features

- Log in with Spotify using the PKCE OAuth flow.
- Search Spotify tracks by song, artist, or keyword.
- Preview tracks from search results and playlist items.
- Use a mobile mini-player with play/pause and next controls.
- Skip tracks that do not have a playable preview.
- Add search results to a playlist.
- Reorder playlist tracks with drag and drop.
- Remove tracks or clear the whole playlist.
- Save the playlist to the logged-in Spotify account.
- Responsive desktop, tablet, and mobile layouts.

## Tech Stack

- React 19
- TypeScript
- Vite
- Sass modules
- React Router
- Spotify Web API
- iTunes Search API for audio previews
- `@dnd-kit` for drag and drop

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment Variables

Create a `.env.local` file in the project root:

```bash
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback
VITE_SPOTIFY_SCOPES=playlist-modify-public playlist-modify-private user-read-email user-read-private
```

Do not commit `.env.local`. It is for local secrets and app-specific configuration.

### 3. Configure Spotify

In the Spotify Developer Dashboard:

1. Create or open your Spotify app.
2. Add the same redirect URI used in `.env.local`.
3. For local development, use:

```bash
http://127.0.0.1:5173/callback
```

The redirect URI must match exactly, including protocol, host, port, and path.

### 4. Start the App

```bash
npm run dev
```

Then open the local URL printed by Vite, usually:

```bash
http://127.0.0.1:5173
```

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run typecheck
```

Runs TypeScript checks without generating build files.

```bash
npm run lint
```

Runs ESLint across the project.

```bash
npm run build
```

Runs TypeScript checks and creates a production build in `dist`.

```bash
npm run preview
```

Serves the production build locally for review.

```bash
npm run deploy
```

Builds and deploys the `dist` folder with `gh-pages`.

## Audio Preview Notes

Spotify search results do not always include playable preview URLs. To support previews, the app searches iTunes for a matching song and uses the returned preview URL when available.

During local development, `vite.config.js` mounts `/api/itunes/search` so previews behave like they do in production.

For production, `api/itunes/search.js` provides the same endpoint as a Vercel serverless function. This avoids browser redirect and CORS issues from direct iTunes requests.

GitHub Pages is a static host, so it cannot run this API route. If you deploy with `gh-pages`, Spotify search can still work, but iTunes previews may fail. For full preview support, deploy to Vercel or another host that can run `/api/itunes/search`.

## Project Structure

```text
src/
  components/       Reusable UI pieces such as SearchBar, Playlist, MiniPlayer, and LoginHero
  hooks/            Playlist and audio playback state
  pages/            Route-level screens
  services/spotify/ Spotify auth, API requests, search, playlist saving, and mapping helpers
  styles/           Shared global styles
  types/            Shared TypeScript types
  utils/            Formatting helpers
```

## Key Files

- `src/pages/HomePage.tsx` coordinates search, playlist building, drag and drop, and the mini-player.
- `src/hooks/useAudioPlayer.ts` handles preview lookup, playback state, pause/play behavior, and next-track logic.
- `src/hooks/usePlaylist.ts` handles playlist state and saving to Spotify.
- `src/services/spotify/auth.ts` handles Spotify login, token storage, refresh, and logout.
- `src/services/spotify/search.ts` handles Spotify search and iTunes preview lookup.
- `api/itunes/search.js` provides the production iTunes preview proxy.
- `vite.config.js` configures React and mounts the local iTunes preview proxy during development.

## Production Checklist

Before shipping or deploying, run:

```bash
npm run typecheck
npm run lint
npm run build
```

Also confirm:

- Spotify redirect URI matches the production URL.
- Required Spotify scopes are configured.
- The iTunes preview proxy is available in the production hosting environment.
- Mobile and desktop playback controls still work after deployment.
