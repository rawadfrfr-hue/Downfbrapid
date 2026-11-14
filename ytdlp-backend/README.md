# SaveVibe `yt-dlp` Backend (FastAPI + FFmpeg)

Standalone FastAPI + `yt-dlp` + `FFmpeg` service for extracting and muxing media downloads for **Facebook**, **Instagram**, and **TikTok**.

- **Progressive streams** (TikTok, SD MP4, audio-only M4A) are returned as direct CDN URLs (0% server bandwidth).
- **High-quality DASH / adaptive streams** (Facebook & Instagram 720p/1080p/2K/4K where video and audio are separate streams) are automatically merged with **FFmpeg** via `/api/merge` so high-quality downloads always include audio.

## Endpoints

- `GET /health` — Health check, active `yt-dlp` version, and `ffmpeg_installed` status
- `POST /api/extract` — Extracts metadata, direct CDN links, and signed `/api/merge` URLs (`X-API-Key` header required when `YTDLP_API_SECRET` is set)
- `GET /api/merge?token=...` — Verifies HMAC-signed token, merges high-quality video + audio using FFmpeg, and streams the `.mp4` file

## Deploy on Railway (Nixpacks + FFmpeg)

### Option 1: From this Monorepo
1. Create a **New Service** in your Railway project and connect this repository.
2. Go to **Settings → Source → Root Directory** and set it to `/ytdlp-backend`.
3. Railway will use `railway.json` (`builder: NIXPACKS`) and `nixpacks.toml` (`nixPkgs = ["...", "ffmpeg"]`) to install Python + FFmpeg automatically.
   - Make sure **Builder** in Railway Service Settings is NOT manually locked to `Dockerfile`.
4. Add Environment Variables in Railway:
   - `YTDLP_API_SECRET`: Any strong secret string (must match `YTDLP_API_SECRET` in your Next.js app).
   - `YTDLP_COOKIES_B64` *(optional)*: Base64-encoded `cookies.txt` if Instagram requires login on datacenter IPs.
5. Verify `https://your-ytdlp-backend.up.railway.app/health` returns `"ffmpeg_installed": true`.

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
