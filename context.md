# Project Context & Architecture Guide (SaveVibe Downloader Suite)

> **Purpose for AI Models & Vibe Coding**: This file serves as the single source of truth for the entire codebase architecture, directory mapping, API contracts, and feature status. Any AI assistant reading this file should be able to understand the full context of the project without scanning or re-reading individual source files.

---

## 1. Project Overview

**SaveVibe** is a high-performance, ad-free, web-based multi-platform media downloader suite. It enables users to paste video URLs from major social media platforms and download media files in high definition (1080p Full HD MP4, 720p HD MP4, MP3 Audio, and Watermark-free TikTok MP4) instantly.

* **Core Purpose**: Provide an ultra-fast, reliable, free, and secure media downloading service with zero pop-up ads, malware-free links, and high-speed server proxy streaming.
* **Target Users**: Content creators, social media managers, archivists, and general users looking to download public videos and clips from Facebook, YouTube, Instagram, and TikTok for offline viewing or editing.
* **Key Platform Highlights**:
  * **Facebook**: Download public videos, reels, and watch clips in 1080p HD, 720p SD, or MP3.
  * **YouTube**: Download shorts, long-form videos, and audio tracks in 1080p, 720p, or 320kbps MP3.
  * **Instagram**: Download reels, IGTV, and post videos in HD quality.
  * **TikTok**: Download videos in maximum quality without watermark (**Single Quality Mode: "Max Quality without watermark"**).

---

## 2. Tech Stack & Architecture

### Core Tech Stack
* **Framework**: Next.js 15+ (App Router with TypeScript)
* **Styling**: Tailwind CSS v4 (`@import "tailwindcss";` in `globals.css`)
* **Icons**: `lucide-react` + inline custom SVG for TikTok
* **Animations**: `motion` (imported from `motion/react`)
* **Fonts**: `Inter` from `next/font/google`
* **Runtime**: Node.js 18+ (Server-side API routes & Next.js App Router)

### Architecture & Design Patterns
* **Client-Server Separation**:
  * Frontend UI components (`VideoFetcher`, `ResultCard`, `Header`, etc.) run client-side (`'use client'`).
  * All third-party API keys and RapidAPI calls are strictly isolated server-side inside Next.js API Route Handlers (`/app/api/fetch-video` and `/app/api/download`).
* **Server-Side Stream Proxying**:
  * `/app/api/download/route.ts` acts as a streaming proxy to bypass cross-origin CORS blocks, setting proper `Content-Disposition: attachment; filename="..."` and forwarding CDN media streams directly to the browser.
* **Metadata Scraping Fallbacks**:
  * Combines official oEmbed APIs (`YouTube oEmbed`, `TikTok oEmbed`) with parallel OpenGraph scrapers (using specialized User-Agents like `facebookexternalhit/1.1`) to guarantee accurate titles, author handles, and HD thumbnails.

---

## 3. Key File Directory Map

```
/
├── app/
│   ├── api/
│   │   ├── download/
│   │   │   └── route.ts            # Server-side proxy for direct file downloads with proper disposition headers
│   │   └── fetch-video/
│   │       └── route.ts            # Core API handler for link parsing, platform detection & RapidAPI integration
│   ├── facebook/                   # Facebook Downloader route (redirects / alias to /)
│   ├── instagram/
│   │   └── page.tsx                # Dedicated Instagram Downloader page
│   ├── tiktok/
│   │   └── page.tsx                # Dedicated TikTok Downloader page (Single Quality "Max Quality without watermark")
│   ├── youtube/
│   │   └── page.tsx                # Dedicated YouTube Downloader page
│   ├── globals.css                 # Global CSS rules (Tailwind v4 imports)
│   ├── layout.tsx                  # Root layout with font configuration & SEO metadata
│   ├── not-found.tsx              # Custom 404 page
│   └── page.tsx                    # Home page (Facebook Downloader primary view)
├── components/
│   ├── DownloadHistory.tsx          # LocalStorage-persisted session download history component
│   ├── FeaturesGrid.tsx            # Trust & features grid highlighting speed, quality & security
│   ├── Footer.tsx                  # Clean footer with modal triggers and session download counter
│   ├── Header.tsx                  # Sticky navbar with responsive slide-out off-canvas drawer
│   ├── PrivacyTermsModal.tsx       # Modal overlay for Privacy Policy, Terms of Service & Contact
│   ├── ResultCard.tsx              # Dynamic result card with thumbnail preview, title, author & download options
│   ├── SkeletonLoader.tsx          # Shimmer loading skeleton displayed while processing video links
│   └── VideoFetcher.tsx            # Hero section with URL input, paste clipboard button & download trigger
├── lib/
│   ├── platforms.ts                # Configuration dictionary for Facebook, YouTube, Instagram & TikTok
│   └── utils.ts                    # Classnames utility helper (`cn`)
├── metadata.json                   # AI Studio applet metadata declaration
└── package.json                    # Project dependencies and script scripts
```

