import asyncio
import base64
import concurrent.futures
import hashlib
import hmac
import json
import os
import re
import secrets
import shutil
import subprocess
import threading
import time
from typing import Any, Optional
from urllib.parse import parse_qsl, quote, urlencode, urlparse, urlunparse

from cachetools import TTLCache
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response, StreamingResponse
import httpx
from pydantic import BaseModel, HttpUrl
from starlette.background import BackgroundTask
import yt_dlp

app = FastAPI(
    title="SaveVibe yt-dlp Backend",
    description="Direct media link extractor, YouTube proxy streamer & FFmpeg muxer for Facebook, YouTube, Instagram, and TikTok.",
    version="1.3.0",
)

# Optional CORS configuration (Next.js server calls this server-to-server,
# and browser calls /api/merge or /api/proxy directly)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "Content-Range", "Accept-Ranges"],
)

API_SECRET = os.getenv("YTDLP_API_SECRET", "").strip()
PREFER_CLIENT_MERGE = os.getenv("PREFER_CLIENT_MERGE", "true").strip().lower() not in ("0", "false", "no")
SIGNING_SECRET = (API_SECRET or secrets.token_hex(32)).encode("utf-8")
COOKIE_FILE_PATH = "/tmp/ytdlp_cookies.txt"
MERGED_DIR = "/tmp/savevibe_merged"
FFMPEG_PATH = shutil.which("ffmpeg")
FFPROBE_PATH = shutil.which("ffprobe") or (
    os.path.join(os.path.dirname(FFMPEG_PATH), "ffprobe")
    if FFMPEG_PATH and os.path.exists(os.path.join(os.path.dirname(FFMPEG_PATH), "ffprobe"))
    else None
)
NODE_PATH = shutil.which("node") or shutil.which("nodejs")
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0.0.0 Safari/537.36"
)

# In-memory cache (up to 500 extracted URLs cached for 15 minutes)
extract_cache: TTLCache[str, dict[str, Any]] = TTLCache(maxsize=500, ttl=900)
extract_locks: dict[str, asyncio.Lock] = {}
# Pending FFmpeg merge jobs cached for 30 minutes
merge_jobs: TTLCache[str, dict[str, Any]] = TTLCache(maxsize=1000, ttl=1800)
merge_locks: dict[str, asyncio.Lock] = {}
# Pending YouTube proxy streaming jobs cached for 30 minutes
proxy_jobs: TTLCache[str, dict[str, Any]] = TTLCache(maxsize=2000, ttl=1800)

STRIP_QUERY_PARAMS = {
    "fbclid",
    "mibextid",
    "igsh",
    "igshid",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "rdid",
    "share_url",
    "ref",
    "refsrc",
}


def canonicalize_url(url_str: str) -> str:
    try:
        parsed = urlparse(url_str.strip())
        kept_params = [
            (k, v)
            for k, v in parse_qsl(parsed.query, keep_blank_values=True)
            if k.lower() not in STRIP_QUERY_PARAMS and not k.lower().startswith("utm_")
        ]
        clean_path = parsed.path.rstrip("/") or "/"
        return urlunparse(
            (
                parsed.scheme.lower(),
                parsed.netloc.lower(),
                clean_path,
                parsed.params,
                urlencode(kept_params, doseq=True),
                "",
            )
        )
    except Exception:
        return url_str.strip()


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

YOUTUBE_PROXY_FILE = os.getenv(
    "YTDLP_YOUTUBE_PROXY_FILE",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "youtube_proxies.txt"),
).strip()


def parse_proxy_entry(raw: str) -> Optional[str]:
    entry = raw.strip()
    if not entry or entry.startswith("#"):
        return None
    if entry.startswith(("http://", "https://", "socks5://", "socks5h://", "socks4://")):
        return entry
    parts = entry.split(":")
    if len(parts) == 4:
        host, port, user, password = parts
        return f"http://{quote(user, safe='')}:{quote(password, safe='')}@{host}:{port}"
    if len(parts) == 2:
        host, port = parts
        return f"http://{host}:{port}"
    return None


def load_youtube_proxies() -> list[str]:
    raw_env = (
        os.getenv("YTDLP_YOUTUBE_PROXIES", "").strip()
        or os.getenv("YTDLP_PROXY", "").strip()
    )
    entries: list[str] = []
    if raw_env:
        entries = re.split(r"[\s,;]+", raw_env)
    elif YOUTUBE_PROXY_FILE and os.path.exists(YOUTUBE_PROXY_FILE):
        try:
            with open(YOUTUBE_PROXY_FILE, "r", encoding="utf-8") as f:
                entries = re.split(r"[\s,;]+", f.read())
        except Exception as exc:
            print(f"[warn] Failed to read YouTube proxy file: {exc}")

    parsed: list[str] = []
    seen: set[str] = set()
    for item in entries:
        proxy_url = parse_proxy_entry(item)
        if proxy_url and proxy_url not in seen:
            seen.add(proxy_url)
            parsed.append(proxy_url)
    return parsed


YOUTUBE_PROXIES = load_youtube_proxies()
_youtube_proxy_lock = threading.Lock()
_youtube_proxy_idx = 0


def get_youtube_proxy_candidates(max_tries: int = 4) -> list[Optional[str]]:
    global _youtube_proxy_idx
    if not YOUTUBE_PROXIES:
        return [None]
    count = min(max_tries, len(YOUTUBE_PROXIES))
    with _youtube_proxy_lock:
        start = _youtube_proxy_idx % len(YOUTUBE_PROXIES)
        _youtube_proxy_idx = (_youtube_proxy_idx + 1) % len(YOUTUBE_PROXIES)
    return [YOUTUBE_PROXIES[(start + offset) % len(YOUTUBE_PROXIES)] for offset in range(count)]


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


def sanitize_filename(name: str, suffix: str = "", ext: str = "mp4") -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", name).strip("._")
    cleaned = (cleaned or "SaveVibe_Video")[:45]
    safe_ext = re.sub(r"[^a-z0-9]", "", ext.lower()) or "mp4"
    if suffix:
        return f"{cleaned}_{suffix}.{safe_ext}"
    return f"{cleaned}.{safe_ext}"


def sign_job_id(job_id: str) -> str:
    sig = hmac.new(SIGNING_SECRET, job_id.encode("utf-8"), hashlib.sha256).hexdigest()[:24]
    return f"{job_id}.{sig}"


def verify_signed_token(token: str, store: TTLCache[str, dict[str, Any]]) -> str:
    if "." not in token:
        raise HTTPException(status_code=403, detail="Invalid download token.")
    job_id, provided_sig = token.split(".", 1)
    expected_sig = hmac.new(SIGNING_SECRET, job_id.encode("utf-8"), hashlib.sha256).hexdigest()[:24]
    if not hmac.compare_digest(provided_sig, expected_sig):
        raise HTTPException(status_code=403, detail="Invalid or tampered download token.")
    if job_id not in store:
        raise HTTPException(
            status_code=410,
            detail="Download link expired. Please fetch the video link again.",
        )
    return job_id


