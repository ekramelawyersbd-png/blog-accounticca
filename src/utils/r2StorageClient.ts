export type R2MaterialType = 'video' | 'notes' | 'ppt';
export type R2StorageMode = 'cloudflare-r2' | 'local-fallback';

export interface R2StorageStatus {
  configured: boolean;
  storageMode: R2StorageMode;
  bucketName: string;
  endpointHost: string;
  signedUrlTtlSeconds: number;
  localObjectsCount: number;
}

export interface R2PresignUploadResponse {
  uploadUrl: string;
  method: 'PUT';
  objectKey: string;
  bucketName: string;
  storageMode: R2StorageMode;
  expiresInSeconds: number;
  headers?: Record<string, string>;
}

export interface R2PresignReadResponse {
  signedReadUrl: string;
  objectKey: string;
  storageMode: R2StorageMode;
  expiresInSeconds: number;
  expiresAt: string;
  authorizedFor: string;
}

export interface R2UploadProgressInfo {
  loadedBytes: number;
  totalBytes: number;
  percent: number;
}

// 512 KB raw slice -> ~682 KB Base64 JSON POST (avoids HTTP 413 and proxy streaming PUT errors)
const DEFAULT_JSON_CHUNK_BYTES = 512 * 1024;

export function sanitizeStorageFileName(name: string): string {
  return (
    name
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120) || 'material.bin'
  );
}

function sanitizePathSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9_-]/g, '') || 'default';
}

export function buildCourseMaterialObjectKey(params: {
  courseId: string;
  lessonId: string;
  materialType: R2MaterialType;
  fileName: string;
  timestamp?: number;
}): string {
  const safeCourse = sanitizePathSegment(params.courseId || 'course');
  const safeLesson = sanitizePathSegment(params.lessonId || 'lesson');
  const safeType = params.materialType;
  const safeFileName = sanitizeStorageFileName(params.fileName || 'asset.bin');
  const ts = params.timestamp || Date.now();

  return `lms/${safeCourse}/${safeLesson}/${safeType}/${ts}-${safeFileName}`;
}

export function parseCourseMaterialObjectKey(objectKey: string): {
  isValid: boolean;
  courseId?: string;
  lessonId?: string;
  materialType?: R2MaterialType;
  fileName?: string;
  timestamp?: number;
} {
  if (!objectKey || typeof objectKey !== 'string') {
    return { isValid: false };
  }
  const parts = objectKey.split('/');
  if (parts.length < 5 || parts[0] !== 'lms') {
    return { isValid: false };
  }
  const courseId = parts[1];
  const lessonId = parts[2];
  const materialType = parts[3] as R2MaterialType;
  const lastPart = parts.slice(4).join('/');
  const match = lastPart.match(/^(\d+)-(.*)$/);
  if (match) {
    return {
      isValid: true,
      courseId,
      lessonId,
      materialType,
      timestamp: parseInt(match[1], 10),
      fileName: match[2]
    };
  }
  return {
    isValid: true,
    courseId,
    lessonId,
    materialType,
    fileName: lastPart
  };
}

export function getCourseMaterialFolderPrefix(
  courseId: string,
  lessonId?: string,
  materialType?: R2MaterialType
): string {
  const safeCourse = sanitizePathSegment(courseId);
  if (!lessonId) return `lms/${safeCourse}/`;
  const safeLesson = sanitizePathSegment(lessonId);
  if (!materialType) return `lms/${safeCourse}/${safeLesson}/`;
  return `lms/${safeCourse}/${safeLesson}/${materialType}/`;
}

export const getCourseMaterialUploadUrl = requestR2PresignedUpload;
export const getCourseMaterialDownloadUrl = requestR2SignedReadUrl;
export const deleteCourseMaterialObject = deleteR2Object;

export async function fetchR2StorageStatus(): Promise<R2StorageStatus> {
  const res = await fetch('/api/r2/status');
  if (!res.ok) {
    throw new Error('Failed to check R2 storage status.');
  }
  return res.json();
}

