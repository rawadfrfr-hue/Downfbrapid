'use client';

import type { FFmpeg } from '@ffmpeg/ffmpeg';

export type MergeStage = 'loading' | 'downloading' | 'merging' | 'saving';

export interface MergeProgress {
  stage: MergeStage;
  percent: number;
  message: string;
  usedProxyFallback?: boolean;
}

export interface ClientMergeParams {
  videoUrl: string;
  audioUrl: string;
  filename: string;
  vcodec?: string;
  acodec?: string;
  videoExt?: string;
  audioExt?: string;
  onProgress?: (progress: MergeProgress) => void;
}

export interface ClientMergeResult {
  blob: Blob;
  usedProxyFallback: boolean;
  ext: 'mp4' | 'webm';
  mimeType: string;
}

const CORE_CDN_BASES = [
  'https://unpkg.com/@ffmpeg/core@0.12.9/dist/esm',
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.9/dist/esm',
];

let ffmpegSingleton: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

function formatUnknownError(err: unknown): string {
  if (err instanceof Error) return err.message || err.toString();
  if (typeof err === 'string' && err.trim()) return err;
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message;
  }
  return 'Unknown initialization error';
}

async function getFFmpegInstance(
  onProgress?: (progress: MergeProgress) => void
): Promise<FFmpeg> {
  if (ffmpegSingleton && ffmpegSingleton.loaded) {
    return ffmpegSingleton;
  }

  if (ffmpegLoadPromise) {
    return ffmpegLoadPromise;
  }

  ffmpegLoadPromise = (async () => {
    onProgress?.({
      stage: 'loading',
      percent: 5,
      message: 'Loading browser FFmpeg engine...',
    });

    const [{ FFmpeg }] = await Promise.all([import('@ffmpeg/ffmpeg')]);

    const fetchBlobUrl = async (url: string, mimeType: string, timeoutMs: number = 15000) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} loading ${url}`);
        }
        const buf = await res.arrayBuffer();
        return URL.createObjectURL(new Blob([buf], { type: mimeType }));
      } finally {
        clearTimeout(timer);
      }
    };

    const classWorkerURL =
      typeof window !== 'undefined'
        ? `${window.location.origin}/ffmpeg/worker.js`
        : '/ffmpeg/worker.js';

    let lastError: unknown = null;

    for (const baseURL of CORE_CDN_BASES) {
      const instance = new FFmpeg();
      try {
        const [coreURL, wasmURL] = await Promise.all([
          fetchBlobUrl(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          fetchBlobUrl(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        ]);

        await instance.load({
          classWorkerURL,
          coreURL,
          wasmURL,
        });
        ffmpegSingleton = instance;
        onProgress?.({
          stage: 'loading',
          percent: 15,
          message: 'FFmpeg engine ready',
        });
        return instance;
      } catch (err) {
        lastError = err;
        try {
          instance.terminate();
        } catch {
          // ignore cleanup errors
        }
      }
    }

    ffmpegLoadPromise = null;
    throw new Error(`Failed to initialize browser FFmpeg: ${formatUnknownError(lastError)}`);
  })();

  return ffmpegLoadPromise;
}

async function readResponseWithProgress(
  res: Response,
  onBytes: (received: number, total: number | null) => void
): Promise<Uint8Array> {
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('text/html')) {
    throw new Error('Media link expired or returned an invalid HTML response.');
  }

  const lengthHeader = res.headers.get('content-length');
  const totalBytes = lengthHeader ? Number(lengthHeader) : null;
  const validTotal = totalBytes && Number.isFinite(totalBytes) && totalBytes > 0 ? totalBytes : null;

  if (!res.body) {
    const buf = new Uint8Array(await res.arrayBuffer());
    onBytes(buf.byteLength, buf.byteLength);
    return buf;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      onBytes(received, validTotal);
    }
  }

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

function isKnownCorsBlockedHost(urlStr: string): boolean {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    return (
      host.includes('fbcdn.net') ||
      host.includes('facebook.com') ||
      host.includes('cdninstagram.com') ||
      host.includes('instagram.com') ||
      host.includes('tiktokcdn') ||
      host.includes('tikwm.com')
    );
  } catch {
    return false;
  }
}

async function fetchMediaBytes(
  directUrl: string,
  fallbackFilename: string,
  onBytes: (received: number, total: number | null) => void
): Promise<{ data: Uint8Array; usedProxyFallback: boolean }> {
  // 1. Primary path: Direct browser fetch from CDN only when CORS is plausibly allowed
  if (!isKnownCorsBlockedHost(directUrl)) {
    const controller = new AbortController();
    const connectTimer = setTimeout(() => controller.abort(), 5000);
    try {
      const directRes = await fetch(directUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(connectTimer);

      if (!directRes.ok) {
        throw new Error(`CDN returned HTTP ${directRes.status}`);
      }

      const data = await readResponseWithProgress(directRes, onBytes);
      if (data.byteLength === 0) {
        throw new Error('CDN returned an empty media stream.');
      }
      return { data, usedProxyFallback: false };
    } catch {
      clearTimeout(connectTimer);
      // Fall through to /api/download proxy below
    }
  }

  {
    // 2. Resilient proxy path: fetch via /api/download
    const canTryProxy = /^https?:\/\//i.test(directUrl);
    if (!canTryProxy) {
      throw new Error('Invalid media URL for proxy download.');
    }

    const proxyUrl = `/api/download?url=${encodeURIComponent(directUrl)}&filename=${encodeURIComponent(
      fallbackFilename
    )}&dl=0`;

    const proxyRes = await fetch(proxyUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!proxyRes.ok) {
      const errJson = await proxyRes.json().catch(() => null);
      throw new Error(
        errJson?.error || `Failed to download media stream (HTTP ${proxyRes.status}). Please fetch the video link again.`
      );
    }

    const data = await readResponseWithProgress(proxyRes, onBytes);
    if (data.byteLength === 0) {
      throw new Error('Downloaded media stream was empty.');
    }
    return { data, usedProxyFallback: true };
  }
}

function sanitizeExt(ext: string | undefined, fallback: string): string {
  const cleaned = (ext || fallback).toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned || fallback;
}

function detectContainerFromBytes(data: Uint8Array, fallbackExt: string): string {
  if (data.byteLength >= 12) {
    // ISO Base Media File Format (MP4 / M4A): "ftyp" at offset 4
    if (data[4] === 0x66 && data[5] === 0x74 && data[6] === 0x79 && data[7] === 0x70) {
      return fallbackExt === 'm4a' ? 'm4a' : 'mp4';
    }
    // EBML header: Matroska / WebM
    if (data[0] === 0x1a && data[1] === 0x45 && data[2] === 0xdf && data[3] === 0xa3) {
      return 'webm';
    }
    // Ogg container
    if (data[0] === 0x4f && data[1] === 0x67 && data[2] === 0x67 && data[3] === 0x53) {
      return 'ogg';
    }
    // MP3 (ID3 tag or MPEG audio sync frame)
    if (
      (data[0] === 0x49 && data[1] === 0x44 && data[2] === 0x33) ||
      (data[0] === 0xff && (data[1] & 0xe0) === 0xe0)
    ) {
      return 'mp3';
    }
  }
  if (data.byteLength >= 377 && data[0] === 0x47 && data[188] === 0x47 && data[376] === 0x47) {
    return 'ts';
  }
  return fallbackExt;
}

export async function mergeVideoAndAudioInBrowser({
  videoUrl,
  audioUrl,
  filename,
  vcodec = '',
  acodec = '',
  videoExt = 'mp4',
  audioExt = 'm4a',
  onProgress,
}: ClientMergeParams): Promise<ClientMergeResult> {
  const ffmpeg = await getFFmpegInstance(onProgress);

  let videoReceived = 0;
  let videoTotal: number | null = null;
  let audioReceived = 0;
  let audioTotal: number | null = null;

  const emitDownloadProgress = () => {
    const vRatio = videoTotal ? Math.min(1, videoReceived / videoTotal) : videoReceived > 0 ? 0.5 : 0;
    const aRatio = audioTotal ? Math.min(1, audioReceived / audioTotal) : audioReceived > 0 ? 0.5 : 0;
    const combinedRatio = vRatio * 0.8 + aRatio * 0.2;
    const percent = Math.min(75, Math.max(16, Math.round(15 + combinedRatio * 60)));
    const dlMb = ((videoReceived + audioReceived) / (1024 * 1024)).toFixed(1);

    onProgress?.({
      stage: 'downloading',
      percent,
      message: `Downloading streams (${dlMb} MB)...`,
    });
  };

  onProgress?.({
    stage: 'downloading',
    percent: 16,
    message: 'Downloading video & audio streams...',
  });

  const requestedVExt = sanitizeExt(videoExt, 'mp4');
  const requestedAExt = sanitizeExt(audioExt, 'm4a');

  const [videoResult, audioResult] = await Promise.all([
    fetchMediaBytes(videoUrl, `video.${requestedVExt}`, (rec, tot) => {
      videoReceived = rec;
      videoTotal = tot;
      emitDownloadProgress();
    }),
    fetchMediaBytes(audioUrl, `audio.${requestedAExt}`, (rec, tot) => {
      audioReceived = rec;
      audioTotal = tot;
      emitDownloadProgress();
    }),
  ]);

  const usedProxyFallback = videoResult.usedProxyFallback || audioResult.usedProxyFallback;

  const vExt = detectContainerFromBytes(videoResult.data, requestedVExt);
  const aExt = detectContainerFromBytes(audioResult.data, requestedAExt);

  const lowerV = vcodec.toLowerCase();
  const lowerA = acodec.toLowerCase();

  const isVideoWebm = vExt === 'webm' || (/(vp8|vp9|vp09)/.test(lowerV) && vExt !== 'mp4');
  const isAudioWebm =
    aExt === 'webm' || aExt === 'ogg' || (/(opus|vorbis)/.test(lowerA) && aExt !== 'mp4' && aExt !== 'm4a');

  const outputExt: 'mp4' | 'webm' = isVideoWebm && isAudioWebm ? 'webm' : 'mp4';

  const jobKey = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const videoPath = `v_${jobKey}.${vExt}`;
  const audioPath = `a_${jobKey}.${aExt}`;
  const primaryOutputPath = `out_${jobKey}.${outputExt}`;
  const fallbackMp4Path = `out_${jobKey}_fallback.mp4`;

  let finalOutputPath = primaryOutputPath;
  let finalExt: 'mp4' | 'webm' = outputExt;
  let finalMimeType = outputExt === 'webm' ? 'video/webm' : 'video/mp4';

  const ffmpegLogs: string[] = [];
  const logHandler = ({ message }: { message: string }) => {
    if (!message) return;
    ffmpegLogs.push(message);
    if (ffmpegLogs.length > 20) {
      ffmpegLogs.shift();
    }
  };

  const progressHandler = ({ progress }: { progress: number }) => {
    if (!Number.isFinite(progress)) return;
    const clamped = Math.max(0, Math.min(1, progress));
    const percent = Math.min(98, Math.max(76, Math.round(76 + clamped * 22)));
    onProgress?.({
      stage: 'merging',
      percent,
      message: `Merging in browser (${Math.round(clamped * 100)}%)...`,
      usedProxyFallback,
    });
  };

  ffmpeg.on('log', logHandler);
  ffmpeg.on('progress', progressHandler);

  try {
    onProgress?.({
      stage: 'merging',
      percent: 76,
      message: 'Merging video & audio on your device...',
      usedProxyFallback,
    });

    await ffmpeg.writeFile(videoPath, videoResult.data);
    await ffmpeg.writeFile(audioPath, audioResult.data);

    // Only stream-copy H.264/AVC into MP4; never copy VP9/AV1/HEVC into MP4 (causes black screen + audio only)
    const canCopyVideo =
      outputExt === 'webm'
        ? /(vp8|vp9|vp09|av01|av1)/.test(lowerV)
        : /(avc|h264|mp4v)/.test(lowerV);

    const canCopyAudio =
      outputExt === 'webm'
        ? /(opus|vorbis)/.test(lowerA)
        : lowerA === '' || /(mp4a|aac|mp3)/.test(lowerA);

    const vArg = canCopyVideo ? 'copy' : 'libx264';
    const aArg = canCopyAudio ? 'copy' : outputExt === 'webm' ? 'libopus' : 'aac';

    const buildArgs = (
      vc: string,
      ac: string,
      outFile: string,
      outContainer: 'mp4' | 'webm',
      options?: { faststart?: boolean; strictExperimental?: boolean }
    ) => {
      const args = [
        '-y',
        '-i',
        videoPath,
        '-i',
        audioPath,
        '-map',
        '0:v:0',
        '-map',
        '1:a:0',
        '-c:v',
        vc,
        '-c:a',
        ac,
      ];
      if (vc === 'libx264') {
        args.push('-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '23');
      }
      if (ac === 'aac') {
        args.push('-b:a', '192k');
      } else if (ac === 'libopus') {
        args.push('-b:a', '128k');
      }
      if (options?.strictExperimental) {
        args.push('-strict', '-2');
      }
      if (outContainer === 'mp4' && options?.faststart !== false) {
        args.push('-movflags', '+faststart');
      }
      args.push('-avoid_negative_ts', 'make_zero', '-shortest', outFile);
      return args;
    };

    // 1. Primary attempt: pure stream copy (-c:v copy -c:a copy) into matching container (1-2s)
    let exitCode = await ffmpeg.exec(
      buildArgs(vArg, aArg, primaryOutputPath, outputExt, {
        faststart: outputExt === 'mp4',
        strictExperimental: outputExt === 'mp4' && lowerA.includes('opus'),
      })
    );

    // 2. If MP4 stream copy failed due to faststart/fragmented MP4 quirk, retry stream copy without +faststart
    if (exitCode !== 0 && outputExt === 'mp4' && vArg === 'copy' && aArg === 'copy') {
      await ffmpeg.deleteFile(primaryOutputPath).catch(() => {});
      exitCode = await ffmpeg.exec(
        buildArgs('copy', 'copy', primaryOutputPath, 'mp4', {
          faststart: false,
          strictExperimental: true,
        })
      );
    }

    // 3. If audio stream copy failed (e.g. vorbis/opus in mp4), keep -c:v copy and only transcode audio to aac
    if (exitCode !== 0 && canCopyVideo && !(vArg === 'copy' && aArg === 'aac')) {
      await ffmpeg.deleteFile(primaryOutputPath).catch(() => {});
      finalOutputPath = outputExt === 'mp4' ? primaryOutputPath : fallbackMp4Path;
      finalExt = 'mp4';
      finalMimeType = 'video/mp4';
      exitCode = await ffmpeg.exec(
        buildArgs('copy', 'aac', finalOutputPath, 'mp4', { faststart: true })
      );
    }

    // 4. Last resort only: full software re-encode to H.264/AAC MP4
    if (exitCode !== 0 && (vArg !== 'libx264' || aArg !== 'aac')) {
      await ffmpeg.deleteFile(finalOutputPath).catch(() => {});
      finalOutputPath = fallbackMp4Path;
      finalExt = 'mp4';
      finalMimeType = 'video/mp4';
      exitCode = await ffmpeg.exec(
        buildArgs('libx264', 'aac', fallbackMp4Path, 'mp4', { faststart: true })
      );
    }

    if (exitCode !== 0) {
      const tailLog = ffmpegLogs.slice(-3).join(' | ');
      throw new Error(
        tailLog
          ? `Browser FFmpeg failed to mux streams: ${tailLog}`
          : 'Browser FFmpeg failed to mux video and audio streams.'
      );
    }

    const rawOutput = await ffmpeg.readFile(finalOutputPath);
    if (!(rawOutput instanceof Uint8Array) || rawOutput.byteLength === 0) {
      throw new Error(`Merged ${finalExt.toUpperCase()} output was empty.`);
    }

    onProgress?.({
      stage: 'saving',
      percent: 100,
      message: `Saving ${filename}...`,
      usedProxyFallback,
    });

    const stableCopy = new Uint8Array(rawOutput.byteLength);
    stableCopy.set(rawOutput);

    return {
      blob: new Blob([stableCopy.buffer], { type: finalMimeType }),
      usedProxyFallback,
      ext: finalExt,
      mimeType: finalMimeType,
    };
  } finally {
    ffmpeg.off('log', logHandler);
    ffmpeg.off('progress', progressHandler);
    await Promise.allSettled([
      ffmpeg.deleteFile(videoPath),
      ffmpeg.deleteFile(audioPath),
      ffmpeg.deleteFile(primaryOutputPath),
      ffmpeg.deleteFile(fallbackMp4Path),
    ]);
  }
}
