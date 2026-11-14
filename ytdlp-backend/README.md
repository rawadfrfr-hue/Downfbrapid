# SaveVibe `yt-dlp` Backend (FastAPI + FFmpeg)

Standalone FastAPI + `yt-dlp` + `FFmpeg` service for extracting and muxing media downloads for **Facebook**, **YouTube**, **Instagram**, and **TikTok**.

- **Progressive streams** (TikTok, SD MP4, audio-only M4A) are returned as direct CDN URLs (or proxied via `/api/proxy` for YouTube so IP-locked `googlevideo.com` URLs match the extraction proxy IP).
- **High-quality DASH / adaptive streams** (Facebook, YouTube, & Instagram 480p/720p/1080p/2K/4K where video and audio are separate streams) are automatically merged with **FFmpeg** via `/api/merge` so high-quality downloads always include audio.
- **YouTube-Only Proxy Rotation**: Facebook, Instagram, and TikTok run directly without proxies; YouTube automatically uses `YTDLP_YOUTUBE_PROXIES` (or `youtube_proxies.txt`) with sticky session binding and failover.

## Endpoints

- `GET /health` — Health check, active `yt-dlp` version, `ffmpeg_installed`, `node_installed`, and `youtube_proxies_loaded` status
- `POST /api/extract` — Extracts metadata, direct CDN links, signed `/api/proxy` links, and signed `/api/merge` URLs (`X-API-Key` header required when `YTDLP_API_SECRET` is set)
- `GET /api/proxy?token=...` — Verifies HMAC-signed token and streams progressive/audio media through the exact proxy IP used during extraction
- `GET /api/merge?token=...` — Verifies HMAC-signed token, merges high-quality video + audio using FFmpeg, and streams the `.mp4` file

## Deploy on Railway (Nixpacks + FFmpeg + Node.js)

### Option 1: From this Monorepo
1. Create a **New Service** in your Railway project and connect this repository.
2. Go to **Settings → Source → Root Directory** and set it to `/ytdlp-backend`.
3. Railway will use `railway.json` (`builder: NIXPACKS`) and `nixpacks.toml` (`nixPkgs = ["...", "ffmpeg", "nodejs"]`) to install Python + FFmpeg + Node.js automatically.
   - Make sure **Builder** in Railway Service Settings is NOT manually locked to `Dockerfile`.
4. Add Environment Variables in Railway:
   - `YTDLP_API_SECRET`: Any strong secret string (must match `YTDLP_API_SECRET` in your Next.js app).
   - `YTDLP_YOUTUBE_PROXIES` *(optional)*: Override `youtube_proxies.txt` with comma/newline-separated proxies (`ip:port:user:pass` or `http://user:pass@ip:port`).
   - `YTDLP_COOKIES_B64` *(optional)*: Base64-encoded `cookies.txt` if needed.
5. Verify `https://your-ytdlp-backend.up.railway.app/health` returns `"ffmpeg_installed": true`, `"node_installed": true`, and `"youtube_enabled": true`.

### Option 2: As a Separate Repository / VPS (Docker)
Copy all files inside `/ytdlp-backend` to a separate GitHub repo or VPS and run:

```bash
docker build -t savevibe-ytdlp .
docker run -d -p 8000:8000 -e YTDLP_API_SECRET="your-secret" savevibe-ytdlp
```

## Connect to Next.js Frontend (Vercel / Railway)

Set these environment variables on your Next.js deployment:

```env
YTDLP_BACKEND_URL=https://your-ytdlp-backend.up.railway.app
YTDLP_API_SECRET=your-secret
```