export async function requestR2PresignedUpload(params: {
  courseId: string;
  lessonId: string;
  materialType: R2MaterialType;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
}): Promise<R2PresignUploadResponse> {
  const res = await fetch('/api/r2/presign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (res.ok) {
    const data = await res.json();
    if (data && data.uploadUrl) {
      return data;
    }
  }
  const errJson = await res.json().catch(() => ({}));
  throw new Error(errJson?.error || 'Failed to obtain presigned R2 upload URL.');
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read file slice for upload.'));
    reader.readAsDataURL(blob);
  });
}

function executeXhrPutUpload(params: {
  url: string;
  body: Blob | File;
  contentType: string;
  onProgress?: (progress: R2UploadProgressInfo) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { url, body, contentType, onProgress, signal } = params;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (signal) {
      if (signal.aborted) {
        return reject(new Error('Upload cancelled by user.'));
      }
      const onAbort = () => {
        xhr.abort();
        reject(new Error('Upload cancelled by user.'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress && body.size > 0) {
        const percent = Math.min(100, Math.round((event.loaded / body.size) * 100));
        onProgress({
          loadedBytes: event.loaded,
          totalBytes: body.size,
          percent
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) {
          onProgress({
            loadedBytes: body.size,
            totalBytes: body.size,
            percent: 100
          });
        }
        resolve();
      } else {
        reject(
          new Error(
            `R2 PUT upload failed with HTTP ${xhr.status}: ${xhr.statusText || 'Upload rejected'}`
          )
        );
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('CORS_OR_NETWORK_ERROR'));
    });

    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', contentType || 'application/octet-stream');
    xhr.send(body);
  });
}

async function executeChunkedServerUpload(params: {
  objectKey: string;
  courseId?: string;
  lessonId?: string;
  materialType?: R2MaterialType;
  file: File;
  contentType: string;
  onProgress?: (progress: R2UploadProgressInfo) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { objectKey, courseId, lessonId, materialType, file, contentType, onProgress, signal } =
    params;

  if (signal?.aborted) {
    throw new Error('Upload cancelled by user.');
  }

  // 1. Initialize chunked upload session on server via standard JSON POST
  const initRes = await fetch('/api/r2/chunk-upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      objectKey,
      fileName: file.name,
      contentType,
      fileSizeBytes: file.size,
      courseId: courseId || 'course',
      lessonId: lessonId || 'lesson',
      materialType: materialType || 'video'
    }),
    signal
  });

  const initData = await initRes.json();
  if (!initRes.ok || !initData?.sessionId) {
    throw new Error(initData?.error || 'Failed to initialize R2 chunked upload session.');
  }

  const sessionId: string = initData.sessionId;
  const chunkSize: number = Math.min(
    DEFAULT_JSON_CHUNK_BYTES,
    Number(initData.maxChunkBytes) || DEFAULT_JSON_CHUNK_BYTES
  );
  const totalBytes = file.size;
  const totalChunks = Math.max(1, Math.ceil(totalBytes / chunkSize));

  // 2. Upload each 512 KB slice as a standard JSON POST (retryable up to 3 times per chunk)
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    if (signal?.aborted) {
      throw new Error('Upload cancelled by user.');
    }

    const start = chunkIndex * chunkSize;
    const end = Math.min(totalBytes, start + chunkSize);
    const slice = file.slice(start, end);
    const chunkBase64 = await blobToBase64(slice);

    let uploadedChunk = false;
    let lastChunkErr: any = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      if (signal?.aborted) {
        throw new Error('Upload cancelled by user.');
      }
      try {
        const partRes = await fetch('/api/r2/chunk-upload/part', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            chunkIndex,
            chunkBase64
          }),
          signal
        });

        if (partRes.ok) {
          uploadedChunk = true;
          break;
        }
        const errBody = await partRes.json().catch(() => ({}));
        lastChunkErr = new Error(
          errBody?.error || `Chunk ${chunkIndex + 1}/${totalChunks} failed (${partRes.status})`
        );
      } catch (err: any) {
        if (signal?.aborted) throw err;
        lastChunkErr = err;
      }
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }

    if (!uploadedChunk) {
      throw lastChunkErr || new Error(`Failed to upload chunk ${chunkIndex + 1} of ${totalChunks}.`);
    }

    if (onProgress && totalBytes > 0) {
      const percent = Math.min(99, Math.round((end / totalBytes) * 100));
      onProgress({
        loadedBytes: end,
        totalBytes,
        percent
      });
    }
  }

  // 3. Finalize chunked upload session
  const completeRes = await fetch('/api/r2/chunk-upload/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
    signal
  });

  const completeData = await completeRes.json();
  if (!completeRes.ok || !completeData?.uploaded) {
    throw new Error(completeData?.error || 'Failed to finalize R2 chunked upload.');
  }

  if (onProgress) {
    onProgress({
      loadedBytes: totalBytes,
      totalBytes,
      percent: 100
    });
  }
}