def register_merge_job(
    *,
    original_url: str,
    title: str,
    height: int,
    platform: str,
    video_fmt: Optional[dict[str, Any]],
    audio_fmt: Optional[dict[str, Any]],
    proxy_url: Optional[str] = None,
    ytdlp_format_spec: Optional[str] = None,
) -> str:
    v_id = str(video_fmt.get("format_id") or "") if video_fmt else ""
    a_id = str(audio_fmt.get("format_id") or "") if audio_fmt else ""
    seed = f"{original_url}|{height}|{v_id}|{a_id}|{proxy_url or ''}|{ytdlp_format_spec or ''}"
    job_id = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:20]

    merge_jobs[job_id] = {
        "original_url": original_url,
        "title": title,
        "height": height,
        "platform": platform,
        "proxy_url": proxy_url,
        "video_url": video_fmt.get("url") if video_fmt else None,
        "audio_url": audio_fmt.get("url") if audio_fmt else None,
        "video_protocol": (video_fmt.get("protocol") or "").lower() if video_fmt else "",
        "audio_protocol": (audio_fmt.get("protocol") or "").lower() if audio_fmt else "",
        "video_fmt_id": v_id,
        "audio_fmt_id": a_id,
        "vcodec": (video_fmt.get("vcodec") or "").lower() if video_fmt else "",
        "acodec": (audio_fmt.get("acodec") or "").lower() if audio_fmt else "",
        "ytdlp_format_spec": ytdlp_format_spec,
        "created_at": time.time(),
    }
    return sign_job_id(job_id)


def register_proxy_job(
    *,
    media_url: str,
    title: str,
    ext: str,
    suffix: str,
    proxy_url: Optional[str],
    referer: Optional[str] = None,
) -> str:
    seed = f"proxy|{media_url}|{suffix}|{proxy_url or ''}"
    job_id = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:20]
    proxy_jobs[job_id] = {
        "media_url": media_url,
        "title": title,
        "ext": ext,
        "suffix": suffix,
        "proxy_url": proxy_url,
        "referer": referer,
        "created_at": time.time(),
    }
    return sign_job_id(job_id)


def cleanup_old_merged_files(max_age_seconds: int = 180, max_files: int = 3) -> None:
    if not os.path.isdir(MERGED_DIR):
        return
    now = time.time()
    entries: list[tuple[float, str]] = []
    for fname in os.listdir(MERGED_DIR):
        fpath = os.path.join(MERGED_DIR, fname)
        if not os.path.isfile(fpath):
            continue
        try:
            mtime = os.path.getmtime(fpath)
            if now - mtime > max_age_seconds:
                os.remove(fpath)
            else:
                entries.append((mtime, fpath))
        except OSError:
            pass

    if len(entries) > max_files:
        entries.sort(key=lambda item: item[0])
        for _, old_path in entries[: len(entries) - max_files]:
            try:
                os.remove(old_path)
            except OSError:
                pass


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


def is_confirmed_progressive(fmt: dict[str, Any]) -> bool:
    if not is_direct_http_protocol(fmt):
        return False
    vcodec = (fmt.get("vcodec") or "").lower()
    acodec = (fmt.get("acodec") or "").lower()
    # Must explicitly contain both video and audio so user never downloads a muted video
    has_video = vcodec not in ("", "none")
    has_audio = acodec not in ("", "none")
    return has_video and has_audio


def is_video_only_stream(fmt: dict[str, Any], allow_dash_hls: bool = False) -> bool:
    url = (fmt.get("url") or "").lower()
    if not url.startswith(("http://", "https://")):
        return False
    if not allow_dash_hls and not is_direct_http_protocol(fmt):
        return False
    vcodec = (fmt.get("vcodec") or "").lower()
    acodec = (fmt.get("acodec") or "").lower()
    return vcodec not in ("", "none") and acodec in ("", "none")


def is_audio_only(fmt: dict[str, Any], allow_dash_hls: bool = False) -> bool:
    url = (fmt.get("url") or "").lower()
    if not url.startswith(("http://", "https://")):
        return False
    if not allow_dash_hls and not is_direct_http_protocol(fmt):
        return False
    vcodec = (fmt.get("vcodec") or "").lower()
    acodec = (fmt.get("acodec") or "").lower()
    return vcodec in ("", "none") and acodec not in ("", "none")


def is_h264_codec(vcodec: str) -> bool:
    c = vcodec.lower()
    return any(k in c for k in ("avc", "h264"))


def video_codec_score(vcodec: str) -> int:
    c = vcodec.lower()
    if any(k in c for k in ("avc", "h264")):
        return 4
    if any(k in c for k in ("hevc", "h265", "hvc1", "hev1", "mp4v")):
        return 3
    if any(k in c for k in ("av01", "av1")):
        return 2
    if any(k in c for k in ("vp9", "vp09", "vp8")):
        return 1
    return 0


def audio_codec_score(acodec: str) -> int:
    c = acodec.lower()
    if any(k in c for k in ("mp4a", "aac")):
        return 4
    if "mp3" in c:
        return 3
    if any(k in c for k in ("opus", "vorbis")):
        return 2
    return 0


def is_webm_video(fmt: dict[str, Any]) -> bool:
    ext = (fmt.get("ext") or "").lower()
    vcodec = (fmt.get("vcodec") or "").lower()
    return ext == "webm" or (any(k in vcodec for k in ("vp8", "vp9", "vp09")) and ext != "mp4")


def is_webm_audio(fmt: dict[str, Any]) -> bool:
    ext = (fmt.get("ext") or "").lower()
    acodec = (fmt.get("acodec") or "").lower()
    return ext == "webm" or (any(k in acodec for k in ("opus", "vorbis")) and ext not in ("mp4", "m4a", "aac"))


def is_mp4_compatible_audio(fmt: dict[str, Any]) -> bool:
    ext = (fmt.get("ext") or "").lower()
    acodec = (fmt.get("acodec") or "").lower()
    return any(k in acodec for k in ("mp4a", "aac", "mp3")) or ext in ("m4a", "mp4", "aac", "mp3")


