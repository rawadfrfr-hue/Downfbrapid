# SaveVibe `yt-dlp` Backend (FastAPI)

Standalone FastAPI + `yt-dlp` service for extracting direct media download links for **Facebook**, **Instagram**, and **TikTok** with zero video bandwidth usage on the server.

## Endpoints

- `GET /health` — Health check & active `yt-dlp` version
- `POST /api/extract` — Extracts metadata and direct CDN links (`X-API-Key` header required when `YTDLP_API_SECRET` is set)

## Deploy on Railway

### Option 1: From this Monorepo
1. Create a **New Service** in your Railway project and connect this repository.
2. Go to **Settings → Source → Root Directory** and set it to `/ytdlp-backend`.
3. Railway will automatically detect `Dockerfile` and `railway.json`.
4. Add Environment Variables in Railway:
   - `YTDLP_API_SECRET`: Any strong secret string (must match `YTDLP_API_SECRET` in your Next.js app).
   - `YTDLP_COOKIES_B64` *(optional)*: Base64-encoded `cookies.txt` if Instagram requires login on datacenter IPs.
5. Copy the generated Railway public URL (e.g., `https://your-ytdlp-backend.up.railway.app`).

### Option 2: As a Separate Repository / VPS
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
