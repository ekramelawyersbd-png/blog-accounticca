import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Square, Pause, Play, AlertCircle, ShieldCheck, FastForward } from 'lucide-react';
import { cn } from '../lib/utils';

interface ReadAloudButtonProps {
  content: string;
  title: string;
  className?: string;
  variant?: 'pill' | 'toolbar' | 'compact' | 'embedded';
  showSecurityBadge?: boolean;
}

export function ReadAloudButton({ 
  content, 
  title, 
  className,
  variant = 'pill',
  showSecurityBadge = false
}: ReadAloudButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const activeRef = useRef(false);
  const chunksRef = useRef<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
    }
    
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        activeRef.current = false;
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const rates = [0.8, 1.0, 1.25, 1.5];

  const handlePlayPause = () => {
    if (!isSupported) return;
    const synth = window.speechSynthesis;
    setError(null);

    if (isPlaying) {
      if (isPaused) {
        synth.resume();
        setIsPaused(false);
      } else {
        synth.pause();
        setIsPaused(true);
      }
    } else {
      // Basic markdown/HTML cleanup before reading
      const cleanContent = content
        .replace(/<[^>]*>/g, ' ')
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*|__/g, '')
        .replace(/\*|_/g, '')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/`{1,3}[^`]*`{1,3}/g, '')
        .replace(/---/g, '')
        .replace(/\n+/g, '. ')
        .trim();
      
      const textToRead = `${title}. ${cleanContent}`;
      
      // Chunk text into sentence-sized blocks to avoid Chrome 15-second speech limits
      const chunks = textToRead.match(/[^.!?\n]+[.!?\n]+/g) || [textToRead];
      chunksRef.current = chunks;
      setTotalChunks(chunks.length);
      setCurrentChunkIndex(0);
      let currentChunk = 0;
      activeRef.current = true;

      const speakNextChunk = () => {
        if (!activeRef.current || currentChunk >= chunksRef.current.length) {
          setIsPlaying(false);
          setIsPaused(false);
          activeRef.current = false;
          setCurrentChunkIndex(0);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunksRef.current[currentChunk]);
        utterance.rate = playbackRate;
        utterance.pitch = 1.0;
        
        utterance.onend = () => {
          if (activeRef.current) {
            currentChunk++;
            setCurrentChunkIndex(currentChunk);
            speakNextChunk();
          }
        };

        utterance.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.error('Speech synthesis error', e);
            setError("Audio playback restricted in this environment.");
          }
          activeRef.current = false;
          setIsPlaying(false);
          setIsPaused(false);
        };

        synth.speak(utterance);
      };

      synth.cancel();
      setIsPlaying(true);
      setIsPaused(false);
      speakNextChunk();
    }
  };

  const handleStop = () => {
    if (!isSupported) return;
    activeRef.current = false;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentChunkIndex(0);
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (isPlaying) {
      window.speechSynthesis.cancel();
      // Restart current chunk with new rate
      const synth = window.speechSynthesis;
      let currentChunk = currentChunkIndex;
      activeRef.current = true;

      const speakNext = () => {
        if (!activeRef.current || currentChunk >= chunksRef.current.length) {
          setIsPlaying(false);
          setIsPaused(false);
          activeRef.current = false;
          return;
        }
        const utterance = new SpeechSynthesisUtterance(chunksRef.current[currentChunk]);
        utterance.rate = rate;
        utterance.onend = () => {
          if (activeRef.current) {
            currentChunk++;
            setCurrentChunkIndex(currentChunk);
            speakNext();
          }
        };
        utterance.onerror = () => {
          activeRef.current = false;
          setIsPlaying(false);
        };
        synth.speak(utterance);
      };
      speakNext();
    }
  };

  if (!isSupported) {
    return (
      <div className={cn("text-[11px] text-slate-400 flex items-center gap-1.5", className)}>
        <VolumeX className="w-3.5 h-3.5" />
        <span>Speech unavailable in this browser</span>
      </div>
    );
  }

  // Variant: embedded toolbar (ideal for course reader and notes reader)
  if (variant === 'embedded' || variant === 'toolbar') {
    return (
      <div 
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border transition-all select-none",
          isPlaying 
            ? "bg-emerald-50/90 border-emerald-300 shadow-xs" 
            : "bg-slate-50 border-slate-200/90",
          className
        )}
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={handlePlayPause}
            className={`p-2 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-2xs ${
              isPlaying
                ? isPaused 
                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-emerald-700 hover:bg-emerald-600 text-white"
            }`}
            title={isPlaying ? (isPaused ? "Resume Reading" : "Pause Reading") : "Listen with Text-to-Speech"}
          >
            {isPlaying ? (
              isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
            <span>{isPlaying ? (isPaused ? "Resume TTS" : "Pause TTS") : "Listen to Section (TTS)"}</span>
          </button>

          {isPlaying && (
            <button
              type="button"
              onClick={handleStop}
              className="p-2 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
              title="Stop TTS Playback"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Animated Waveform equalizer while playing */}
          {isPlaying && !isPaused && (
            <div className="hidden sm:flex items-center gap-0.5 px-2 py-1 bg-emerald-100/80 rounded-md">
              <span className="w-1 h-3 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-4 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-2 bg-emerald-600 rounded-full animate-bounce" />
              <span className="w-1 h-4 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.2s]" />
            </div>
          )}

          {totalChunks > 0 && isPlaying && (
            <span className="text-[11px] font-mono text-emerald-800">
              {Math.min(100, Math.round(((currentChunkIndex + 1) / totalChunks) * 100))}% spoken
            </span>
          )}
        </div>

        {/* Speed rate & security disclaimer */}
        <div className="flex items-center gap-2">
          {/* Rate Switcher */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
            {rates.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRateChange(r)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                  playbackRate === r 
                    ? "bg-slate-900 text-white" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title={`Playback Speed: ${r}x`}
              >
                {r}x
              </button>
            ))}
          </div>

          <div 
            className="hidden md:flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200 pointer-events-none"
            title="Real-time speech synthesis only. Direct audio file downloading or copying is restricted."
          >
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Protected Speech</span>
          </div>
        </div>

        {error && (
          <div className="w-full text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // Variant: compact (fits nicely into headers and floating bars)
  if (variant === 'compact') {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <button
          type="button"
          onClick={handlePlayPause}
          className={`p-1.5 rounded-lg border font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
            isPlaying 
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" 
              : "bg-white border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
          }`}
          title={isPlaying ? (isPaused ? "Resume Reading" : "Pause Reading") : "Listen to Article (TTS)"}
        >
          {isPlaying ? (
            isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {isPlaying ? (isPaused ? "Resume" : "Listening") : "Listen"}
          </span>
        </button>

        {isPlaying && (
          <button
            type="button"
            onClick={handleStop}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
            title="Stop TTS"
          >
            <Square className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // Variant: pill (standard button with status and controls)
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePlayPause}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs",
            isPlaying 
              ? isPaused
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-emerald-600 text-white border-emerald-600 shadow-sm" 
              : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
          )}
          title={isPlaying ? (isPaused ? "Resume Reading" : "Pause Reading") : "Listen with Text-to-Speech"}
          type="button"
        >
          {isPlaying ? (
            isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span>{isPlaying ? (isPaused ? "Resume Audio" : "Pause Audio") : "Listen to Article"}</span>

          {isPlaying && !isPaused && (
            <span className="flex items-center gap-0.5 ml-1">
              <span className="w-1 h-2.5 bg-white rounded-full animate-bounce" />
              <span className="w-1 h-3.5 bg-white rounded-full animate-bounce [animation-delay:-0.2s]" />
              <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.4s]" />
            </span>
          )}
        </button>
        
        {isPlaying && (
          <>
            <button
              onClick={handleStop}
              className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
              title="Stop Audio"
              type="button"
            >
              <Square className="w-3.5 h-3.5" />
            </button>

            {/* Quick Speed Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
              {rates.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRateChange(r)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                    playbackRate === r 
                      ? "bg-slate-900 text-white" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title={`${r}x speed`}
                >
                  {r}x
                </button>
              ))}
            </div>
          </>
        )}

        {showSecurityBadge && (
          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Direct download restricted</span>
          </span>
        )}
      </div>
      
      {error && (
        <div className="flex items-start gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 max-w-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