def extract_with_ytdlp(url_str: str, platform: str, proxy_url: Optional[str] = None) -> dict[str, Any]:
    ydl_opts: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "socket_timeout": 15,
        "retries": 2,
        "extractor_retries": 2,
        "nocheckcertificate": True,
        "geo_bypass": True,
        "writesubtitles": False,
        "writeautomaticsub": False,
        "writethumbnail": False,
        "writeinfojson": False,
        "getcomments": False,
        "extract_flat": False,
        "format_sort": ["vcodec:h264", "acodec:aac", "ext:mp4:m4a"],
        "http_headers": {
            "User-Agent": DEFAULT_USER_AGENT,
            "Accept-Language": "en-US,en;q=0.9",
        },
    }

    # Only use residential proxy for YouTube; Facebook/Instagram/TikTok stay direct
    if platform == "youtube" and proxy_url:
        ydl_opts["proxy"] = proxy_url

    if NODE_PATH:
        ydl_opts["js_runtimes"] = {"node": {}}

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

    progressive_formats = [f for f in formats if is_confirmed_progressive(f)]
    direct_audio_formats = [f for f in formats if is_audio_only(f, allow_dash_hls=False)]
    any_audio_formats = direct_audio_formats or [f for f in formats if is_audio_only(f, allow_dash_hls=True)]

    # Direct HTTP video-only streams (Facebook/Instagram 720p/1080p/2K/4K DASH streams)
    direct_video_only_formats = [f for f in formats if is_video_only_stream(f, allow_dash_hls=False)]
    video_only_formats = list(direct_video_only_formats)
    if not video_only_formats and FFMPEG_PATH:
        video_only_formats = [f for f in formats if is_video_only_stream(f, allow_dash_hls=True)]

    # For TikTok, exclude watermarked formats (including download_addr) and prefer MP4
    if platform == "tiktok":
        no_watermark = [
            f
            for f in progressive_formats
            if "watermark" not in (f.get("format_id") or "").lower()
            and "watermark" not in (f.get("format_note") or "").lower()
            and not (f.get("format_id") or "").lower().startswith("download")
            and (f.get("ext") or "").lower() in ("mp4", "")
        ]
        if no_watermark:
            progressive_formats = no_watermark

    # Only if there are NO confirmed progressive formats AND NO separate audio streams
    # (e.g., single-file extractor fallback where acodec metadata wasn't populated)
    if not progressive_formats and not any_audio_formats:
        progressive_formats = [
            f
            for f in formats
            if is_direct_http_protocol(f)
            and (f.get("ext") or "").lower() == "mp4"
            and (f.get("vcodec") or "").lower() != "none"
            and (f.get("acodec") or "").lower() != "none"
        ]

    def audio_sort_key(f: dict[str, Any]) -> tuple[int, int, float]:
        a_score = audio_codec_score(f.get("acodec") or "")
        ext = (f.get("ext") or "").lower()
        is_m4a_mp4 = 1 if ext in ("m4a", "mp4", "aac") else 0
        abr = float(f.get("abr") or f.get("tbr") or 0.0)
        return (a_score, is_m4a_mp4, abr)

    # Best audio formats (prefer AAC/MP4A in m4a/mp4 for MP4 container, and keep WebM/Opus pair if video is WebM)
    best_direct_audio = None
    best_direct_mp4_audio = None
    best_direct_webm_audio = None
    if direct_audio_formats:
        direct_audio_formats.sort(key=audio_sort_key, reverse=True)
        best_direct_audio = direct_audio_formats[0]
        best_direct_mp4_audio = next(
            (f for f in direct_audio_formats if is_mp4_compatible_audio(f)),
            None,
        )
        best_direct_webm_audio = next(
            (f for f in direct_audio_formats if is_webm_audio(f)),
            None,
        )

    best_merge_audio = best_direct_mp4_audio or best_direct_audio
    if not best_merge_audio and any_audio_formats:
        any_audio_formats.sort(key=audio_sort_key, reverse=True)
        best_merge_audio = next(
            (f for f in any_audio_formats if is_mp4_compatible_audio(f)),
            any_audio_formats[0],
        )

    def snap_standard_height(val: int) -> int:
        for std in (2160, 1440, 1080, 720, 540, 480, 360, 240, 144):
            if abs(val - std) <= 12:
                return std
        return val

    def effective_height(fmt: dict[str, Any]) -> int:
        w = int(fmt.get("width") or 0)
        h = int(fmt.get("height") or 0)
        if w > 0 and h > 0:
            if w >= 3840 and h >= 1500:
                return max(2160, snap_standard_height(min(w, h)))
            if w >= 2560 and h >= 1000:
                return max(1440, snap_standard_height(min(w, h)))
            if w >= 1920 and h >= 800:
                return max(1080, snap_standard_height(min(w, h)))
            if w >= 1280 and h >= 500 and w > h:
                return max(720, snap_standard_height(min(w, h)))
            return snap_standard_height(min(w, h))
        return snap_standard_height(h) if h > 0 else 0

    def sort_key(f: dict[str, Any]) -> tuple[int, int, int, int, float]:
        height = effective_height(f)
        vcodec = f.get("vcodec") or ""
        h264 = 1 if is_h264_codec(vcodec) else 0
        is_mp4 = 1 if (f.get("ext") or "").lower() == "mp4" else 0
        v_score = video_codec_score(vcodec)
        tbr = float(f.get("tbr") or 0.0)
        return (height, h264, is_mp4, v_score, tbr)

    progressive_formats.sort(key=sort_key, reverse=True)
    video_only_formats.sort(key=sort_key, reverse=True)

    platform_display = {
        "facebook": "Facebook",
        "youtube": "YouTube",
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
    views = (
        f"{int(view_count):,} views"
        if isinstance(view_count, (int, float)) and view_count > 0
        else "Public Video"
    )

    def make_quality_label(fmt: dict[str, Any], default_label: str, eff_h: Optional[int] = None) -> str:
        h = eff_h if eff_h is not None else effective_height(fmt)
        if h >= 2160:
            return f"{h}p 4K UHD"
        if h >= 1440:
            return f"{h}p 2K QHD"
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

    # Build deduplicated video candidates by actual video resolution:
    # 1. Prefer confirmed progressive H.264/MP4 format at a given height (instant direct download, already has audio)
    # 2. For resolutions that only exist as video-only + separate audio:
    #    - When PREFER_CLIENT_MERGE is enabled (default), prefer client-side browser merging (ffmpeg.wasm)
    #      for all direct HTTP streams (Facebook, Instagram, TikTok, and proxied YouTube) so Railway does not
    #      download/store/transcode video files in RAM.
    #    - Fall back to server FFmpeg (/api/merge) only for non-direct HLS/DASH streams (or when PREFER_CLIENT_MERGE=false).
    candidates: list[dict[str, Any]] = []
    seen_heights: set[int] = set()

    for f in progressive_formats:
        h = effective_height(f)
        if h > 0 and h in seen_heights:
            continue
        if h > 0:
            seen_heights.add(h)
        candidates.append({"fmt": f, "eff_height": h, "requires_merge": False, "client_merge": False})

    def append_client_merge_candidates() -> None:
        if not best_direct_audio:
            return
        for f in direct_video_only_formats:
            h = effective_height(f)
            if h > 0 and h in seen_heights:
                continue
            if h > 0:
                seen_heights.add(h)
            elif len(candidates) > 0:
                continue
            paired_audio = (
                (best_direct_webm_audio or best_direct_audio)
                if is_webm_video(f)
                else (best_direct_mp4_audio or best_direct_audio)
            )
            candidates.append(
                {
                    "fmt": f,
                    "eff_height": h,
                    "audio_fmt": paired_audio,
                    "requires_merge": True,
                    "client_merge": True,
                }
            )

    def append_server_merge_candidates() -> None:
        if not (FFMPEG_PATH and best_merge_audio):
            return
        for f in video_only_formats:
            h = effective_height(f)
            if h > 0 and h in seen_heights:
                continue
            if h > 0:
                seen_heights.add(h)
            elif len(candidates) > 0:
                continue
            candidates.append(
                {
                    "fmt": f,
                    "eff_height": h,
                    "audio_fmt": best_merge_audio,
                    "requires_merge": True,
                    "client_merge": False,
                }
            )

    if PREFER_CLIENT_MERGE:
        append_client_merge_candidates()
        append_server_merge_candidates()
    else:
        append_server_merge_candidates()
        if not FFMPEG_PATH:
            append_client_merge_candidates()

    # Fallback: if no progressive and no paired video+audio candidates, try generic yt-dlp+ffmpeg HLS/DASH merge
    if not candidates and FFMPEG_PATH and formats:
        highest = max(
            (int(f.get("height") or 0) for f in formats if (f.get("vcodec") or "").lower() != "none"),
            default=0,
        )
        token = register_merge_job(
            original_url=url_str,
            title=title,
            height=highest,
            platform=platform,
            video_fmt=None,
            audio_fmt=None,
            proxy_url=proxy_url if platform == "youtube" else None,
            ytdlp_format_spec="bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
        )
        candidates.append(
            {
                "fmt": {
                    "height": highest,
                    "ext": "mp4",
                    "url": f"/api/merge?token={token}&dl=0",
                    "download_url": f"/api/merge?token={token}&dl=1",
                },
                "requires_merge": True,
                "client_merge": False,
                "synthetic": True,
            }
        )

    if not candidates:
        if video_only_formats and not best_direct_audio and not FFMPEG_PATH:
            raise ValueError(
                "No direct audio stream found for client-side merging, and server FFmpeg is unavailable."
            )
        raise ValueError(
            "No direct downloadable MP4 link found. The video may be private or require login."
        )

    # Sort all final candidates highest resolution first
    candidates.sort(
        key=lambda item: (
            int(item.get("eff_height") if item.get("eff_height") is not None else effective_height(item["fmt"])),
            0 if item["requires_merge"] else 1,
            float(item["fmt"].get("tbr") or 0.0),
        ),
        reverse=True,
    )

    yt_prog_preview_url: Optional[str] = None
    if platform == "youtube" and progressive_formats:
        yt_prog = progressive_formats[0]
        yt_prog_token = register_proxy_job(
            media_url=yt_prog["url"],
            title=title,
            ext=(yt_prog.get("ext") or "mp4").lower(),
            suffix="preview",
            proxy_url=proxy_url,
            referer="https://www.youtube.com/",
        )
        yt_prog_preview_url = f"/api/proxy?token={yt_prog_token}&dl=0"

    best_progressive_preview = yt_prog_preview_url or (progressive_formats[0]["url"] if progressive_formats else None)

    # Materialize final URLs (direct CDN / client-side merge pair / fallback server /api/merge)
    resolved_videos: list[dict[str, Any]] = []
    for item in candidates:
        vfmt = item["fmt"]
        afmt = item.get("audio_fmt") or best_merge_audio
        h = int(item.get("eff_height") if item.get("eff_height") is not None else effective_height(vfmt))
        is_client_merge = bool(item.get("client_merge"))

        if item.get("synthetic"):
            preview_url = vfmt["url"]
            download_url = vfmt["download_url"]
            video_url = None
            audio_url = None
            vcodec = ""
            acodec = ""
            video_ext = "mp4"
            audio_ext = "m4a"
            est_size = None
            ext = "MP4"
        elif is_client_merge and afmt:
            raw_v_ext = (vfmt.get("ext") or "mp4").lower()
            raw_a_ext = (afmt.get("ext") or "m4a").lower()
            if platform == "youtube":
                v_token = register_proxy_job(
                    media_url=vfmt["url"],
                    title=title,
                    ext=raw_v_ext,
                    suffix=f"{h}p_video" if h > 0 else "video",
                    proxy_url=proxy_url,
                    referer="https://www.youtube.com/",
                )
                a_token = register_proxy_job(
                    media_url=afmt["url"],
                    title=title,
                    ext=raw_a_ext,
                    suffix="audio",
                    proxy_url=proxy_url,
                    referer="https://www.youtube.com/",
                )
                video_url = f"/api/proxy?token={v_token}&dl=0"
                audio_url = f"/api/proxy?token={a_token}&dl=0"
            else:
                video_url = vfmt["url"]
                audio_url = afmt["url"]
            preview_url = best_progressive_preview or video_url
            download_url = video_url
            vcodec = (vfmt.get("vcodec") or "").lower()
            acodec = (afmt.get("acodec") or "").lower()
            video_ext = raw_v_ext
            audio_ext = raw_a_ext
            v_bytes = vfmt.get("filesize") or vfmt.get("filesize_approx") or 0
            a_bytes = afmt.get("filesize") or afmt.get("filesize_approx") or 0
            est_size = format_filesize(v_bytes + a_bytes) if (v_bytes and a_bytes) else format_filesize(v_bytes)
            ext = "WEBM" if (is_webm_video(vfmt) and is_webm_audio(afmt)) else "MP4"
        elif item["requires_merge"]:
            token = register_merge_job(
                original_url=url_str,
                title=title,
                height=h,
                platform=platform,
                video_fmt=vfmt,
                audio_fmt=afmt,
                proxy_url=proxy_url if platform == "youtube" else None,
            )
            preview_url = f"/api/merge?token={token}&dl=0"
            download_url = f"/api/merge?token={token}&dl=1"
            video_url = None
            audio_url = None
            vcodec = (vfmt.get("vcodec") or "").lower()
            acodec = (afmt.get("acodec") or "").lower() if afmt else ""
            video_ext = (vfmt.get("ext") or "mp4").lower()
            audio_ext = (afmt.get("ext") or "m4a").lower() if afmt else "m4a"
            v_bytes = vfmt.get("filesize") or vfmt.get("filesize_approx") or 0
            a_bytes = (afmt.get("filesize") or afmt.get("filesize_approx") or 0) if afmt else 0
            est_size = format_filesize(v_bytes + a_bytes) if (v_bytes and a_bytes) else format_filesize(v_bytes)
            ext = "MP4"
        else:
            raw_ext = (vfmt.get("ext") or "mp4").lower()
            if platform == "youtube":
                p_token = register_proxy_job(
                    media_url=vfmt["url"],
                    title=title,
                    ext=raw_ext,
                    suffix=f"{h}p" if h > 0 else "SD",
                    proxy_url=proxy_url,
                    referer="https://www.youtube.com/",
                )
                preview_url = f"/api/proxy?token={p_token}&dl=0"
                download_url = f"/api/proxy?token={p_token}&dl=1"
            else:
                preview_url = vfmt["url"]
                download_url = vfmt["url"]
            video_url = preview_url
            audio_url = None
            vcodec = (vfmt.get("vcodec") or "").lower()
            acodec = (vfmt.get("acodec") or "").lower()
            video_ext = raw_ext
            audio_ext = ""
            est_size = format_filesize(vfmt.get("filesize") or vfmt.get("filesize_approx"))
            ext = raw_ext.upper()

        resolved_videos.append(
            {
                "fmt": vfmt,
                "height": h,
                "requires_merge": item["requires_merge"],
                "requires_client_merge": is_client_merge,
                "preview_url": preview_url,
                "download_url": download_url,
                "video_url": video_url,
                "audio_url": audio_url,
                "vcodec": vcodec,
                "acodec": acodec,
                "video_ext": video_ext,
                "audio_ext": audio_ext,
                "size": est_size,
                "ext": ext,
            }
        )

    hd_entry = resolved_videos[0]
    sd_entry = (
        resolved_videos[-1]
        if platform == "tiktok" and len(resolved_videos) > 1
        else (resolved_videos[1] if len(resolved_videos) > 1 else None)
    )

    hd_label = make_quality_label(hd_entry["fmt"], "HD Quality", hd_entry["height"])
    hd_size = hd_entry["size"] or hd_label

    def build_quality_payload(entry: dict[str, Any], q_title: str) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "quality": q_title,
            "url": entry["preview_url"],
            "downloadUrl": entry["download_url"],
            "size": entry["size"] or q_title,
            "format": entry["ext"],
            "requiresClientMerge": entry["requires_client_merge"],
        }
        if entry["requires_client_merge"] and entry["video_url"] and entry["audio_url"]:
            payload.update(
                {
                    "videoUrl": entry["video_url"],
                    "audioUrl": entry["audio_url"],
                    "vcodec": entry["vcodec"],
                    "acodec": entry["acodec"],
                    "videoExt": entry["video_ext"],
                    "audioExt": entry["audio_ext"],
                }
            )
        return payload

    quality_list: list[dict[str, Any]] = []
    if platform == "tiktok":
        sd_target = sd_entry or hd_entry
        sd_label = make_quality_label(sd_target["fmt"], "Standard Quality")
        sd_size = sd_target["size"] or sd_label

        quality_list.extend(
            [
                {
                    "id": "sd",
                    "quality": "Standard quality (without watermark)",
                    "label": "Standard quality (without watermark)",
                    "sublabel": f"Watermark-Free • {sd_size}",
                    "url": sd_target["preview_url"],
                    "downloadUrl": sd_target["download_url"],
                    "qualityLabel": "Standard quality (without watermark)",
                    "format": sd_target["ext"],
                    "badge": "NO WATERMARK",
                    "requiresClientMerge": sd_target["requires_client_merge"],
                    "videoUrl": sd_target["video_url"],
                    "audioUrl": sd_target["audio_url"],
                    "vcodec": sd_target["vcodec"],
                    "acodec": sd_target["acodec"],
                    "videoExt": sd_target["video_ext"],
                    "audioExt": sd_target["audio_ext"],
                },
                {
                    "id": "hd",
                    "quality": "High quality (without watermark)",
                    "label": "High quality (without watermark)",
                    "sublabel": f"Watermark-Free • {hd_size}",
                    "url": hd_entry["preview_url"],
                    "downloadUrl": hd_entry["download_url"],
                    "qualityLabel": "High quality (without watermark)",
                    "format": hd_entry["ext"],
                    "badge": "HD • NO WATERMARK",
                    "requiresClientMerge": hd_entry["requires_client_merge"],
                    "videoUrl": hd_entry["video_url"],
                    "audioUrl": hd_entry["audio_url"],
                    "vcodec": hd_entry["vcodec"],
                    "acodec": hd_entry["acodec"],
                    "videoExt": hd_entry["video_ext"],
                    "audioExt": hd_entry["audio_ext"],
                },
            ]
        )
    else:
        # Both Facebook and Instagram: strictly reflect the exact resolutions the video supports,
        # sorted highest supported quality down to lowest (never fabricating unsupported resolutions).
        for idx, entry in enumerate(resolved_videos[:6]):
            h = entry["height"]
            q_id = f"{h}p" if h > 0 else ("hd" if idx == 0 else f"sd_{idx}")
            q_title = make_quality_label(
                entry["fmt"],
                "Original Quality" if idx == 0 else "Standard Quality",
                h if h > 0 else None,
            )
            v_ext = entry["ext"]
            v_size = entry["size"] or ("HD Video + Audio" if entry["requires_merge"] else "Direct MP4")
            audio_note = "Video + Audio" if entry["requires_merge"] else "Audio Included"

            q_item: dict[str, Any] = {
                "id": q_id,
                "quality": q_title,
                "label": q_title,
                "sublabel": f"{v_size} • {audio_note}",
                "url": entry["preview_url"],
                "downloadUrl": entry["download_url"],
                "qualityLabel": q_title,
                "format": v_ext,
                "badge": q_title,
                "requiresClientMerge": entry["requires_client_merge"],
            }
            if entry["requires_client_merge"] and entry["video_url"] and entry["audio_url"]:
                q_item.update(
                    {
                        "videoUrl": entry["video_url"],
                        "audioUrl": entry["audio_url"],
                        "vcodec": entry["vcodec"],
                        "acodec": entry["acodec"],
                        "videoExt": entry["video_ext"],
                        "audioExt": entry["audio_ext"],
                    }
                )
            quality_list.append(q_item)

    selected_audio = (
        (best_direct_mp4_audio or best_direct_audio)
        if platform == "youtube"
        else best_direct_audio
    )
    audio_preview_url: Optional[str] = None
    audio_download_url: Optional[str] = None
    if selected_audio:
        raw_a_ext = (selected_audio.get("ext") or "m4a").lower()
        if platform == "youtube":
            a_token = register_proxy_job(
                media_url=selected_audio["url"],
                title=title,
                ext=raw_a_ext,
                suffix="audio",
                proxy_url=proxy_url,
                referer="https://www.youtube.com/",
            )
            audio_preview_url = f"/api/proxy?token={a_token}&dl=0"
            audio_download_url = f"/api/proxy?token={a_token}&dl=1"
        else:
            audio_preview_url = selected_audio["url"]
            audio_download_url = selected_audio["url"]

        if platform != "tiktok":
            a_ext = raw_a_ext.upper()
            a_size = (
                format_filesize(selected_audio.get("filesize") or selected_audio.get("filesize_approx"))
                or "Direct Audio"
            )
            quality_list.append(
                {
                    "id": "audio",
                    "quality": "Audio",
                    "label": f"{a_ext} - Audio Only",
                    "sublabel": f"{a_size} • High Quality Audio",
                    "url": audio_preview_url,
                    "downloadUrl": audio_download_url,
                    "qualityLabel": f"{a_ext} Audio Only",
                    "format": a_ext,
                    "badge": "AUDIO",
                    "requiresClientMerge": False,
                }
            )

    qualities: dict[str, Any] = {
        "hd": build_quality_payload(
            hd_entry,
            "High quality (without watermark)" if platform == "tiktok" else hd_label,
        )
    }

    if platform == "tiktok":
        sd_target = sd_entry or hd_entry
        qualities["sd"] = build_quality_payload(
            sd_target, "Standard quality (without watermark)"
        )
    elif sd_entry:
        sd_label = make_quality_label(sd_entry["fmt"], "SD", sd_entry["height"])
        qualities["sd"] = build_quality_payload(sd_entry, sd_label)

    if selected_audio and audio_preview_url and audio_download_url and platform != "tiktok":
        a_ext = (selected_audio.get("ext") or "m4a").upper()
        a_size = (
            format_filesize(selected_audio.get("filesize") or selected_audio.get("filesize_approx"))
            or "Audio Track"
        )
        qualities["audio"] = {
            "quality": f"{a_ext} Audio",
            "url": audio_preview_url,
            "downloadUrl": audio_download_url,
            "size": a_size,
            "format": a_ext,
            "requiresClientMerge": False,
        }

    if yt_prog_preview_url:
        resolved_preview_url = yt_prog_preview_url
    else:
        resolved_preview_url = best_progressive_preview or hd_entry["preview_url"]

    return {
        "id": f"{platform}_{info.get('id') or abs(hash(url_str))}",
        "originalUrl": url_str,
        "title": title,
        "author": str(author),
        "views": views,
        "duration": duration,
        "thumbnail": thumbnail,
        "platform": platform_display,
        "isSingleQuality": False,
        "previewUrl": resolved_preview_url,
        "bestVideoUrl": hd_entry["video_url"] or hd_entry["download_url"],
        "bestAudioUrl": audio_download_url,
        "qualityList": quality_list,
        "qualities": qualities,
    }


