import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { VideoPlayerErrorBoundary } from './VideoPlayerErrorBoundary';

export interface R2VideoPlayerProps {
  src: string;
  title: string;
  instructor?: string;
  durationLabel?: string;
  watermarkText?: string;
  r2ObjectKey?: string;
  storageMode?: string;
  expiresAt?: string;
  initialWatchPercent?: number;
  onTimeUpdatePercent?: (percent: number) => void;
  onPlaybackCompleted?: () => void;
  onRetrySignedUrl?: () => void;
}

const MEDIA_ERROR_MAP: Record<number, { title: string; hint: string }> = {
  1: {
    title: 'MEDIA_ERR_ABORTED',
    hint: 'The video fetching process was aborted by the client or browser.'
  },
  2: {
    title: 'MEDIA_ERR_NETWORK',
    hint: 'A network error occurred while downloading the R2 video stream. Check your internet connection.'
  },
  3: {
    title: 'MEDIA_ERR_DECODE',
    hint: 'An error occurred while decoding the media stream (unsupported audio/video codec or corrupted file).'
  },
  4: {
    title: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
    hint: 'The video format is not supported or the temporary R2 signed URL was rejected/expired (HTTP 401/403/404).'
  }
};

function getEmbedUrl(rawUrl: string): { isEmbed: boolean; embedUrl?: string } {
  if (!rawUrl) return { isEmbed: false };
  try {
    const trimmed = rawUrl.trim();
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      let videoId = '';
      if (trimmed.includes('youtu.be/')) {
        videoId = trimmed.split('youtu.be/')[1]?.split(/[?#]/)[0] || '';
      } else if (trimmed.includes('/embed/')) {
        videoId = trimmed.split('/embed/')[1]?.split(/[?#]/)[0] || '';
      } else if (trimmed.includes('v=')) {
        videoId = new URL(trimmed).searchParams.get('v') || '';
      }
      if (videoId) {
        return { isEmbed: true, embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` };
      }
    }
    if (trimmed.includes('vimeo.com')) {
      const match = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      if (match && match[1]) {
        return { isEmbed: true, embedUrl: `https://player.vimeo.com/video/${match[1]}` };
      }
    }
  } catch {
    // fallback to direct video
  }
  return { isEmbed: false };
}

export const R2VideoPlayerCore: React.FC<R2VideoPlayerProps> = ({
  src,
  title,
  instructor,
  durationLabel,
  watermarkText,
  r2ObjectKey,
  storageMode,
  expiresAt,
  initialWatchPercent = 0,
  onTimeUpdatePercent,
  onPlaybackCompleted,
  onRetrySignedUrl
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const embedInfo = useMemo(() => getEmbedUrl(src), [src]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [currentPercent, setCurrentPercent] = useState(initialWatchPercent);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [mediaError, setMediaError] = useState<{
    code: number;
    title: string;
    message: string;
    hint: string;
  } | null>(null);

  // Diagnostic log on mount / src change
  useEffect(() => {
    console.group(`[R2VideoPlayer] Initializing Video Player for "${title}"`);
    console.log('Video Source URL:', src ? `${src.substring(0, 100)}...` : '(empty)');
    console.log('Is Embed Stream:', embedInfo.isEmbed);
    console.log('R2 Object Key:', r2ObjectKey || '(none)');
    console.log('Storage Mode:', storageMode || 'direct');
    console.log('Signed URL Expiry:', expiresAt || '(unspecified)');
    console.log('Initial Progress:', `${initialWatchPercent}%`);
    console.groupEnd();

    setMediaError(null);
    setIsBuffering(false);
  }, [src, embedInfo.isEmbed, r2ObjectKey, storageMode, expiresAt, title, initialWatchPercent]);

  // Handle Play / Pause toggle
  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      try {
        console.log('[R2VideoPlayer] Requesting play() on HTML5 video element');
        await video.play();
        setIsPlaying(true);
      } catch (playErr: any) {
        console.error('[R2VideoPlayer] play() rejected by browser policy or media error:', playErr);
        if (playErr.name === 'NotAllowedError') {
          console.warn('[R2VideoPlayer] Autoplay prevented by browser user-activation policy');
        } else {
          setMediaError({
            code: 0,
            title: playErr.name || 'PlaybackError',
            message: playErr.message || 'Browser failed to begin playback.',
            hint: 'User interaction is required or video format codec is unsupported.'
          });
        }
      }
    } else {
      console.log('[R2VideoPlayer] Pausing video element');
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || !durationSec) return;
    const seekTo = (Number(e.target.value) / 100) * durationSec;
    video.currentTime = seekTo;
    setCurrentTimeSec(seekTo);
    const pct = Math.round((seekTo / durationSec) * 100);
    setCurrentPercent(pct);
    if (onTimeUpdatePercent) onTimeUpdatePercent(pct);
  };

  const handleSpeedChange = () => {
    const video = videoRef.current;
    if (!video) return;
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    video.playbackRate = nextSpeed;
    setPlaybackSpeed(nextSpeed);
    console.log(`[R2VideoPlayer] Playback rate set to ${nextSpeed}x`);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!document.fullscreenElement) {
      video.requestFullscreen?.().catch((err) => {
        console.warn('[R2VideoPlayer] Fullscreen request rejected:', err);
      });
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const formatTime = (secs: number): string => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="relative rounded-2xl bg-slate-950 text-white overflow-hidden border border-slate-800 shadow-xl group">
      {/* Video Overlay Watermark for Protected Content Guard */}
      {watermarkText && (
        <div className="absolute top-3 right-4 z-20 pointer-events-none bg-slate-900/80 backdrop-blur-xs border border-slate-700/80 px-2.5 py-1 rounded text-[10px] font-mono text-slate-300">
          {watermarkText}
        </div>
      )}

      {/* Main HTML5 Video Tag or Embed iFrame */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center">
        {embedInfo.isEmbed && embedInfo.embedUrl ? (
          <iframe
            src={embedInfo.embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : src ? (
          <video
            ref={videoRef}
            src={src}
            playsInline
            preload="metadata"
            controlsList="nodownload"
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            onPlay={() => {
              console.log('[R2VideoPlayer Event: play]');
              setIsPlaying(true);
            }}
            onPause={() => {
              console.log('[R2VideoPlayer Event: pause]');
              setIsPlaying(false);
            }}
            onWaiting={() => {
              console.warn('[R2VideoPlayer Event: waiting (buffering)]');
              setIsBuffering(true);
            }}
            onPlaying={() => {
              console.log('[R2VideoPlayer Event: playing (resumed)]');
              setIsBuffering(false);
            }}
            onCanPlay={() => {
              console.log('[R2VideoPlayer Event: canplay]');
              setIsBuffering(false);
            }}
            onLoadedMetadata={(e) => {
              const el = e.currentTarget;
              const dur = el.duration || 0;
              console.log('[R2VideoPlayer Event: loadedmetadata]', {
                duration: dur,
                videoWidth: el.videoWidth,
                videoHeight: el.videoHeight,
                readyStatus: el.readyState
              });
              setDurationSec(dur);
              setMediaError(null);
            }}
            onProgress={(e) => {
              const el = e.currentTarget;
              if (el.buffered.length > 0 && el.duration > 0) {
                const bufferedEnd = el.buffered.end(el.buffered.length - 1);
                const bufPct = Math.min(100, Math.round((bufferedEnd / el.duration) * 100));
                setBufferedPercent(bufPct);
              }
            }}
            onTimeUpdate={(e) => {
              const el = e.currentTarget;
              const cur = el.currentTime || 0;
              const dur = el.duration || 0;
              setCurrentTimeSec(cur);
              if (dur > 0) {
                const pct = Math.min(100, Math.round((cur / dur) * 100));
                setCurrentPercent(pct);
                if (onTimeUpdatePercent) onTimeUpdatePercent(pct);
              }
            }}
            onEnded={() => {
              console.log('[R2VideoPlayer Event: ended] Video completed');
              setIsPlaying(false);
              setCurrentPercent(100);
              if (onPlaybackCompleted) onPlaybackCompleted();
            }}
            onError={(e) => {
              const err = e.currentTarget.error;
              const code = err?.code || 0;
              const mapped = MEDIA_ERROR_MAP[code] || {
                title: 'UNKNOWN_MEDIA_ERROR',
                hint: 'Unable to stream video. Please regenerate signed URL or verify R2 bucket access.'
              };

              console.group('❌ [R2VideoPlayer Error Handler Triggered]');
              console.error('Error Code:', code);
              console.error('Error Title:', mapped.title);
              console.error('Error Details:', err?.message || mapped.hint);
              console.error('Video Source URL:', src);
              console.error('Current Time:', e.currentTarget.currentTime);
              console.error('Network State:', e.currentTarget.networkState);
              console.error('Ready State:', e.currentTarget.readyState);
              console.groupEnd();

              setMediaError({
                code,
                title: mapped.title,
                message: err?.message || 'Video stream failed to load.',
                hint: mapped.hint
              });
              setIsBuffering(false);
              setIsPlaying(false);
            }}
          />
        ) : (
          <div className="p-8 text-center text-xs font-mono text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="font-bold text-slate-300">No Video Source URL Provided</p>
            <p className="text-slate-500 text-[11px]">
              Waiting for signed temporary R2 read URL from the backend...
            </p>
          </div>
        )}

        {/* Buffering Spinner Overlay */}
        {isBuffering && !mediaError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-2xs z-10">
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center gap-2 text-xs font-mono text-emerald-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Buffering R2 Stream...</span>
            </div>
          </div>
        )}

        {/* Media Error Overlay with Actionable Recovery */}
        {mediaError && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30 space-y-3">
            <div className="p-3 rounded-2xl bg-rose-950 border border-rose-800 text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1">
              <h4 className="text-sm font-bold text-white">
                Video Stream Error: {mediaError.title}
              </h4>
              <p className="text-xs text-rose-300 font-mono">
                {mediaError.hint}
              </p>
              {r2ObjectKey && (
                <p className="text-[10px] text-slate-400 font-mono pt-1">
                  Target Key: {r2ObjectKey}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {onRetrySignedUrl && (
                <button
                  type="button"
                  onClick={() => {
                    console.log('[R2VideoPlayer] Triggering signed URL retry...');
                    setMediaError(null);
                    onRetrySignedUrl();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate Signed URL & Retry</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const v = videoRef.current;
                  if (v) {
                    v.load();
                    setMediaError(null);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Reload Stream
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Video Control Bar (only for direct HTML5 video, as YouTube/Vimeo embeds have their own player controls) */}
      {!embedInfo.isEmbed ? (
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800/80 space-y-2">
          {/* Progress Bar Scrubber */}
          <div className="relative w-full flex items-center">
          {/* Buffer Bar */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-slate-700/60 rounded-full pointer-events-none"
            style={{ width: `${bufferedPercent}%` }}
          />
          {/* Progress Input */}
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={durationSec > 0 ? (currentTimeSec / durationSec) * 100 : currentPercent}
            onChange={handleSeek}
            disabled={!durationSec}
            className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500 relative z-10"
          />
        </div>

        {/* Buttons and Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-colors"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                const v = videoRef.current;
                if (v) v.currentTime = Math.max(0, v.currentTime - 10);
              }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Rewind 10s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <div className="font-mono text-[11px] text-slate-400 pl-1">
              <span>{formatTime(currentTimeSec)}</span>
              <span className="text-slate-600"> / </span>
              <span>{formatTime(durationSec) !== '00:00' ? formatTime(durationSec) : durationLabel || '00:00'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSpeedChange}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-[11px] cursor-pointer"
              title="Playback Speed"
            >
              {playbackSpeed}x
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Info Strip */}
        <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>
              {storageMode === 'cloudflare-r2' ? 'Cloudflare R2 Direct Stream' : 'Protected Stream Gateway'}
            </span>
          </div>
          {expiresAt && (
            <div className="text-slate-400">
              Valid until: {new Date(expiresAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="font-bold text-slate-200">Interactive Stream Embed</span>
          {instructor && <span className="text-slate-400">· {instructor}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (onTimeUpdatePercent) onTimeUpdatePercent(100);
              if (onPlaybackCompleted) onPlaybackCompleted();
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark Lecture Complete</span>
          </button>
        </div>
      </div>
    )}
  </div>
);
};

export const R2VideoPlayer: React.FC<R2VideoPlayerProps> = (props) => {
  return (
    <VideoPlayerErrorBoundary onReset={props.onRetrySignedUrl}>
      <R2VideoPlayerCore {...props} />
    </VideoPlayerErrorBoundary>
  );
};