export async function uploadFileToR2PresignedUrl(params: {
  uploadUrl: string;
  objectKey?: string;
  courseId?: string;
  lessonId?: string;
  materialType?: R2MaterialType;
  file: File;
  contentType: string;
  onProgress?: (progress: R2UploadProgressInfo) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const {
    uploadUrl,
    objectKey,
    courseId,
    lessonId,
    materialType,
    file,
    contentType,
    onProgress,
    signal
  } = params;

  const isLocalServerUrl = uploadUrl.startsWith('/');
  const resolvedObjectKey =
    objectKey ||
    `lms/${courseId || 'course'}/${lessonId || 'lesson'}/${materialType || 'video'}/${Date.now()}-${file.name}`;

  // When using server route, always use non-streaming JSON chunked upload to avoid HTTP 413 and proxy streaming errors
  if (isLocalServerUrl) {
    await executeChunkedServerUpload({
      objectKey: resolvedObjectKey,
      courseId,
      lessonId,
      materialType,
      file,
      contentType,
      onProgress,
      signal
    });
    return;
  }

  try {
    await executeXhrPutUpload({
      url: uploadUrl,
      body: file,
      contentType,
      onProgress,
      signal
    });
  } catch (err: any) {
    if (signal?.aborted) {
      throw err;
    }
    // Automatically fall back to non-streaming JSON chunked upload on CORS, network, or HTTP 413 errors
    await executeChunkedServerUpload({
      objectKey: resolvedObjectKey,
      courseId,
      lessonId,
      materialType,
      file,
      contentType,
      onProgress,
      signal
    });
  }
}

export async function requestR2SignedReadUrl(params: {
  objectKey: string;
  courseId: string;
  lessonId: string;
  materialType: R2MaterialType;
  studentId?: string;
}): Promise<R2PresignReadResponse> {
  let serverErrorMessage: string | null = null;
  try {
    const res = await fetch('/api/r2/presign-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.signedReadUrl) {
        return data;
      }
    } else {
      const errJson = await res.json().catch(() => ({}));
      serverErrorMessage = errJson?.error || `R2 storage server returned HTTP ${res.status}`;
    }
  } catch (netErr: any) {
    serverErrorMessage = netErr?.message || 'Network error reaching R2 presign service';
  }

  throw new Error(serverErrorMessage || 'Failed to generate signed R2 read URL.');
}

export async function deleteR2Object(objectKey: string): Promise<void> {
  const res = await fetch('/api/r2/object', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objectKey })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'Failed to delete R2 object.');
  }
}

export function formatByteSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let val = bytes;
  let idx = 0;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx++;
  }
  return `${val.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export const formatBytesTabular = formatByteSize;

export async function uploadFromUrlToR2(params: {
  url: string;
  courseId: string;
  lessonId: string;
  materialType: R2MaterialType;
  customFileName?: string;
}): Promise<{
  objectKey: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedAt: string;
  storageMode: R2StorageMode;
}> {
  const res = await fetch('/api/r2/upload-from-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Failed to download and ingest remote URL into R2 (${res.status})`);
  }

  const data = await res.json();
  return {
    objectKey: data.objectKey,
    fileName: data.fileName,
    contentType: data.contentType,
    fileSizeBytes: data.fileSizeBytes,
    uploadedAt: data.uploadedAt,
    storageMode: data.storageMode
  };
}