def get_referer_for_url(url: str) -> Optional[str]:
    lower = url.lower()
    if "youtube.com" in lower or "youtu.be" in lower or "googlevideo.com" in lower:
        return "https://www.youtube.com/"
    if "fbcdn" in lower or "facebook" in lower:
        return "https://www.facebook.com/"
    if "instagram" in lower or "cdninstagram" in lower:
        return "https://www.instagram.com/"
    if "tiktok" in lower or "tiktokcdn" in lower or "tikwm" in lower:
        return "https://www.tiktok.com/"
    return None


def download_stream_to_file(
    url: str,
    dest_path: str,
    timeout: int = 45,
    proxy_url: Optional[str] = None,
) -> None:
    headers = {
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
    }
    referer = get_referer_for_url(url)
    if referer:
        headers["Referer"] = referer

    http_timeout = httpx.Timeout(connect=20.0, read=float(timeout), write=30.0, pool=20.0)
    with httpx.Client(proxy=proxy_url, follow_redirects=True, timeout=http_timeout) as client:
        with client.stream("GET", url, headers=headers) as resp:
            if resp.status_code >= 400:
                raise RuntimeError(f"Upstream CDN returned HTTP {resp.status_code}")
            with open(dest_path, "wb") as f:
                for chunk in resp.iter_bytes(chunk_size=262144):
                    if chunk:
                        f.write(chunk)

    if not os.path.exists(dest_path) or os.path.getsize(dest_path) == 0:
        raise RuntimeError("Downloaded upstream media stream was empty.")


