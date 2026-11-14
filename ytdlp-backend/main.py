import asyncio
import base64
import os
import re
from typing import Any, Optional

from cachetools import TTLCache
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import yt_dlp

app = FastAPI(
    title="SaveVibe yt-dlp Backend",
    description="Direct media link extractor for Facebook, Instagram, and TikTok using yt-dlp.",
    version="1.0.0",
)

# Optional CORS configuration (Next.js server calls this server-to-server,
# but CORS can also allow configured origins if needed)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

API_SECRET = os.getenv("YTDLP_API_SECRET", "").strip()
COOKIE_FILE_PATH = "/tmp/ytdlp_cookies.txt"

# In-memory cache (up to 500 extracted URLs cached for 10 minutes)
extract_cache: TTLCache[str, dict[str, Any]] = TTLCache(maxsize=500, ttl=600)


def setup_cookies_file() -> Optional[str]:
    """Write optional Netscape cookies from env vars to /tmp for yt-dlp."""
    b64_cookies = os.getenv("YTDLP_COOKIES_B64", "").strip()
    raw_cookies = os.getenv("YTDLP_COOKIES", "").strip()

    if b64_cookies:
        try:
            decoded = base64.b64decode(b64_cookies).decode("utf-8")
            with open(COOKIE_FILE_PATH, "w", encoding="utf-8") as f:
                f.write(decoded)
            return COOKIE_FILE_PATH
        except Exception as exc:
            print(f"[warn] Failed to decode YTDLP_COOKIES_B64: {exc}")

    if raw_cookies:
        try:
            with open(COOKIE_FILE_PATH, "w", encoding="utf-8") as f:
                f.write(raw_cookies)
            return COOKIE_FILE_PATH
        except Exception as exc:
            print(f"[warn] Failed to write YTDLP_COOKIES: {exc}")

    return None


ACTIVE_COOKIE_FILE = setup_cookies_file()


class ExtractRequest(BaseModel):
    url: HttpUrl
    platform: Optional[str] = None


def verify_api_key(x_api_key: Optional[str] = Header(default=None)) -> None:
    if API_SECRET and x_api_key != API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid API key.")


def detect_platform(url_str: str, fallback: Optional[str] = None) -> str:
    lower = url_str.lower()
    if any(domain in lower for domain in ("youtube.com", "youtu.be", "youtube-nocookie.com")):
        return "youtube"
    if any(domain in lower for domain in ("facebook.com", "fb.watch", "fb.gg", "fb.com")):
        return "facebook"
    if any(domain in lower for domain in ("instagram.com", "instagr.am")):
        return "instagram"
    if any(domain in lower for domain in ("tiktok.com", "vt.tiktok.com", "vm.tiktok.com")):
        return "tiktok"
    return (fallback or "unknown").lower()


def format_duration(seconds: Any) -> str:
    if seconds is None:
        return "Public Video"
    try:
        total = int(float(seconds))
        if total <= 0:
            return "Public Video"
        hours, remainder = divmod(total, 3600)
        mins, secs = divmod(remainder, 60)
        if hours > 0:
            return f"{hours}:{mins:02d}:{secs:02d}"
        return f"{mins}:{secs:02d}"
    except (ValueError, TypeError):
        return "Public Video"


def format_filesize(size_bytes: Any) -> Optional[str]:
    if not size_bytes or not isinstance(size_bytes, (int, float)) or size_bytes <= 0:
        return None
    mb = size_bytes / (1024 * 1024)
    if mb >= 1:
        return f"{mb:.1f} MB"
    kb = size_bytes / 1024
    return f"{kb:.0f} KB"


def is_direct_http_protocol(fmt: dict[str, Any]) -> bool:
    protocol = (fmt.get("protocol") or "").lower()
    url = (fmt.get("url") or "").lower()
    if not url.startswith(("http://", "https://")):
        return False
    # Exclude HLS/DASH playlists because direct browser download needs single progressive files
    if any(p in protocol for p in ("m3u8", "dash", "rtmp", "rtsp")):
        return False
    if ".m3u8" in url or ".mpd" in url:
        return False
    return True


def is_progressive_video(fmt: dict[str, Any]) -> bool:
    if not is_direct_http_protocol(fmt):
        return False
    vcodec = (fmt.get("vcodec") or "").lower()
    acodec = (fmt.get("acodec") or "").lower()
    # Must contain both video and audio so user never downloads a muted video
    has_video = vcodec != "none" and vcodec != ""
    has_audio = acodec != "none" and acodec != ""
    return has_video and has_audio


def is_audio_only(fmt: dict[str, Any]) -> bool:
    if not is_direct_http_protocol(fmt):
        return False
    vcodec = (fmt.get("vcodec") or "").lower()
    acodec = (fmt.get("acodec") or "").lower()
    return (vcodec == "none" or vcodec == "") and (acodec != "none" and acodec != "")


