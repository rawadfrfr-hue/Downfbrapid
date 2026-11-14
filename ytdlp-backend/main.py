import asyncio
import base64
import hashlib
import hmac
import os
import re
import secrets
import shutil
import subprocess
import time
from typing import Any, Optional

from cachetools import TTLCache
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
import yt_dlp

app = FastAPI(
    title="SaveVibe yt-dlp Backend",
    description="Direct media link extractor & FFmpeg muxer for Facebook, Instagram, and TikTok using yt-dlp.",
    version="1.1.0",
)

# Optional CORS configuration (Next.js server calls this server-to-server,
# and browser calls /api/merge directly for FFmpeg-merged high-quality MP4s)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

API_SECRET = os.getenv("YTDLP_API_SECRET", "").strip()
SIGNING_SECRET = (API_SECRET or secrets.token_hex(32)).encode("utf-8")
COOKIE_FILE_PATH = "/tmp/ytdlp_cookies.txt"
MERGED_DIR = "/tmp/savevibe_merged"
FFMPEG_PATH = shutil.which("ffmpeg")
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0.0.0 Safari/537.36"
)

# In-memory cache (up to 500 extracted URLs cached for 10 minutes)
extract_cache: TTLCache[str, dict[str, Any]] = TTLCache(maxsize=500, ttl=600)
# Pending FFmpeg merge jobs cached for 30 minutes
merge_jobs: TTLCache[str, dict[str, Any]] = TTLCache(maxsize=1000, ttl=1800)
merge_locks: dict[str, asyncio.Lock] = {}


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


def sanitize_filename(name: str, suffix: str = "") -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", name).strip("._")
    cleaned = (cleaned or "SaveVibe_Video")[:45]
    if suffix:
        return f"{cleaned}_{suffix}.mp4"
    return f"{cleaned}.mp4"


def sign_job_id(job_id: str) -> str:
    sig = hmac.new(SIGNING_SECRET, job_id.encode("utf-8"), hashlib.sha256).hexdigest()[:24]
    return f"{job_id}.{sig}"