def probe_media_streams(file_path: str) -> dict[str, Any]:
    if not FFPROBE_PATH or not os.path.exists(FFPROBE_PATH):
        return {}
    try:
        res = subprocess.run(
            [
                FFPROBE_PATH,
                "-v",
                "error",
                "-show_entries",
                "stream=codec_type,codec_name,pix_fmt,width,height",
                "-of",
                "json",
                file_path,
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if res.returncode != 0 or not res.stdout:
            return {}
        parsed = json.loads(res.stdout)
        streams = parsed.get("streams") or []
        video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
        audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)
        return {"video": video_stream, "audio": audio_stream}
    except Exception:
        return {}


def ensure_h264_mp4(input_path: str, output_path: str) -> None:
    """Verify final MP4 uses universally playable H.264 yuv420p video (fixes black-screen VP9/AV1 MP4s)."""
    probe = probe_media_streams(input_path)
    v_stream = probe.get("video")
    if not v_stream:
        if input_path != output_path:
            os.replace(input_path, output_path)
        return

    codec_name = (v_stream.get("codec_name") or "").lower()
    pix_fmt = (v_stream.get("pix_fmt") or "").lower()
    is_universal_h264 = codec_name == "h264" and pix_fmt in ("", "yuv420p", "yuvj420p", "nv12")

    if is_universal_h264:
        if input_path != output_path:
            os.replace(input_path, output_path)
        return

    a_stream = probe.get("audio")
    a_codec = (a_stream.get("codec_name") or "").lower() if a_stream else ""
    a_arg = "copy" if a_codec in ("aac", "mp3") else "aac"

    fix_cmd = [
        FFMPEG_PATH,
        "-y",
        "-loglevel",
        "error",
        "-i",
        input_path,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-preset",
        "ultrafast",
        "-crf",
        "22",
        "-threads",
        "0",
        "-c:a",
        a_arg,
    ]
    if a_arg == "aac":
        fix_cmd.extend(["-b:a", "192k"])
    fix_cmd.extend(["-movflags", "+faststart", "-f", "mp4", output_path])

    res = subprocess.run(fix_cmd, capture_output=True, text=True, timeout=180)
    if res.returncode != 0 or not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        raise RuntimeError(f"H.264 compatibility transcode failed: {res.stderr.strip()}")


def merge_media_to_mp4(job_id: str, job: dict[str, Any], output_path: str) -> None:
    if not FFMPEG_PATH:
        raise RuntimeError("FFmpeg binary is not installed on the server.")

    os.makedirs(MERGED_DIR, exist_ok=True)
    cleanup_old_merged_files()

    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        return

    nonce = secrets.token_hex(4)
    part_path = f"{output_path}.{nonce}.part.mp4"
    v_tmp = f"{output_path}.{nonce}.v.tmp"
    a_tmp = f"{output_path}.{nonce}.a.tmp"
    transcode_tmp = f"{output_path}.{nonce}.h264.mp4"

    video_url = job.get("video_url")
    audio_url = job.get("audio_url")
    proxy_url = job.get("proxy_url") if job.get("platform") == "youtube" else None
    job_height = int(job.get("height") or 0)
    is_youtube_uhd = job.get("platform") == "youtube" and job_height >= 1440
    vcodec = job.get("vcodec") or ""
    acodec = job.get("acodec") or ""
    video_protocol = job.get("video_protocol") or ""
    audio_protocol = job.get("audio_protocol") or ""

    can_direct_download = (
        bool(video_url)
        and bool(audio_url)
        and not any(p in video_protocol for p in ("m3u8", "dash", "rtmp", "rtsp"))
        and not any(p in audio_protocol for p in ("m3u8", "dash", "rtmp", "rtsp"))
    )

    try:
        merged_ok = False

        if can_direct_download:
            try:
                # Download video and audio concurrently from CDN to local temp files, then mux locally (much faster than ffmpeg HTTP seeking)
                with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
                    fut_v = pool.submit(download_stream_to_file, video_url, v_tmp, 60, proxy_url)
                    fut_a = pool.submit(download_stream_to_file, audio_url, a_tmp, 60, proxy_url)
                    fut_v.result()
                    fut_a.result()

                v_probe = probe_media_streams(v_tmp).get("video")
                a_probe = probe_media_streams(a_tmp).get("audio")

                # If file actually has no video stream, force fallback instead of producing audio-only black-screen MP4
                if FFPROBE_PATH and os.path.exists(FFPROBE_PATH) and not v_probe:
                    raise RuntimeError("Downloaded video stream contained no video track.")

                if v_probe:
                    real_vcodec = (v_probe.get("codec_name") or "").lower()
                    real_pix_fmt = (v_probe.get("pix_fmt") or "").lower()
                    if is_youtube_uhd and real_vcodec in ("h264", "vp9", "av1"):
                        # Avoid multi-minute CPU transcodes for YouTube 2K/4K VP9/AV1
                        can_copy_video = True
                    else:
                        can_copy_video = real_vcodec == "h264" and real_pix_fmt in ("", "yuv420p", "yuvj420p", "nv12")
                else:
                    # Only stream-copy when confirmed H.264; never copy VP9/AV1/HEVC into MP4 unless 2K/4K YT
                    can_copy_video = is_h264_codec(vcodec) or is_youtube_uhd

                if a_probe:
                    real_acodec = (a_probe.get("codec_name") or "").lower()
                    can_copy_audio = real_acodec in ("aac", "mp3")
                else:
                    can_copy_audio = any(c in acodec for c in ("mp4a", "aac", "mp3"))

                v_codec_arg = "copy" if can_copy_video else "libx264"
                a_codec_arg = "copy" if can_copy_audio else "aac"

                cmd = [
                    FFMPEG_PATH,
                    "-y",
                    "-loglevel",
                    "error",
                    "-i",
                    v_tmp,
                    "-i",
                    a_tmp,
                    "-map",
                    "0:v:0",
                    "-map",
                    "1:a:0",
                    "-c:v",
                    v_codec_arg,
                ]
                if v_codec_arg == "libx264":
                    cmd.extend(["-pix_fmt", "yuv420p", "-preset", "ultrafast", "-crf", "22", "-threads", "0"])
                cmd.extend(["-c:a", a_codec_arg])
                if a_codec_arg == "aac":
                    cmd.extend(["-b:a", "192k"])
                cmd.extend(["-movflags", "+faststart", "-shortest", "-f", "mp4", part_path])

                res = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
                if res.returncode == 0 and os.path.exists(part_path) and os.path.getsize(part_path) > 0:
                    merged_ok = True
                else:
                    print(f"[warn] Local FFmpeg merge failed for {job_id}: {res.stderr.strip()}")
                    if os.path.exists(part_path):
                        os.remove(part_path)
            except Exception as direct_exc:
                print(f"[warn] Concurrent direct merge failed for {job_id}: {direct_exc}")
                if os.path.exists(part_path):
                    os.remove(part_path)

        # Reliable fallback: let yt-dlp download & mux with FFmpeg (handles cookies, headers, HLS/DASH)
        if not merged_ok:
            fmt_spec = job.get("ytdlp_format_spec")
            if not fmt_spec:
                v_id = job.get("video_fmt_id")
                a_id = job.get("audio_fmt_id")
                if v_id and a_id:
                    fmt_spec = (
                        f"{v_id}+{a_id}/"
                        "bestvideo[vcodec^=avc]+bestaudio[acodec^=mp4a]/"
                        "bestvideo[ext=mp4]+bestaudio[ext=m4a]/"
                        "bestvideo+bestaudio/best"
                    )
                else:
                    fmt_spec = (
                        "bestvideo[vcodec^=avc]+bestaudio[acodec^=mp4a]/"
                        "bestvideo[ext=mp4]+bestaudio[ext=m4a]/"
                        "bestvideo+bestaudio/best"
                    )

            ydl_opts: dict[str, Any] = {
                "quiet": True,
                "no_warnings": True,
                "noplaylist": True,
                "socket_timeout": 20,
                "format": fmt_spec,
                "format_sort": ["vcodec:h264", "acodec:aac", "ext:mp4:m4a"],
                "merge_output_format": "mp4",
                "ffmpeg_location": os.path.dirname(FFMPEG_PATH),
                "outtmpl": part_path,
                "overwrites": True,
                "http_headers": {
                    "User-Agent": DEFAULT_USER_AGENT,
                    "Accept-Language": "en-US,en;q=0.9",
                },
                "postprocessor_args": {
                    "merger": ["-c", "copy", "-movflags", "+faststart"],
                },
            }
            if proxy_url:
                ydl_opts["proxy"] = proxy_url
            if NODE_PATH:
                ydl_opts["js_runtimes"] = {"node": {}}
            if ACTIVE_COOKIE_FILE and os.path.exists(ACTIVE_COOKIE_FILE):
                ydl_opts["cookiefile"] = ACTIVE_COOKIE_FILE

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([job["original_url"]])

            # yt-dlp might write part_path or part_path + '.mp4'
            candidate_path = part_path if os.path.exists(part_path) else f"{part_path}.mp4"
            if not os.path.exists(candidate_path) or os.path.getsize(candidate_path) == 0:
                raise RuntimeError("FFmpeg merge completed without producing an output MP4 file.")

            if is_youtube_uhd:
                os.replace(candidate_path, part_path)
            else:
                ensure_h264_mp4(candidate_path, transcode_tmp)
                os.replace(transcode_tmp, part_path)

        os.replace(part_path, output_path)
    finally:
        for stray in (part_path, f"{part_path}.mp4", v_tmp, a_tmp, transcode_tmp):
            if os.path.exists(stray):
                try:
                    os.remove(stray)
                except OSError:
                    pass


@app.get("/")
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "savevibe-ytdlp-backend",
        "yt_dlp_version": yt_dlp.version.__version__,
        "ffmpeg_installed": bool(FFMPEG_PATH),
        "ffprobe_installed": bool(FFPROBE_PATH),
        "node_installed": bool(NODE_PATH),
        "ffmpeg_path": FFMPEG_PATH,
        "cookies_loaded": bool(ACTIVE_COOKIE_FILE and os.path.exists(ACTIVE_COOKIE_FILE)),
        "youtube_enabled": True,
        "youtube_proxies_loaded": len(YOUTUBE_PROXIES),
        "prefer_client_merge": PREFER_CLIENT_MERGE,
    }


