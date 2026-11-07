/**
 * Frontend R2 Storage Utility Module
 * 
 * Provides unified, secure interaction with Firebase Cloud Functions
 * (Callable Functions: generateR2PresignedUploadUrl, generateR2TemporaryReadUrl, deleteR2CourseMaterialObject
 *  and HTTPS onRequest endpoints: r2PresignUploadEndpoint, r2TemporaryReadUrlEndpoint)
 * 
 * Enforces consistent file path management across all course materials:
 * Path schema: `lms/{courseId}/{lessonId}/{materialType}/{timestamp}-{sanitizedFileName}`
 */

import {
  R2MaterialType,
  R2StorageMode,
  R2StorageStatus,
  R2PresignUploadResponse,
  R2PresignReadResponse,
  R2UploadProgressInfo,
  fetchR2StorageStatus,
  uploadFileToR2PresignedUrl,
  uploadFromUrlToR2,
  requestR2PresignedUpload,
  requestR2SignedReadUrl,
  deleteR2Object,
  formatByteSize,
  formatBytesTabular
} from './r2StorageClient';

export type {
  R2MaterialType,
  R2StorageMode,
  R2StorageStatus,
  R2PresignUploadResponse,
  R2PresignReadResponse,
  R2UploadProgressInfo
};

export {
  fetchR2StorageStatus,
  uploadFileToR2PresignedUrl,
  uploadFromUrlToR2,
  requestR2PresignedUpload,
  requestR2SignedReadUrl,
  deleteR2Object,
  formatByteSize,
  formatBytesTabular
};

/**
 * Standard path schema generator for course materials in R2 Object Storage.
 * Generates uniform object keys:
 * `lms/{courseId}/{lessonId}/{materialType}/{timestamp}-{fileName}`
 */
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

/**
 * Parses a standard course material R2 object key into its constituent parts
 */
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
  // Expected: ['lms', courseId, lessonId, materialType, `${timestamp}-${fileName}`]
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

/**
 * Get standardized folder prefix for listing/querying course materials
 */
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

/**
 * Sanitize filename to prevent directory traversal or invalid URL characters
 */
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

/**
 * Requests a secure R2 Presigned Upload PUT URL by interacting with:
 * 1. Firebase Callable Cloud Function `generateR2PresignedUploadUrl` (when authenticated)
 * 2. Express Server proxy `/api/r2/presign-upload`
 */
export async function getCourseMaterialUploadUrl(params: {
  courseId: string;
  lessonId: string;
  materialType: R2MaterialType;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
}): Promise<R2PresignUploadResponse> {
  return requestR2PresignedUpload(params);
}

/**
 * Requests a temporary signed R2 GetObject read/download URL by interacting with:
 * 1. Firebase Callable Cloud Function `generateR2TemporaryReadUrl` (verifies enrollment)
 * 2. Express Server proxy `/api/r2/presign-read`
 */
export async function getCourseMaterialDownloadUrl(params: {
  objectKey: string;
  courseId: string;
  lessonId: string;
  materialType: R2MaterialType;
  studentId?: string;
}): Promise<R2PresignReadResponse> {
  return requestR2SignedReadUrl(params);
}

/**
 * Securely deletes a course material object from Cloudflare R2
 */
export async function deleteCourseMaterialObject(objectKey: string): Promise<void> {
  return deleteR2Object(objectKey);
}
