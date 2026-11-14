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
}

const CORE_CDN_BASES = [
  'https://unpkg.com/@ffmpeg/core@0.12.9/dist/esm',
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.9/dist/esm',
];

let ffmpegSingleton: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

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

    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import('@ffmpeg/ffmpeg'),
      import('@ffmpeg/util'),
    ]);

    const instance = new FFmpeg();
    let lastError: unknown = null;

    for (const baseURL of CORE_CDN_BASES) {
      try {
        const [coreURL, wasmURL] = await Promise.all([
          toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        ]);

        await instance.load({ coreURL, wasmURL });
        ffmpegSingleton = instance;
        onProgress?.({
          stage: 'loading',
          percent: 15,
          message: 'FFmpeg engine ready',
        });
        return instance;
      } catch (err) {
        lastError = err;
      }
    }

    ffmpegLoadPromise = null;
    throw new Error(
      lastError instanceof Error
        ? `Failed to initialize browser FFmpeg: ${lastError.message}`
        : 'Failed to initialize browser FFmpeg engine.'
    );
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

async function fetchMediaBytes(
  directUrl: string,
  fallbackFilename: string,
  onBytes: (received: number, total: number | null) => void
): Promise<{ data: Uint8Array; usedProxyFallback: boolean }> {
  // 1. Primary path: Direct browser fetch from CDN (0% server bandwidth)
  try {
    const directRes = await fetch(directUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
    });

    if (!directRes.ok) {
      throw new Error(`CDN returned HTTP ${directRes.status}`);
    }

    const data = await readResponseWithProgress(directRes, onBytes);
    if (data.byteLength === 0) {
      throw new Error('CDN returned an empty media stream.');
    }
    return { data, usedProxyFallback: false };
  } catch (directErr) {
    // 2. Resilient CORS fallback: fetch via /api/download if CDN edge blocks CORS
    const canTryProxy = /^https?:\/\//i.test(directUrl);
    if (!canTryProxy) {
      throw directErr;
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

  const vExt = sanitizeExt(videoExt, 'mp4');
  const aExt = sanitizeExt(audioExt, 'm4a');

  const [videoResult, audioResult] = await Promise.all([
    fetchMediaBytes(videoUrl, `video.${vExt}`, (rec, tot) => {
      videoReceived = rec;
      videoTotal = tot;
      emitDownloadProgress();
    }),
    fetchMediaBytes(audioUrl, `audio.${aExt}`, (rec, tot) => {
      audioReceived = rec;
      audioTotal = tot;
      emitDownloadProgress();
    }),
  ]);

  const usedProxyFallback = videoResult.usedProxyFallback || audioResult.usedProxyFallback;

  const jobKey = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const videoPath = `v_${jobKey}.${vExt}`;
  const audioPath = `a_${jobKey}.${aExt}`;
  const outputPath = `out_${jobKey}.mp4`;

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

    const lowerV = vcodec.toLowerCase();
    const lowerA = acodec.toLowerCase();

    const canCopyVideo =
      lowerV === '' || /(avc|h264|hevc|h265|hvc1|hev1|mp4v)/.test(lowerV);
    const canCopyAudio = lowerA === '' || /(mp4a|aac)/.test(lowerA);

    const vArg = canCopyVideo ? 'copy' : 'libx264';
    const aArg = canCopyAudio ? 'copy' : 'aac';

    const buildArgs = (vc: string, ac: string) => {
      const args = [
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
        args.push('-preset', 'ultrafast', '-crf', '23');
      }
      if (ac === 'aac') {
        args.push('-b:a', '192k');
      }
      args.push('-movflags', '+faststart', '-shortest', outputPath);
      return args;
    };

    let exitCode = await ffmpeg.exec(buildArgs(vArg, aArg));

    // If direct stream copy fails (e.g., unusual container/codec), retry with safe re-encode
    if (exitCode !== 0 && (vArg === 'copy' || aArg === 'copy')) {
      await ffmpeg.deleteFile(outputPath).catch(() => {});
      exitCode = await ffmpeg.exec(buildArgs('libx264', 'aac'));
    }

    if (exitCode !== 0) {
      throw new Error('Browser FFmpeg failed to mux video and audio streams.');
    }

    const rawOutput = await ffmpeg.readFile(outputPath);
    if (!(rawOutput instanceof Uint8Array) || rawOutput.byteLength === 0) {
      throw new Error('Merged MP4 output was empty.');
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
      blob: new Blob([stableCopy.buffer], { type: 'video/mp4' }),
      usedProxyFallback,
    };
  } finally {
    ffmpeg.off('progress', progressHandler);
    await Promise.allSettled([
      ffmpeg.deleteFile(videoPath),
      ffmpeg.deleteFile(audioPath),
      ffmpeg.deleteFile(outputPath),
    ]);
  }
}