def is_retryable_youtube_error(message: str) -> bool:
    lower = message.lower()
    retry_markers = (
        "sign in",
        "not a bot",
        "confirm you",
        "403",
        "429",
        "too many requests",
        "proxy",
        "tunnel",
        "timed out",
        "timeout",
        "connection",
        "eof",
        "reset by peer",
        "ssl",
    )
    return any(marker in lower for marker in retry_markers)


@app.post("/api/extract", dependencies=[Depends(verify_api_key)])
async def extract_video(payload: ExtractRequest):
    url_str = str(payload.url).strip()
    platform = detect_platform(url_str, payload.platform)

    if platform not in ("facebook", "youtube", "instagram", "tiktok"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported URL. Please enter a valid Facebook, YouTube, Instagram, or TikTok video link.",
        )

    canon_url = canonicalize_url(url_str)
    cache_key = f"{platform}:{canon_url}"
    if cache_key in extract_cache:
        return {"success": True, "cached": True, "data": extract_cache[cache_key]}

    lock = extract_locks.setdefault(cache_key, asyncio.Lock())
    try:
        async with lock:
            if cache_key in extract_cache:
                return {"success": True, "cached": True, "data": extract_cache[cache_key]}

            if platform == "youtube":
                proxy_candidates = get_youtube_proxy_candidates(max_tries=4)
                last_exc: Optional[Exception] = None
                data: Optional[dict[str, Any]] = None
                for idx, candidate_proxy in enumerate(proxy_candidates):
                    try:
                        data = await asyncio.to_thread(
                            extract_with_ytdlp, url_str, platform, candidate_proxy
                        )
                        break
                    except Exception as exc:
                        last_exc = exc
                        if idx < len(proxy_candidates) - 1 and is_retryable_youtube_error(str(exc)):
                            print(f"[warn] YouTube extract attempt {idx + 1} failed, trying next proxy: {exc}")
                            continue
                        raise
                if data is None and last_exc is not None:
                    raise last_exc
            else:
                data = await asyncio.to_thread(extract_with_ytdlp, url_str, platform, None)

            extract_cache[cache_key] = data
            return {"success": True, "cached": False, "data": data}
    except yt_dlp.utils.DownloadError as exc:
        msg = str(exc)
        if "Private" in msg or "login" in msg.lower() or "Sign in" in msg or "not a bot" in msg.lower():
            raise HTTPException(
                status_code=422,
                detail=f"This {platform.capitalize()} video is private, age-restricted, or temporarily blocked.",
            )
        raise HTTPException(
            status_code=422,
            detail=f"Unable to extract {platform.capitalize()} video link. Please verify the URL is public and valid.",
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(exc)}")
    finally:
        if not lock.locked() and len(extract_locks) > 500:
            extract_locks.pop(cache_key, None)