def extract_with_ytdlp(url_str: str, platform: str) -> dict[str, Any]:
    ydl_opts: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "socket_timeout": 20,
        "extract_flat": False,
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/126.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
    }

    if ACTIVE_COOKIE_FILE and os.path.exists(ACTIVE_COOKIE_FILE):
        ydl_opts["cookiefile"] = ACTIVE_COOKIE_FILE

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url_str, download=False)

    if not info:
        raise ValueError("Could not extract video information from this URL.")

    # Handle playlist/carousel wrapper if yt-dlp returns entries
    if "entries" in info and isinstance(info["entries"], list) and len(info["entries"]) > 0:
        first_entry = next((e for e in info["entries"] if e), None)
        if first_entry:
            info = first_entry

    formats = info.get("formats") or []

    # Fallback: some single-format responses put direct url directly on `info`
    if not formats and info.get("url"):
        formats = [info]

    progressive_formats = [f for f in formats if is_progressive_video(f)]
    audio_formats = [f for f in formats if is_audio_only(f)]

    # For TikTok, strongly prefer non-watermarked MP4 formats
    if platform == "tiktok":
        no_watermark = [
            f
            for f in progressive_formats
            if "watermark" not in (f.get("format_id") or "").lower()
            and "watermark" not in (f.get("format_note") or "").lower()
            and (f.get("ext") or "").lower() in ("mp4", "")
        ]
        if no_watermark:
            progressive_formats = no_watermark

    # If still empty, check if any direct mp4 format exists even when acodec metadata is missing
    if not progressive_formats:
        progressive_formats = [
            f
            for f in formats
            if is_direct_http_protocol(f)
            and (f.get("ext") or "").lower() == "mp4"
            and (f.get("vcodec") or "").lower() != "none"
        ]

    if not progressive_formats:
        raise ValueError(
            "No direct downloadable MP4 link found. The video may be private or require login."
        )

    # Sort progressive formats by height, then bitrate (prefer mp4)
    def sort_key(f: dict[str, Any]) -> tuple[int, int, float]:
        is_mp4 = 1 if (f.get("ext") or "").lower() == "mp4" else 0
        height = int(f.get("height") or 0)
        tbr = float(f.get("tbr") or 0.0)
        return (is_mp4, height, tbr)

    progressive_formats.sort(key=sort_key, reverse=True)

    # Deduplicate by height/resolution bucket
    seen_heights: set[int] = set()
    unique_videos: list[dict[str, Any]] = []
    for f in progressive_formats:
        h = int(f.get("height") or 0)
        if h > 0 and h in seen_heights:
            continue
        if h > 0:
            seen_heights.add(h)
        unique_videos.append(f)

    # Best audio format (prefer m4a/mp3)
    best_audio = None
    if audio_formats:
        audio_formats.sort(
            key=lambda f: (
                1 if (f.get("ext") or "").lower() in ("m4a", "mp3") else 0,
                float(f.get("abr") or f.get("tbr") or 0.0),
            ),
            reverse=True,
        )
        best_audio = audio_formats[0]

    hd_fmt = unique_videos[0]
    sd_fmt = unique_videos[1] if len(unique_videos) > 1 else None

    def make_quality_label(fmt: dict[str, Any], default_label: str) -> str:
        h = int(fmt.get("height") or 0)
        if h >= 1080:
            return f"{h}p Full HD"
        if h >= 720:
            return f"{h}p HD"
        if h >= 480:
            return f"{h}p SD"
        if h > 0:
            return f"{h}p"
        note = fmt.get("format_note")
        return str(note) if note else default_label

    platform_display = {
        "facebook": "Facebook",
        "instagram": "Instagram",
        "tiktok": "TikTok",
    }.get(platform, platform.capitalize())

    title = (info.get("title") or info.get("description") or f"{platform_display} Video").strip()
    title = re.sub(r"\s+", " ", title)[:160]

    author = (
        info.get("uploader")
        or info.get("channel")
        or info.get("creator")
        or info.get("uploader_id")
        or f"{platform_display} Creator"
    )
    if platform == "tiktok" and author and not str(author).startswith("@") and info.get("uploader_id"):
        author = f"@{info.get('uploader_id')}"

    thumbnail = info.get("thumbnail") or ""
    if not thumbnail and isinstance(info.get("thumbnails"), list) and info["thumbnails"]:
        thumbnail = info["thumbnails"][-1].get("url") or ""

    duration = format_duration(info.get("duration"))
    view_count = info.get("view_count")
    views = f"{int(view_count):,} views" if isinstance(view_count, (int, float)) and view_count > 0 else "Public Video"

    hd_url = hd_fmt["url"]
    hd_size = format_filesize(hd_fmt.get("filesize") or hd_fmt.get("filesize_approx")) or make_quality_label(hd_fmt, "HD Quality")
    hd_ext = (hd_fmt.get("ext") or "mp4").upper()

    quality_list: list[dict[str, Any]] = []
    if platform == "tiktok":
        quality_list.append(
            {
                "id": "hd",
                "quality": "Max Quality",
                "label": "Max Quality (No Watermark)",
                "sublabel": f"Watermark-Free • {hd_size}",
                "url": hd_url,
                "downloadUrl": hd_url,
                "qualityLabel": "Max Quality without watermark",
                "format": hd_ext,
                "badge": "NO WATERMARK",
            }
        )
    else:
        for idx, vfmt in enumerate(unique_videos[:4]):
            h = int(vfmt.get("height") or 0)
            q_id = f"{h}p" if h > 0 else ("hd" if idx == 0 else f"sd_{idx}")
            q_title = make_quality_label(vfmt, "High Quality" if idx == 0 else "Standard Quality")
            v_ext = (vfmt.get("ext") or "mp4").upper()
            v_size = format_filesize(vfmt.get("filesize") or vfmt.get("filesize_approx")) or "Direct MP4"
            quality_list.append(
                {
                    "id": q_id,
                    "quality": q_title,
                    "label": f"{v_ext} - {q_title}",
                    "sublabel": f"{v_size} • Audio Included",
                    "url": vfmt["url"],
                    "downloadUrl": vfmt["url"],
                    "qualityLabel": f"{q_title} Video",
                    "format": v_ext,
                    "badge": q_title,
                }
            )

        if best_audio:
            a_ext = (best_audio.get("ext") or "m4a").upper()
            a_size = format_filesize(best_audio.get("filesize") or best_audio.get("filesize_approx")) or "Direct Audio"
            quality_list.append(
                {
                    "id": "audio",
                    "quality": "Audio",
                    "label": f"{a_ext} - Audio Only",
                    "sublabel": f"{a_size} • High Quality Audio",
                    "url": best_audio["url"],
                    "downloadUrl": best_audio["url"],
                    "qualityLabel": f"{a_ext} Audio Only",
                    "format": a_ext,
                    "badge": "AUDIO",
                }
            )

    qualities: dict[str, Any] = {
        "hd": {
            "quality": "Max Quality without watermark" if platform == "tiktok" else make_quality_label(hd_fmt, "HD"),
            "url": hd_url,
            "downloadUrl": hd_url,
            "size": "Max Quality • No Watermark" if platform == "tiktok" else hd_size,
            "format": hd_ext,
        }
    }

    if sd_fmt and platform != "tiktok":
        sd_size = format_filesize(sd_fmt.get("filesize") or sd_fmt.get("filesize_approx")) or make_quality_label(sd_fmt, "SD")
        qualities["sd"] = {
            "quality": make_quality_label(sd_fmt, "SD"),
            "url": sd_fmt["url"],
            "downloadUrl": sd_fmt["url"],
            "size": sd_size,
            "format": (sd_fmt.get("ext") or "mp4").upper(),
        }

    if best_audio and platform != "tiktok":
        a_ext = (best_audio.get("ext") or "m4a").upper()
        a_size = format_filesize(best_audio.get("filesize") or best_audio.get("filesize_approx")) or "Audio Track"
        qualities["audio"] = {
            "quality": f"{a_ext} Audio",
            "url": best_audio["url"],
            "downloadUrl": best_audio["url"],
            "size": a_size,
            "format": a_ext,
        }

    return {
        "id": f"{platform}_{info.get('id') or abs(hash(url_str))}",
        "originalUrl": url_str,
        "title": title,
        "author": str(author),
        "views": views,
        "duration": duration,
        "thumbnail": thumbnail,
        "platform": platform_display,
        "isSingleQuality": platform == "tiktok",
        "qualityList": quality_list,
        "qualities": qualities,
    }


