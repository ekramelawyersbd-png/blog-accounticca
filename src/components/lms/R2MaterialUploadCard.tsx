import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
  X,
  HardDrive,
  Video,
  FileText,
  Presentation,
  RefreshCw,
  Link2,
  Globe,
  DownloadCloud,
  Play
} from 'lucide-react';
import {
  R2MaterialType,
  R2StorageMode,
  requestR2PresignedUpload,
  uploadFileToR2PresignedUrl,
  requestR2SignedReadUrl,
  uploadFromUrlToR2,
  deleteR2Object,
  formatBytesTabular
} from '../../utils/r2StorageClient';
import { LmsR2AssetMetadata } from '../../data/lmsCoursesData';
import { VideoPlayerErrorBoundary } from './VideoPlayerErrorBoundary';

interface R2MaterialUploadCardProps {
  courseId: string;
  lessonId: string;
  classNumber: string;
  materialType: R2MaterialType;
  label: string;
  assetIdValue: string;
  onAssetIdChange: (nextVal: string) => void;
  urlValue?: string;
  onUrlChange?: (nextUrl: string) => void;
  currentMetadata: LmsR2AssetMetadata;
  onUploadSuccess: (metadata: LmsR2AssetMetadata, suggestedAssetId: string) => void;
  onRemoveR2Object: () => void;
}

const MATERIAL_CONFIG: Record<
  R2MaterialType,
  {
    accept: string;
    allowedExtensions: string[];
    maxSizeMb: number;
    helperText: string;
    urlPlaceholder: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  video: {
    accept: 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov',
    allowedExtensions: ['.mp4', '.webm', '.mov'],
    maxSizeMb: 2048,
    helperText: 'MP4, WebM, MOV up to 2 GB (Direct R2 Presigned PUT)',
    urlPlaceholder: 'https://.../video.mp4, YouTube, Vimeo, or Cloudflare Stream',
    icon: Video
  },
  notes: {
    accept: 'application/pdf,.pdf',
    allowedExtensions: ['.pdf'],
    maxSizeMb: 100,
    helperText: 'PDF Statutory Reading Notes up to 100 MB',
    urlPlaceholder: 'https://.../notes.pdf or Cloudflare CDN URL',
    icon: FileText
  },
  ppt: {
    accept:
      'application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pdf,.ppt,.pptx',
    allowedExtensions: ['.pdf', '.ppt', '.pptx'],
    maxSizeMb: 150,
    helperText: 'PDF or PPTX Presentation Deck up to 150 MB',
    urlPlaceholder: 'https://.../presentation.pdf or Slide Deck URL',
    icon: Presentation
  }
};