async def ensure_merge_job_ready(token: str) -> tuple[dict[str, Any], str]:
    if not FFMPEG_PATH:
        raise HTTPException(
            status_code=503,
            detail="FFmpeg is not installed on the server. Ensure nixpacks.toml and builder=NIXPACKS are configured.",
        )

    job_id = verify_signed_token(token, merge_jobs)
    job = merge_jobs.get(job_id)
    if not job:
        raise HTTPException(
            status_code=410,
            detail="Download link expired. Please fetch the video link again.",
        )

    lock = merge_locks.setdefault(job_id, asyncio.Lock())
    output_path = os.path.join(MERGED_DIR, f"{job_id}.mp4")

    async with lock:
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            try:
                await asyncio.to_thread(merge_media_to_mp4, job_id, job, output_path)
            except subprocess.TimeoutExpired:
                raise HTTPException(
                    status_code=504,
                    detail="FFmpeg merge timed out while processing the video.",
                )
            except Exception as exc:
                raise HTTPException(
                    status_code=502,
                    detail=f"Failed to merge video and audio: {str(exc)}",
                )

    if len(merge_locks) > 1000:
        stale = [k for k in list(merge_locks.keys()) if k not in merge_jobs]
        for k in stale:
            merge_locks.pop(k, None)

    return job, output_path