@app.get("/")
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "savevibe-ytdlp-backend",
        "yt_dlp_version": yt_dlp.version.__version__,
        "cookies_loaded": bool(ACTIVE_COOKIE_FILE and os.path.exists(ACTIVE_COOKIE_FILE)),
    }


@app.post("/api/extract", dependencies=[Depends(verify_api_key)])
async def extract_video(payload: ExtractRequest):
    url_str = str(payload.url).strip()
    platform = detect_platform(url_str, payload.platform)

    if platform == "youtube":
        raise HTTPException(
            status_code=400,
            detail="YouTube downloads are currently unavailable. Please use Facebook, Instagram, or TikTok.",
        )

    if platform not in ("facebook", "instagram", "tiktok"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported URL. Please enter a valid Facebook, Instagram, or TikTok video link.",
        )

    cache_key = f"{platform}:{url_str}"
    if cache_key in extract_cache:
        return {"success": True, "cached": True, "data": extract_cache[cache_key]}

    try:
        data = await asyncio.to_thread(extract_with_ytdlp, url_str, platform)
        extract_cache[cache_key] = data
        return {"success": True, "cached": False, "data": data}
    except yt_dlp.utils.DownloadError as exc:
        msg = str(exc)
        if "Private" in msg or "login" in msg.lower() or "Sign in" in msg:
            raise HTTPException(
                status_code=422,
                detail=f"This {platform.capitalize()} video is private or requires login.",
            )
        raise HTTPException(
            status_code=422,
            detail=f"Unable to extract {platform.capitalize()} video link. Please verify the URL is public and valid.",
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(exc)}")