def verify_merge_token(token: str) -> str:
    if "." not in token:
        raise HTTPException(status_code=403, detail="Invalid download token.")
    job_id, provided_sig = token.split(".", 1)
    expected_sig = hmac.new(SIGNING_SECRET, job_id.encode("utf-8"), hashlib.sha256).hexdigest()[:24]
    if not hmac.compare_digest(provided_sig, expected_sig):
        raise HTTPException(status_code=403, detail="Invalid or tampered download token.")
    if job_id not in merge_jobs:
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
    video_fmt: Optional[dict[str, Any]],
    audio_fmt: Optional[dict[str, Any]],
    ytdlp_format_spec: Optional[str] = None,
) -> str:
    v_id = str(video_fmt.get("format_id") or "") if video_fmt else ""
    a_id = str(audio_fmt.get("format_id") or "") if audio_fmt else ""
    seed = f"{original_url}|{height}|{v_id}|{a_id}|{ytdlp_format_spec or ''}"
    job_id = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:20]

    merge_jobs[job_id] = {
        "original_url": original_url,
        "title": title,
        "height": height,
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


def cleanup_old_merged_files(max_age_seconds: int = 900, max_files: int = 25) -> None:
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


def extract_with_ytdlp(url_str: str, platform: str) -> dict[str, Any]:
    ydl_opts: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "socket_timeout": 20,
        "extract_flat": False,
        "http_headers": {
            "User-Agent": DEFAULT_USER_AGENT,
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

    progressive_formats = [f for f in formats if is_confirmed_progressive(f)]
    direct_audio_formats = [f for f in formats if is_audio_only(f, allow_dash_hls=False)]
    any_audio_formats = direct_audio_formats or [f for f in formats if is_audio_only(f, allow_dash_hls=True)]

    # Direct HTTP video-only streams (Facebook/Instagram 720p/1080p/2K/4K DASH streams)
    video_only_formats = [f for f in formats if is_video_only_stream(f, allow_dash_hls=False)]
    if not video_only_formats and FFMPEG_PATH:
        video_only_formats = [f for f in formats if is_video_only_stream(f, allow_dash_hls=True)]

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

    # Best audio format (prefer m4a/aac/mp3)
    best_direct_audio = None
    if direct_audio_formats:
        direct_audio_formats.sort(
            key=lambda f: (
                1 if (f.get("ext") or "").lower() in ("m4a", "mp3") else 0,
                float(f.get("abr") or f.get("tbr") or 0.0),
            ),
            reverse=True,
        )
        best_direct_audio = direct_audio_formats[0]

    best_merge_audio = best_direct_audio
    if not best_merge_audio and any_audio_formats:
        any_audio_formats.sort(
            key=lambda f: (
                1 if (f.get("ext") or "").lower() in ("m4a", "mp4", "aac") else 0,
                float(f.get("abr") or f.get("tbr") or 0.0),
            ),
            reverse=True,
        )
        best_merge_audio = any_audio_formats[0]

    def sort_key(f: dict[str, Any]) -> tuple[int, int, float]:
        is_mp4 = 1 if (f.get("ext") or "").lower() == "mp4" else 0
        height = int(f.get("height") or 0)
        tbr = float(f.get("tbr") or 0.0)
        return (is_mp4, height, tbr)

    progressive_formats.sort(key=sort_key, reverse=True)
    video_only_formats.sort(key=sort_key, reverse=True)

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
    views = (
        f"{int(view_count):,} views"
        if isinstance(view_count, (int, float)) and view_count > 0
        else "Public Video"
    )

    def make_quality_label(fmt: dict[str, Any], default_label: str) -> str:
        h = int(fmt.get("height") or 0)
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

    # Build deduplicated video candidates by height:
    # 1. Prefer confirmed progressive format at a given height (0 server load)
    # 2. For higher resolutions that only exist as video-only, merge with best_merge_audio via FFmpeg
    candidates: list[dict[str, Any]] = []
    seen_heights: set[int] = set()

    for f in progressive_formats:
        h = int(f.get("height") or 0)
        if h > 0 and h in seen_heights:
            continue
        if h > 0:
            seen_heights.add(h)
        candidates.append({"fmt": f, "requires_merge": False})

    if FFMPEG_PATH and best_merge_audio:
        for f in video_only_formats:
            h = int(f.get("height") or 0)
            if h > 0 and h in seen_heights:
                continue
            if h > 0:
                seen_heights.add(h)
            elif len(candidates) > 0:
                continue
            candidates.append({"fmt": f, "requires_merge": True})

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
            video_fmt=None,
            audio_fmt=None,
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
                "synthetic": True,
            }
        )

    if not candidates:
        if video_only_formats and not FFMPEG_PATH:
            raise ValueError(
                "High quality video requires FFmpeg to merge audio on the server, "
                "but FFmpeg is not installed. Check nixpacks.toml / Railway builder settings."
            )
        raise ValueError(
            "No direct downloadable MP4 link found. The video may be private or require login."
        )

    # Sort all final candidates highest resolution first
    candidates.sort(
        key=lambda item: (
            int(item["fmt"].get("height") or 0),
            0 if item["requires_merge"] else 1,
            float(item["fmt"].get("tbr") or 0.0),
        ),
        reverse=True,
    )

    # Materialize final URLs (direct CDN vs signed FFmpeg /api/merge URL)
    resolved_videos: list[dict[str, Any]] = []
    for item in candidates:
        vfmt = item["fmt"]
        h = int(vfmt.get("height") or 0)
        if item.get("synthetic"):
            preview_url = vfmt["url"]
            download_url = vfmt["download_url"]
            est_size = None
            ext = "MP4"
        elif item["requires_merge"]:
            token = register_merge_job(
                original_url=url_str,
                title=title,
                height=h,
                video_fmt=vfmt,
                audio_fmt=best_merge_audio,
            )
            preview_url = f"/api/merge?token={token}&dl=0"
            download_url = f"/api/merge?token={token}&dl=1"
            v_bytes = vfmt.get("filesize") or vfmt.get("filesize_approx") or 0
            a_bytes = (best_merge_audio.get("filesize") or best_merge_audio.get("filesize_approx") or 0) if best_merge_audio else 0
            est_size = format_filesize(v_bytes + a_bytes) if (v_bytes and a_bytes) else format_filesize(v_bytes)
            ext = "MP4"
        else:
            preview_url = vfmt["url"]
            download_url = vfmt["url"]
            est_size = format_filesize(vfmt.get("filesize") or vfmt.get("filesize_approx"))
            ext = (vfmt.get("ext") or "mp4").upper()

        resolved_videos.append(
            {
                "fmt": vfmt,
                "height": h,
                "requires_merge": item["requires_merge"],
                "preview_url": preview_url,
                "download_url": download_url,
                "size": est_size,
                "ext": ext,
            }
        )

    hd_entry = resolved_videos[0]
    sd_entry = resolved_videos[1] if len(resolved_videos) > 1 else None

    hd_label = make_quality_label(hd_entry["fmt"], "HD Quality")
    hd_size = hd_entry["size"] or hd_label

    quality_list: list[dict[str, Any]] = []
    if platform == "tiktok":
        quality_list.append(
            {
                "id": "hd",
                "quality": "Max Quality",
                "label": "Max Quality (No Watermark)",
                "sublabel": f"Watermark-Free • {hd_size}",
                "url": hd_entry["preview_url"],
                "downloadUrl": hd_entry["download_url"],
                "qualityLabel": "Max Quality without watermark",
                "format": hd_entry["ext"],
                "badge": "NO WATERMARK",
            }
        )
    else:
        for idx, entry in enumerate(resolved_videos[:4]):
            h = entry["height"]
            q_id = f"{h}p" if h > 0 else ("hd" if idx == 0 else f"sd_{idx}")
            q_title = make_quality_label(
                entry["fmt"], "High Quality" if idx == 0 else "Standard Quality"
            )
            v_ext = entry["ext"]
            v_size = entry["size"] or ("HD Audio + Video" if entry["requires_merge"] else "Direct MP4")
            audio_note = "Audio + Video (FFmpeg)" if entry["requires_merge"] else "Audio Included"
            quality_list.append(
                {
                    "id": q_id,
                    "quality": q_title,
                    "label": f"{v_ext} - {q_title}",
                    "sublabel": f"{v_size} • {audio_note}",
                    "url": entry["preview_url"],
                    "downloadUrl": entry["download_url"],
                    "qualityLabel": f"{q_title} Video",
                    "format": v_ext,
                    "badge": q_title,
                }
            )

        if best_direct_audio:
            a_ext = (best_direct_audio.get("ext") or "m4a").upper()
            a_size = (
                format_filesize(best_direct_audio.get("filesize") or best_direct_audio.get("filesize_approx"))
                or "Direct Audio"
            )
            quality_list.append(
                {
                    "id": "audio",
                    "quality": "Audio",
                    "label": f"{a_ext} - Audio Only",
                    "sublabel": f"{a_size} • High Quality Audio",
                    "url": best_direct_audio["url"],
                    "downloadUrl": best_direct_audio["url"],
                    "qualityLabel": f"{a_ext} Audio Only",
                    "format": a_ext,
                    "badge": "AUDIO",
                }
            )

    qualities: dict[str, Any] = {
        "hd": {
            "quality": "Max Quality without watermark" if platform == "tiktok" else hd_label,
            "url": hd_entry["preview_url"],
            "downloadUrl": hd_entry["download_url"],
            "size": "Max Quality • No Watermark" if platform == "tiktok" else hd_size,
            "format": hd_entry["ext"],
        }
    }

    if sd_entry and platform != "tiktok":
        sd_label = make_quality_label(sd_entry["fmt"], "SD")
        qualities["sd"] = {
            "quality": sd_label,
            "url": sd_entry["preview_url"],
            "downloadUrl": sd_entry["download_url"],
            "size": sd_entry["size"] or sd_label,
            "format": sd_entry["ext"],
        }

    if best_direct_audio and platform != "tiktok":
        a_ext = (best_direct_audio.get("ext") or "m4a").upper()
        a_size = (
            format_filesize(best_direct_audio.get("filesize") or best_direct_audio.get("filesize_approx"))
            or "Audio Track"
        )
        qualities["audio"] = {
            "quality": f"{a_ext} Audio",
            "url": best_direct_audio["url"],
            "downloadUrl": best_direct_audio["url"],
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


def merge_media_to_mp4(job_id: str, job: dict[str, Any], output_path: str) -> None:
    if not FFMPEG_PATH:
        raise RuntimeError("FFmpeg binary is not installed on the server.")

    os.makedirs(MERGED_DIR, exist_ok=True)
    cleanup_old_merged_files()

    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        return

    part_path = f"{output_path}.{secrets.token_hex(4)}.part.mp4"
    video_url = job.get("video_url")
    audio_url = job.get("audio_url")
    vcodec = job.get("vcodec") or ""
    acodec = job.get("acodec") or ""
    video_protocol = job.get("video_protocol") or ""
    audio_protocol = job.get("audio_protocol") or ""

    can_direct_ffmpeg = (
        bool(video_url)
        and bool(audio_url)
        and not any(p in video_protocol for p in ("dash", "rtmp", "rtsp"))
        and not any(p in audio_protocol for p in ("dash", "rtmp", "rtsp"))
    )

    try:
        merged_ok = False

        if can_direct_ffmpeg:
            can_copy_video = (
                any(c in vcodec for c in ("avc", "h264", "hevc", "h265", "hvc1", "mp4v"))
                or vcodec == ""
            )
            can_copy_audio = any(c in acodec for c in ("mp4a", "aac"))

            v_codec_arg = "copy" if can_copy_video else "libx264"
            a_codec_arg = "copy" if can_copy_audio else "aac"

            cmd = [
                FFMPEG_PATH,
                "-y",
                "-loglevel",
                "error",
                "-user_agent",
                DEFAULT_USER_AGENT,
                "-i",
                video_url,
                "-user_agent",
                DEFAULT_USER_AGENT,
                "-i",
                audio_url,
                "-map",
                "0:v:0",
                "-map",
                "1:a:0",
                "-c:v",
                v_codec_arg,
                "-c:a",
                a_codec_arg,
            ]
            if a_codec_arg == "aac":
                cmd.extend(["-b:a", "192k"])
            if v_codec_arg == "libx264":
                cmd.extend(["-preset", "veryfast", "-crf", "22"])
            cmd.extend(["-movflags", "+faststart", "-f", "mp4", part_path])

            res = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
            if res.returncode == 0 and os.path.exists(part_path) and os.path.getsize(part_path) > 0:
                merged_ok = True
            else:
                print(f"[warn] Direct FFmpeg merge failed for {job_id}: {res.stderr.strip()}")
                if os.path.exists(part_path):
                    os.remove(part_path)

        # Reliable fallback: let yt-dlp download & mux with FFmpeg (handles cookies, headers, HLS/DASH)
        if not merged_ok:
            fmt_spec = job.get("ytdlp_format_spec")
            if not fmt_spec:
                v_id = job.get("video_fmt_id")
                a_id = job.get("audio_fmt_id")
                if v_id and a_id:
                    fmt_spec = f"{v_id}+{a_id}/bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best"
                else:
                    fmt_spec = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best"

            ydl_opts: dict[str, Any] = {
                "quiet": True,
                "no_warnings": True,
                "noplaylist": True,
                "socket_timeout": 30,
                "format": fmt_spec,
                "merge_output_format": "mp4",
                "ffmpeg_location": os.path.dirname(FFMPEG_PATH),
                "outtmpl": part_path,
                "overwrites": True,
                "http_headers": {
                    "User-Agent": DEFAULT_USER_AGENT,
                    "Accept-Language": "en-US,en;q=0.9",
                },
                "postprocessor_args": {
                    "merger": ["-movflags", "+faststart"],
                },
            }
            if ACTIVE_COOKIE_FILE and os.path.exists(ACTIVE_COOKIE_FILE):
                ydl_opts["cookiefile"] = ACTIVE_COOKIE_FILE

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([job["original_url"]])

            # yt-dlp might write part_path or part_path + '.mp4'
            candidate_path = part_path if os.path.exists(part_path) else f"{part_path}.mp4"
            if not os.path.exists(candidate_path) or os.path.getsize(candidate_path) == 0:
                raise RuntimeError("FFmpeg merge completed without producing an output MP4 file.")
            if candidate_path != part_path:
                os.replace(candidate_path, part_path)

        os.replace(part_path, output_path)
    finally:
        for stray in (part_path, f"{part_path}.mp4"):
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
        "ffmpeg_path": FFMPEG_PATH,
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


@app.get("/api/merge")
async def download_merged_video(
    token: str = Query(..., min_length=10),
    dl: int = Query(default=1),
):
    if not FFMPEG_PATH:
        raise HTTPException(
            status_code=503,
            detail="FFmpeg is not installed on the server. Ensure nixpacks.toml and builder=NIXPACKS are configured.",
        )

    job_id = verify_merge_token(token)
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

    height = int(job.get("height") or 0)
    suffix = f"{height}p" if height > 0 else "HD"
    filename = sanitize_filename(job.get("title") or "SaveVibe_Video", suffix)
    disposition = "attachment" if dl != 0 else "inline"

    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        headers={
            "Content-Disposition": f'{disposition}; filename="{filename}"',
            "Cache-Control": "private, max-age=600",
        },
    )