---

## 4. API Contracts & Flow

### A. Fetch Video Data Endpoint: `POST /app/api/fetch-video/route.ts`

* **Request Payload**:
  ```json
  {
    "url": "https://vm.tiktok.com/ZSgVVxApa/",
    "platform": "tiktok"
  }
  ```
* **Response Payload Structure**:
  ```json
  {
    "success": true,
    "data": {
      "id": "tiktok_1761570000000",
      "originalUrl": "https://vm.tiktok.com/ZSgVVxApa/",
      "title": "TikTok · Creator Title",
      "author": "@username",
      "views": "Public Video",
      "duration": "0:45",
      "thumbnail": "https://p16-sharing-sign.tiktokcdn.com/...",
      "platform": "TikTok",
      "isSingleQuality": true,
      "qualities": {
        "hd": {
          "quality": "Max Quality without watermark",
          "url": "https://dl.snapcdn.app/get?token=...",
          "downloadUrl": "https://dl.snapcdn.app/get?token=...",
          "size": "Max Quality • No Watermark",
          "format": "MP4"
        }
      }
    }
  }
  ```

### B. Download Proxy Endpoint: `GET /app/api/download/route.ts`

* **Query Parameters**:
  * `url`: Encoded target CDN media URL (e.g. `https://dl.snapcdn.app/get?token=...`)
  * `filename`: Target filename (e.g. `TikTok_Video_Max_Quality.mp4`)
* **Behavior**:
  * Fetches the video stream server-side with custom User-Agent headers.
  * Checks content type and returns stream with `Content-Disposition: attachment; filename="..."`.
  * If streaming fails, gracefully falls back to an HTTP 302 redirect.

---

## 5. Current Status & Done Tasks

- [x] **Facebook Downloader (`/`)**: Fully functional. Fetches HD/SD MP4 and MP3 links via RapidAPI and OpenGraph fallback.
- [x] **YouTube Downloader (`/youtube`)**: Fully functional. Fetches 1080p, 720p, and MP3 audio concurrently using YouTube oEmbed and RapidAPI.
- [x] **Instagram Downloader (`/instagram`)**: Fully functional. Downloads reels, IGTV, and video posts without CORS issues.
- [x] **TikTok Downloader (`/tiktok`)**: Fully functional.
  - Integrates `https://tiktok-max-quality.p.rapidapi.com/download/?url=...` with host `tiktok-max-quality.p.rapidapi.com`.
  - Enforces **"Max Quality without watermark"** single-button quality mode on `ResultCard`.
  - Parallel metadata extraction using `facebookexternalhit/1.1` User-Agent to render real TikTok cover images, titles, and creator handles (`@username`).
- [x] **Navigation & UI Suite**: Responsive sticky header with 3-line hamburger menu, off-canvas slide-out drawer, quick platform tabs, and light-mode interface.
- [x] **Legal & Privacy Modals**: Fully integrated modal overlays for Privacy Policy, Terms, and Contact.
- [x] **Build & Lint Verification**: Clean Next.js 15 build with 0 linter errors and 0 compilation issues.

---

## 6. Guidelines for AI Assistants Working on this Codebase

1. **Do Not Break Single Quality Mode for TikTok**: TikTok results must only present a single download button with the label `"Max Quality without watermark"`.
2. **Keep API Keys Server-Side**: Never expose RapidAPI keys in client components; all API requests must pass through `/app/api/fetch-video/route.ts`.
3. **Use Direct Server Proxying for Downloads**: Always route media file downloads through `/api/download?url=...` to ensure proper `Content-Disposition` headers and avoid browser CORS blocks.
4. **Icons Discipline**: Use `lucide-react` for standard icons and maintain the clean inline `TikTokIcon` SVG component in `Header.tsx`.