@app.api_route("/api/merge/prepare", methods=["GET", "POST"])
async def prepare_merged_video(token: str = Query(..., min_length=10)):
    _, output_path = await ensure_merge_job_ready(token)
    size_bytes = os.path.getsize(output_path) if os.path.exists(output_path) else 0
    return {"success": True, "ready": True, "sizeBytes": size_bytes}


@app.api_route("/api/merge", methods=["GET", "HEAD"])
async def download_merged_video(
    token: str = Query(..., min_length=10),
    dl: int = Query(default=1),
):
    job, output_path = await ensure_merge_job_ready(token)

    height = int(job.get("height") or 0)
    suffix = f"{height}p" if height > 0 else "HD"
    filename = sanitize_filename(job.get("title") or "SaveVibe_Video", suffix)
    disposition = "attachment" if dl != 0 else "inline"

    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        headers={
            "Content-Disposition": f'{disposition}; filename="{filename}"; filename*=UTF-8\'\'{quote(filename)}',
            "Cache-Control": "private, max-age=600",
            "Accept-Ranges": "bytes",
        },
    )


_proxy_clients_lock = asyncio.Lock()
_proxy_clients: dict[str, httpx.AsyncClient] = {}


async def get_shared_proxy_client(proxy_url: Optional[str]) -> httpx.AsyncClient:
    key = proxy_url or "__direct__"
    async with _proxy_clients_lock:
        client = _proxy_clients.get(key)
        if client is not None and not client.is_closed:
            return client
        client = httpx.AsyncClient(
            proxy=proxy_url,
            follow_redirects=True,
            timeout=httpx.Timeout(connect=20.0, read=60.0, write=30.0, pool=20.0),
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=30, keepalive_expiry=60.0),
        )
        _proxy_clients[key] = client
        return client


@app.on_event("shutdown")
async def shutdown_shared_proxy_clients() -> None:
    async with _proxy_clients_lock:
        clients = list(_proxy_clients.values())
        _proxy_clients.clear()
    for client in clients:
        try:
            await client.aclose()
        except Exception:
            pass


async def close_proxy_stream(upstream: httpx.Response) -> None:
    try:
        await upstream.aclose()
    except Exception:
        pass


async def iter_proxy_bytes(upstream: httpx.Response):
    try:
        async for chunk in upstream.aiter_bytes(chunk_size=524288):
            if chunk:
                yield chunk
    finally:
        await close_proxy_stream(upstream)


@app.api_route("/api/proxy", methods=["GET", "HEAD"])
async def proxy_media_stream(
    request: Request,
    token: str = Query(..., min_length=10),
    dl: int = Query(default=1),
):
    job_id = verify_signed_token(token, proxy_jobs)
    job = proxy_jobs.get(job_id)
    if not job:
        raise HTTPException(
            status_code=410,
            detail="Download link expired. Please fetch the video link again.",
        )

    media_url = job["media_url"]
    proxy_url = job.get("proxy_url")
    headers: dict[str, str] = {
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
    }
    referer = job.get("referer") or get_referer_for_url(media_url)
    if referer:
        headers["Referer"] = referer

    range_header = request.headers.get("range")
    if range_header:
        headers["Range"] = range_header

    client = await get_shared_proxy_client(proxy_url)

    try:
        upstream_method = "HEAD" if request.method == "HEAD" else "GET"
        req = client.build_request(upstream_method, media_url, headers=headers)
        upstream = await client.send(req, stream=True)
        if request.method == "HEAD" and upstream.status_code in (403, 405, 501):
            await close_proxy_stream(upstream)
            probe_headers = {**headers, "Range": "bytes=0-0"}
            req = client.build_request("GET", media_url, headers=probe_headers)
            upstream = await client.send(req, stream=True)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to stream media via proxy: {str(exc)}")

    if upstream.status_code >= 400 and upstream.status_code != 206:
        status_code = 410 if upstream.status_code in (403, 404) else 502
        await close_proxy_stream(upstream)
        raise HTTPException(
            status_code=status_code,
            detail=f"Media source returned HTTP {upstream.status_code}. Please fetch the link again.",
        )

    ext = (job.get("ext") or "mp4").lower()
    default_mime = "audio/mp4" if ext == "m4a" else ("video/webm" if ext == "webm" else "video/mp4")
    content_type = upstream.headers.get("content-type") or default_mime
    if "octet-stream" in content_type.lower():
        content_type = default_mime

    filename = sanitize_filename(
        job.get("title") or "SaveVibe_Video",
        job.get("suffix") or "",
        ext,
    )
    disposition = "attachment" if dl != 0 else "inline"

    resp_headers: dict[str, str] = {
        "Content-Disposition": f'{disposition}; filename="{filename}"; filename*=UTF-8\'\'{quote(filename)}',
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
        "Accept-Ranges": upstream.headers.get("accept-ranges") or "bytes",
    }
    if upstream.headers.get("content-length"):
        resp_headers["Content-Length"] = upstream.headers["content-length"]
    if upstream.headers.get("content-range"):
        resp_headers["Content-Range"] = upstream.headers["content-range"]

    if request.method == "HEAD":
        status_code = upstream.status_code
        content_range = upstream.headers.get("content-range")
        if status_code == 206 and content_range:
            match = re.search(r"/(\d+)$", content_range)
            if match:
                resp_headers["Content-Length"] = match.group(1)
                resp_headers.pop("Content-Range", None)
                status_code = 200
        await close_proxy_stream(upstream)
        return Response(
            status_code=status_code,
            media_type=content_type,
            headers=resp_headers,
        )

    return StreamingResponse(
        iter_proxy_bytes(upstream),
        status_code=upstream.status_code,
        media_type=content_type,
        headers=resp_headers,
        background=BackgroundTask(close_proxy_stream, upstream),
    )