export const R2MaterialUploadCard: React.FC<R2MaterialUploadCardProps> = ({
  courseId,
  lessonId,
  classNumber,
  materialType,
  label,
  assetIdValue,
  onAssetIdChange,
  urlValue = '',
  onUrlChange,
  currentMetadata,
  onUploadSuccess,
  onRemoveR2Object
}) => {
  const cfg = MATERIAL_CONFIG[materialType];
  const Icon = cfg.icon;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Active source mode: 'r2-storage' (File Upload) vs 'url' (Direct URL / Ingest from URL)
  const initialMode =
    currentMetadata.sourceType === 'url' || (!currentMetadata.r2ObjectKey && urlValue)
      ? 'url'
      : 'r2-storage';
  const [sourceMode, setSourceMode] = useState<'r2-storage' | 'url'>(initialMode);

  // URL state
  const [inputUrl, setInputUrl] = useState<string>(urlValue || currentMetadata.externalUrl || '');
  const [isIngestingUrl, setIsIngestingUrl] = useState<boolean>(false);

  // Upload progress state
  const [uploadState, setUploadState] = useState<
    'idle' | 'presigning' | 'uploading' | 'completed' | 'error'
  >('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [loadedBytes, setLoadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<string | null>(null);

  useEffect(() => {
    if (urlValue !== undefined) {
      setInputUrl(urlValue);
    }
  }, [urlValue]);

  const validateFile = (file: File): string | null => {
    const lowerName = file.name.toLowerCase();
    const matchesExt = cfg.allowedExtensions.some((ext) => lowerName.endsWith(ext));
    if (!matchesExt) {
      return `Invalid format "${file.name}". Allowed: ${cfg.allowedExtensions.join(', ')}`;
    }
    const maxBytes = cfg.maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File exceeds maximum size of ${cfg.maxSizeMb} MB.`;
    }
    return null;
  };

  const handleFileSelect = async (file: File) => {
    const validationErr = validateFile(file);
    if (validationErr) {
      setUploadState('error');
      setErrorMessage(validationErr);
      return;
    }

    setErrorMessage(null);
    setSuccessNotice(null);
    setPreviewUrl(null);
    setUploadState('presigning');
    setProgressPercent(0);
    setLoadedBytes(0);
    setTotalBytes(file.size);

    try {
      const resolvedMime =
        file.type ||
        (file.name.toLowerCase().endsWith('.pdf')
          ? 'application/pdf'
          : file.name.toLowerCase().endsWith('.mp4')
          ? 'video/mp4'
          : 'application/octet-stream');

      // Step 1: Request presigned upload
      const presign = await requestR2PresignedUpload({
        courseId,
        lessonId,
        materialType,
        fileName: file.name,
        contentType: resolvedMime,
        fileSizeBytes: file.size
      });

      // Step 2: Upload file via presigned PUT / chunked engine
      setUploadState('uploading');
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      await uploadFileToR2PresignedUrl({
        uploadUrl: presign.uploadUrl,
        objectKey: presign.objectKey,
        courseId,
        lessonId,
        materialType,
        file,
        contentType: resolvedMime,
        signal: abortController.signal,
        onProgress: (info) => {
          setLoadedBytes(info.loadedBytes);
          setTotalBytes(info.totalBytes);
          setProgressPercent(info.percent);
        }
      });

      const uploadedMeta: LmsR2AssetMetadata = {
        r2ObjectKey: presign.objectKey,
        r2FileName: file.name,
        r2MimeType: resolvedMime,
        r2FileSizeBytes: file.size,
        r2UploadedAt: new Date().toISOString(),
        r2StorageMode: presign.storageMode as R2StorageMode,
        sourceType: 'r2-upload'
      };

      const prefix =
        materialType === 'video' ? 'R2-VID' : materialType === 'notes' ? 'R2-NOT' : 'R2-PPT';
      const nextAssetId = `${prefix}-${courseId.slice(0, 3).toUpperCase()}-C${classNumber}`;

      setUploadState('completed');
      setSuccessNotice(`Uploaded ${file.name} to R2 storage.`);
      onUploadSuccess(uploadedMeta, nextAssetId);
    } catch (err: any) {
      setUploadState('error');
      setErrorMessage(err?.message || 'Failed to upload file to R2 Object Storage.');
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploadState('idle');
    setProgressPercent(0);
  };

  // URL Action 1: Save as Direct Streaming / Embed URL
  const handleSaveDirectUrl = () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a valid URL.');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setErrorMessage('URL must begin with http:// or https://');
      return;
    }

    setErrorMessage(null);
    const prefix =
      materialType === 'video' ? 'URL-VID' : materialType === 'notes' ? 'URL-NOT' : 'URL-PPT';
    const nextAssetId = `${prefix}-${courseId.slice(0, 3).toUpperCase()}-C${classNumber}`;

    if (onUrlChange) {
      onUrlChange(trimmed);
    }

    const updatedMeta: LmsR2AssetMetadata = {
      ...currentMetadata,
      sourceType: 'url',
      externalUrl: trimmed
    };
    onUploadSuccess(updatedMeta, assetIdValue || nextAssetId);
    setSuccessNotice('Saved direct URL as active material source.');
  };

  // URL Action 2: Ingest from remote URL into Cloudflare R2 bucket
  const handleIngestFromUrl = async () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a valid URL to upload to R2.');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setErrorMessage('URL must begin with http:// or https://');
      return;
    }

    setIsIngestingUrl(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const res = await uploadFromUrlToR2({
        url: trimmed,
        courseId,
        lessonId,
        materialType
      });

      const uploadedMeta: LmsR2AssetMetadata = {
        r2ObjectKey: res.objectKey,
        r2FileName: res.fileName,
        r2MimeType: res.contentType,
        r2FileSizeBytes: res.fileSizeBytes,
        r2UploadedAt: res.uploadedAt,
        r2StorageMode: res.storageMode,
        sourceType: 'r2-upload'
      };

      const prefix =
        materialType === 'video' ? 'R2-VID' : materialType === 'notes' ? 'R2-NOT' : 'R2-PPT';
      const nextAssetId = `${prefix}-${courseId.slice(0, 3).toUpperCase()}-C${classNumber}`;

      setSuccessNotice(`Ingested remote URL into R2 (${formatBytesTabular(res.fileSizeBytes)}).`);
      setSourceMode('r2-storage');
      onUploadSuccess(uploadedMeta, nextAssetId);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to ingest URL into R2 Object Storage.');
    } finally {
      setIsIngestingUrl(false);
    }
  };

  // URL Action 3: Preview URL
  const handlePreviewDirectUrl = () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setErrorMessage('Enter a URL first to preview.');
      return;
    }
    setErrorMessage(null);
    setVideoError(null);
    setPreviewUrl(trimmed);
  };

  const handleTestSignedRead = async () => {
    if (!currentMetadata.r2ObjectKey) return;
    setIsLoadingPreview(true);
    setErrorMessage(null);
    setVideoError(null);
    setVideoDuration(null);
    try {
      const res = await requestR2SignedReadUrl({
        objectKey: currentMetadata.r2ObjectKey,
        courseId,
        lessonId,
        materialType,
        studentId: 'ADMIN-PREVIEW'
      });
      setPreviewUrl(res.signedReadUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not generate signed read URL.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDeleteObject = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);
    if (currentMetadata.r2ObjectKey) {
      try {
        await deleteR2Object(currentMetadata.r2ObjectKey);
      } catch (err) {
        console.warn('Notice deleting R2 object:', err);
      }
    }
    if (onUrlChange) {
      onUrlChange('');
    }
    setInputUrl('');
    setPreviewUrl(null);
    setUploadState('idle');
    onRemoveR2Object();
  };

  const hasR2Object = Boolean(currentMetadata.r2ObjectKey);
  const hasDirectUrl = Boolean(inputUrl.trim() || currentMetadata.externalUrl);

  return (
    <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-emerald-700" />
            </div>
            <span className="text-xs font-bold text-slate-900">{label}</span>
          </div>

          {hasR2Object ? (
            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>R2 Stored</span>
            </span>
          ) : hasDirectUrl ? (
            <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1 font-mono bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>URL Active</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-slate-400">No Asset Yet</span>
          )}
        </div>

        {/* Option Toggle: R2 Object Storage vs URL */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Upload Method
            </span>
            <span className="text-[10px] text-slate-400">Choose storage source</span>
          </div>
          <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-xl gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setSourceMode('r2-storage');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                sourceMode === 'r2-storage'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px] truncate">R2 Storage</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceMode('url');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                sourceMode === 'url'
                  ? 'bg-white text-blue-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-[11px] truncate">By URL</span>
            </button>
          </div>
        </div>

        {/* Asset ID Input */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Asset Reference ID
          </label>
          <input
            type="text"
            value={assetIdValue}
            onChange={(e) => onAssetIdChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Current R2 Metadata Summary (when R2 Object is present) */}
      {hasR2Object && (
        <div className="bg-white rounded-xl border border-emerald-200/80 p-2.5 space-y-1.5 text-[11px] shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-slate-800 truncate" title={currentMetadata.r2FileName}>
              {currentMetadata.r2FileName || 'Uploaded Asset'}
            </span>
            <span className="font-mono tabular-nums text-emerald-700 font-bold shrink-0">
              {formatBytesTabular(currentMetadata.r2FileSizeBytes)}
            </span>
          </div>
          <div
            className="font-mono text-[10px] text-slate-500 truncate"
            title={currentMetadata.r2ObjectKey}
          >
            Key: {currentMetadata.r2ObjectKey}
          </div>
          {currentMetadata.r2UploadedAt && (
            <div className="font-mono tabular-nums text-[10px] text-slate-400">
              Uploaded: {new Date(currentMetadata.r2UploadedAt).toLocaleString()}
            </div>
          )}

          <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestSignedRead}
              disabled={isLoadingPreview}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              {isLoadingPreview ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <ExternalLink className="w-3 h-3" />
              )}
              <span>Verify Signed URL</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteObject}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}

      {/* Current Direct URL Summary (when active without R2 file) */}
      {!hasR2Object && hasDirectUrl && (
        <div className="bg-white rounded-xl border border-blue-200/80 p-2.5 space-y-1.5 text-[11px] shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-blue-900 truncate flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Direct Link Active</span>
            </span>
            <span className="font-mono text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 font-semibold">
              External URL
            </span>
          </div>
          <div className="font-mono text-[10px] text-slate-600 break-all line-clamp-2">
            {inputUrl || currentMetadata.externalUrl}
          </div>

          <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePreviewDirectUrl}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3" />
              <span>Preview URL</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteObject}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* Inline Preview Box with Error Boundary */}
      {previewUrl && (
        <VideoPlayerErrorBoundary fallbackTitle="Media Preview Render Error">
          <div className="bg-slate-900/95 text-white rounded-2xl p-3.5 space-y-2.5 text-[11px] border border-slate-800 shadow-xl transition-all">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Media Preview Active</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  setVideoError(null);
                  setVideoDuration(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 cursor-pointer transition-colors"
                title="Close Preview"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {materialType === 'video' ? (
              <div className="space-y-1.5">
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  preload="metadata"
                  controlsList="nodownload"
                  onLoadedMetadata={(e) => {
                    const d = e.currentTarget.duration;
                    if (d && !isNaN(d)) {
                      const mins = Math.floor(d / 60);
                      const secs = Math.floor(d % 60);
                      setVideoDuration(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
                    }
                    setVideoError(null);
                  }}
                  onError={() => {
                    setVideoError(
                      'Video stream unavailable or codec not supported directly in HTML5 player. If this is a YouTube/Vimeo/Stream URL, students can view via the interactive player stage.'
                    );
                  }}
                  className="w-full aspect-video rounded-xl bg-slate-950 border border-slate-800 shadow-inner object-contain max-h-48 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
                {videoDuration && (
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                    <span>Duration: {videoDuration}</span>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Full Screen</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
                {videoError && (
                  <div className="text-[10px] text-rose-300 bg-rose-950/60 p-2 rounded-lg border border-rose-800/80">
                    {videoError}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <iframe
                  src={previewUrl}
                  title="Document Preview"
                  className="w-full h-44 rounded-xl bg-white border border-slate-700"
                />
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-300 hover:underline font-semibold"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Document in Full Window</span>
                </a>
              </div>
            )}
          </div>
        </VideoPlayerErrorBoundary>
      )}

      {/* Active Upload Progress Bar */}
      {(uploadState === 'presigning' || uploadState === 'uploading') && (
        <div className="bg-white rounded-xl border border-amber-200 p-2.5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
            <span className="font-bold text-amber-800">
              {uploadState === 'presigning'
                ? 'Generating R2 Presigned PUT...'
                : `Uploading to R2: ${progressPercent}%`}
            </span>
            <span className="text-slate-500">
              {formatBytesTabular(loadedBytes)} / {formatBytesTabular(totalBytes)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <button
            type="button"
            onClick={handleCancelUpload}
            className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
          >
            Cancel Upload
          </button>
        </div>
      )}

      {/* Ingest from URL Progress Indicator */}
      {isIngestingUrl && (
        <div className="bg-white rounded-xl border border-blue-200 p-2.5 space-y-2 text-[11px]">
          <div className="flex items-center gap-2 text-blue-800 font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>Downloading and Ingesting URL into Cloudflare R2...</span>
          </div>
          <div className="text-[10px] text-slate-500">
            Streaming file from remote URL into persistent R2 bucket object.
          </div>
        </div>
      )}

      {/* Success Notice */}
      {successNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-start gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span className="leading-snug">{successNotice}</span>
        </div>
      )}

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* OPTION 1: R2 OBJECT STORAGE DRAG & DROP / FILE UPLOAD */}
      {sourceMode === 'r2-storage' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFile = e.dataTransfer.files?.[0];
            if (droppedFile) {
              handleFileSelect(droppedFile);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer shadow-2xs ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
              : 'border-slate-300 bg-white hover:border-emerald-600 hover:bg-slate-50/90 hover:shadow-xs'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={cfg.accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(file);
                e.target.value = '';
              }
            }}
          />
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <UploadCloud className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs font-bold text-slate-800">
              {hasR2Object ? 'Replace File in R2' : 'Upload to R2 Object Storage'}
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">{cfg.helperText}</p>
          </div>
        </div>
      )}

      {/* OPTION 2: UPLOAD / EMBED BY URL */}
      {sourceMode === 'url' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-3 shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Direct / Streaming URL</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">http(s)://</span>
            </div>
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setErrorMessage(null);
                setSuccessNotice(null);
              }}
              placeholder={cfg.urlPlaceholder}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-blue-600 font-mono transition-colors"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Supports Cloudflare Stream, Vimeo, YouTube, R2 Public URL, or direct MP4/PDF link.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            {/* Action A: Save as Direct URL */}
            <button
              type="button"
              onClick={handleSaveDirectUrl}
              className="py-1.5 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Use this URL directly without copying to R2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-[11px]">Save URL</span>
            </button>

            {/* Action B: Ingest from URL into R2 Bucket */}
            <button
              type="button"
              disabled={isIngestingUrl || !inputUrl.trim()}
              onClick={handleIngestFromUrl}
              className="py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Download remote file and upload into Cloudflare R2 bucket"
            >
              {isIngestingUrl ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <DownloadCloud className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="text-[11px]">Upload to R2</span>
            </button>
          </div>

          {inputUrl.trim() && (
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <button
                type="button"
                onClick={handlePreviewDirectUrl}
                className="text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>Test & Preview URL</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
