import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Lock,
  Layers,
  BookOpen,
  Search,
  Volume2,
  Square,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Eye,
  LayoutList,
  FileSpreadsheet,
  Sun,
  Moon,
  Coffee,
  AlertCircle,
  Pencil,
  Plus,
  Trash2,
  Save,
  X,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export interface StatutoryPdfSection {
  id: string;
  heading: string;
  statutoryRef: string;
  content: string;
  keyChecklist: string[];
}

export interface StatutoryPdfSlide {
  slideNumber: number;
  title: string;
  subtitle: string;
  bulletPoints: string[];
  keyTakeaway: string;
  statutoryCitation: string;
}

export interface ProtectedPdfReaderProps {
  /** Signed R2 URL or external PDF URL if uploaded */
  pdfUrl?: string | null;
  /** R2 object key if stored in R2 */
  r2ObjectKey?: string;
  /** File name of the uploaded PDF */
  fileName?: string;
  /** File size in bytes */
  fileSizeBytes?: number;
  /** Document title */
  title: string;
  /** Subtitle or course/class label */
  subtitle?: string;
  /** Dynamic student security watermark text */
  watermarkText: string;
  /** Structured statutory note sections (for multi-page statutory PDF handout rendering & sync) */
  sections?: StatutoryPdfSection[];
  /** Structured slide items (when used in PPT mode) */
  slides?: StatutoryPdfSlide[];
  /** Currently active section/page index (0-based) */
  activePageIndex?: number;
  /** Callback when user navigates to a page (0-based index) */
  onPageChange?: (pageIndex: number, totalPages: number) => void;
  /** Set of section IDs already marked read */
  readSectionIds?: string[];
  /** Callback to mark all notes/document complete */
  onCompleteDocument?: () => void;
  /** Whether signed URL is currently loading */
  isLoadingSignedUrl?: boolean;
  /** Callback to retry fetching signed URL */
  onRetrySignedUrl?: () => void;
  /** Admin callback to save updated Study Pages (sections) & document title */
  onAdminSaveSections?: (updatedSections: StatutoryPdfSection[], updatedTitle: string) => void;
  /** Admin callback to save updated PPT Study Slides & deck title */
  onAdminSaveSlides?: (updatedSlides: StatutoryPdfSlide[], updatedTitle: string) => void;
  /** Whether current user has admin privileges (defaults to true so admin controls are accessible) */
  isAdmin?: boolean;
}

type PaperTheme = 'light' | 'sepia' | 'dark';
type ReaderRenderMode = 'canvas-pdf' | 'embedded-pdf' | 'statutory-pages';
type ScrollLayoutMode = 'single' | 'continuous';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

const PDFJS_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfJsLoadPromise: Promise<any> | null = null;

function loadPdfJsLibrary(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window unavailable'));
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    return Promise.resolve(window.pdfjsLib);
  }
  if (pdfJsLoadPromise) return pdfJsLoadPromise;

  pdfJsLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${PDFJS_CDN_URL}"]`);
    if (existingScript && window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      resolve(window.pdfjsLib);
      return;
    }

    const script = document.createElement('script');
    script.src = PDFJS_CDN_URL;
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js loaded but pdfjsLib global was not found.'));
      }
    };
    script.onerror = () => {
      pdfJsLoadPromise = null;
      reject(new Error('Failed to load PDF.js rendering engine.'));
    };
    document.head.appendChild(script);
  });

  return pdfJsLoadPromise;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const EMPTY_SECTIONS: StatutoryPdfSection[] = [];
const EMPTY_SLIDES: StatutoryPdfSlide[] = [];
const EMPTY_READ_IDS: string[] = [];

export const ProtectedPdfReader: React.FC<ProtectedPdfReaderProps> = ({
  pdfUrl,
  r2ObjectKey,
  fileName,
  fileSizeBytes,
  title,
  subtitle,
  watermarkText,
  sections = EMPTY_SECTIONS,
  slides = EMPTY_SLIDES,
  activePageIndex = 0,
  onPageChange,
  readSectionIds = EMPTY_READ_IDS,
  onCompleteDocument,
  isLoadingSignedUrl = false,
  onRetrySignedUrl,
  onAdminSaveSections,
  onAdminSaveSlides,
  isAdmin = true,
}) => {
  const hasUploadedPdf = Boolean(pdfUrl || r2ObjectKey);

  // Determine initial mode: if a PDF URL or R2 object key is present, use 'canvas-pdf'; otherwise 'statutory-pages'
  const [renderMode, setRenderMode] = useState<ReaderRenderMode>(
    hasUploadedPdf ? 'canvas-pdf' : 'statutory-pages'
  );
  const [scrollLayout, setScrollLayout] = useState<ScrollLayoutMode>('single');
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [paperTheme, setPaperTheme] = useState<PaperTheme>('light');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
  const [securityToast, setSecurityToast] = useState<string | null>(null);
  const [adminSaveNotice, setAdminSaveNotice] = useState<string | null>(null);

  // Admin Edit Mode State for Study Pages
  const [isAdminEditing, setIsAdminEditing] = useState<boolean>(false);
  const [draftTitle, setDraftTitle] = useState<string>(title);
  const [draftSections, setDraftSections] = useState<StatutoryPdfSection[]>(sections);
  const [draftSlides, setDraftSlides] = useState<StatutoryPdfSlide[]>(slides);

  // PDF.js state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPdfPages, setNumPdfPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>((activePageIndex || 0) + 1);
  const [pageInputText, setPageInputText] = useState<string>(String((activePageIndex || 0) + 1));
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);

  // TTS state for reading active page aloud
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const readerContainerRef = useRef<HTMLDivElement>(null);
  const singleCanvasRef = useRef<HTMLCanvasElement>(null);
  const continuousCanvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const renderTaskRef = useRef<any>(null);

  // Sync renderMode when pdfUrl / r2ObjectKey becomes available
  useEffect(() => {
    if (pdfUrl || r2ObjectKey) {
      setRenderMode((prev) => (prev === 'statutory-pages' ? 'canvas-pdf' : prev));
    } else {
      setRenderMode('statutory-pages');
    }
  }, [pdfUrl, r2ObjectKey]);

  // Sync external activePageIndex changes
  useEffect(() => {
    const targetPage = (activePageIndex || 0) + 1;
    setCurrentPage(targetPage);
    setPageInputText(String(targetPage));
  }, [activePageIndex]);

  const activeSectionsList = isAdminEditing ? draftSections : sections;
  const activeSlidesList = isAdminEditing ? draftSlides : slides;

  // Total pages calculation depending on active mode
  const statutoryPagesCount = useMemo(() => {
    if (activeSectionsList.length > 0) return activeSectionsList.length;
    if (activeSlidesList.length > 0) return activeSlidesList.length;
    return 1;
  }, [activeSectionsList.length, activeSlidesList.length]);

  const totalPages = useMemo(() => {
    if (renderMode === 'canvas-pdf' && numPdfPages > 0) {
      return numPdfPages;
    }
    return statutoryPagesCount;
  }, [renderMode, numPdfPages, statutoryPagesCount]);

  // Trigger security toast when user attempts copy/print/save/context-menu
  const triggerProtectionNotice = useCallback((actionLabel: string) => {
    setSecurityToast(
      `Protected Reader: ${actionLabel} is disabled. Authorized read-only access for enrolled students.`
    );
  }, []);

  useEffect(() => {
    if (!securityToast) return;
    const timer = setTimeout(() => setSecurityToast(null), 3200);
    return () => clearTimeout(timer);
  }, [securityToast]);

  useEffect(() => {
    if (!adminSaveNotice) return;
    const timer = setTimeout(() => setAdminSaveNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [adminSaveNotice]);

  // Build proxied PDF URL for CORS-free binary fetching in PDF.js
  const proxiedPdfUrl = useMemo(() => {
    if (!pdfUrl && !r2ObjectKey) return null;
    if (pdfUrl && pdfUrl.startsWith('/api/r2/local-object/')) {
      return pdfUrl;
    }
    const params = new URLSearchParams();
    if (pdfUrl) params.set('url', pdfUrl);
    if (r2ObjectKey) params.set('objectKey', r2ObjectKey);
    return `/api/r2/pdf-proxy?${params.toString()}`;
  }, [pdfUrl, r2ObjectKey]);

  // Load PDF document via PDF.js when in canvas-pdf mode
  const loadPdfDocument = useCallback(async () => {
    if (!proxiedPdfUrl) return;
    setIsPdfLoading(true);
    setPdfLoadError(null);

    try {
      const pdfjsLib = await loadPdfJsLibrary();
      const response = await fetch(proxiedPdfUrl);
      if (!response.ok) {
        throw new Error(`Unable to stream PDF document (HTTP ${response.status}).`);
      }
      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength < 10) {
        throw new Error('PDF document stream is empty.');
      }

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const loadedDoc = await loadingTask.promise;
      setPdfDoc(loadedDoc);
      setNumPdfPages(loadedDoc.numPages || 1);
      setCurrentPage(1);
      setPageInputText('1');
    } catch (err: any) {
      console.warn('[ProtectedPdfReader] PDF.js load notice:', err);
      setPdfLoadError(err?.message || 'Unable to render PDF on canvas.');
      if (pdfUrl) {
        setRenderMode('embedded-pdf');
      } else {
        setRenderMode('statutory-pages');
      }
    } finally {
      setIsPdfLoading(false);
    }
  }, [proxiedPdfUrl, pdfUrl]);

  useEffect(() => {
    if (renderMode === 'canvas-pdf' && proxiedPdfUrl) {
      loadPdfDocument();
    }
  }, [renderMode, proxiedPdfUrl, loadPdfDocument]);

  // Render a single PDF page onto a given canvas
  const renderPageToCanvas = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement | null) => {
      if (!pdfDoc || !canvas) return;
      try {
        const page = await pdfDoc.getPage(pageNumber);
        const scale = (zoom / 100) * 1.45;
        const viewport = page.getViewport({ scale, rotation });
        const context = canvas.getContext('2d');
        if (!context) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport,
        };

        await page.render(renderContext).promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`[ProtectedPdfReader] Page ${pageNumber} render notice:`, err);
        }
      }
    },
    [pdfDoc, zoom, rotation]
  );

  // Render current page in single-page mode
  useEffect(() => {
    if (renderMode !== 'canvas-pdf' || !pdfDoc || scrollLayout !== 'single') return;
    let cancelled = false;

    const renderSingle = async () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
      if (!cancelled && singleCanvasRef.current) {
        await renderPageToCanvas(currentPage, singleCanvasRef.current);
      }
    };

    renderSingle();
    return () => {
      cancelled = true;
    };
  }, [renderMode, pdfDoc, currentPage, zoom, rotation, scrollLayout, renderPageToCanvas]);

  // Render all pages in continuous mode
  useEffect(() => {
    if (renderMode !== 'canvas-pdf' || !pdfDoc || scrollLayout !== 'continuous') return;
    let cancelled = false;

    const renderAll = async () => {
      for (let p = 1; p <= numPdfPages; p++) {
        if (cancelled) break;
        const canvas = continuousCanvasRefs.current[p];
        if (canvas) {
          await renderPageToCanvas(p, canvas);
        }
      }
    };

    renderAll();
    return () => {
      cancelled = true;
    };
  }, [renderMode, pdfDoc, numPdfPages, zoom, rotation, scrollLayout, renderPageToCanvas]);

  // Navigate to specific page (1-based)
  const goToPage = useCallback(
    (targetPage: number) => {
      const clamped = Math.max(1, Math.min(totalPages, targetPage));
      setCurrentPage(clamped);
      setPageInputText(String(clamped));
      if (onPageChange) {
        onPageChange(clamped - 1, totalPages);
      }
      if (scrollLayout === 'continuous' && renderMode === 'canvas-pdf') {
        const canvasEl = continuousCanvasRefs.current[clamped];
        if (canvasEl) {
          canvasEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [totalPages, onPageChange, scrollLayout, renderMode]
  );

  // Admin Edit Actions for Study Pages
  const handleStartAdminEdit = () => {
    setRenderMode('statutory-pages');
    setDraftTitle(title);
    setDraftSections(
      sections.length > 0
        ? sections.map((s) => ({ ...s, keyChecklist: [...(s.keyChecklist || [])] }))
        : []
    );
    setDraftSlides(
      slides.length > 0
        ? slides.map((s) => ({ ...s, bulletPoints: [...(s.bulletPoints || [])] }))
        : []
    );
    setIsAdminEditing(true);
  };

  const handleCancelAdminEdit = () => {
    setDraftTitle(title);
    setDraftSections(sections);
    setDraftSlides(slides);
    setIsAdminEditing(false);
  };

  const handleSaveAdminEdit = () => {
    if (draftSections.length > 0 && onAdminSaveSections) {
      const cleanedSections = draftSections.map((sec, idx) => ({
        id: sec.id || `sec_${idx + 1}`,
        heading: sec.heading.trim() || `Section ${idx + 1}`,
        statutoryRef: sec.statutoryRef.trim() || 'Income Tax Act, 2023',
        content: sec.content.trim(),
        keyChecklist: sec.keyChecklist.map((pt) => pt.trim()).filter(Boolean),
      }));
      onAdminSaveSections(cleanedSections, draftTitle.trim() || title);
      setAdminSaveNotice(
        `Saved ${cleanedSections.length} Study Page(s) to Course Curriculum & Firestore.`
      );
    } else if (draftSlides.length > 0 && onAdminSaveSlides) {
      const cleanedSlides = draftSlides.map((sl, idx) => ({
        slideNumber: idx + 1,
        title: sl.title.trim() || `Slide ${idx + 1}`,
        subtitle: sl.subtitle.trim() || 'Statutory Overview',
        bulletPoints: sl.bulletPoints.map((pt) => pt.trim()).filter(Boolean),
        keyTakeaway: sl.keyTakeaway.trim(),
        statutoryCitation: sl.statutoryCitation.trim() || 'Statutory Reference',
      }));
      onAdminSaveSlides(cleanedSlides, draftTitle.trim() || title);
      setAdminSaveNotice(
        `Saved ${cleanedSlides.length} Study Slide(s) to Course Curriculum & Firestore.`
      );
    }
    setIsAdminEditing(false);
  };

  const handleAddStudyPage = () => {
    if (draftSections.length > 0 || sections.length > 0 || slides.length === 0) {
      const newPageIndex = draftSections.length + 1;
      const newSec: StatutoryPdfSection = {
        id: `sec_${Date.now()}_${newPageIndex}`,
        heading: `New Statutory Study Page ${newPageIndex}`,
        statutoryRef: 'Income Tax Act, 2023 · Compliance Provision',
        content:
          'Enter comprehensive statutory commentary, legal interpretation, computation rules, and practical compliance steps for this study page.',
        keyChecklist: [
          'Verify primary statutory threshold and documentary evidence.',
          'Cross-check withholding certificate / A-Challan deposit particulars.',
        ],
      };
      const updated = [...draftSections, newSec];
      setDraftSections(updated);
      setCurrentPage(updated.length);
      setPageInputText(String(updated.length));
    } else {
      const newSlideNum = draftSlides.length + 1;
      const newSlide: StatutoryPdfSlide = {
        slideNumber: newSlideNum,
        title: `New Presentation Slide ${newSlideNum}`,
        subtitle: 'Statutory Provision Overview',
        bulletPoints: [
          'Key statutory requirement and filing obligation',
          'Practical audit verification step',
        ],
        keyTakeaway: 'Ensure timely compliance and documentation retention.',
        statutoryCitation: 'Income Tax Act, 2023',
      };
      const updated = [...draftSlides, newSlide];
      setDraftSlides(updated);
      setCurrentPage(updated.length);
      setPageInputText(String(updated.length));
    }
  };

  const handleDeleteCurrentStudyPage = () => {
    const idx = currentPage - 1;
    if (draftSections.length > 1) {
      const next = draftSections.filter((_, i) => i !== idx);
      setDraftSections(next);
      const nextPage = Math.max(1, Math.min(currentPage, next.length));
      setCurrentPage(nextPage);
      setPageInputText(String(nextPage));
    } else if (draftSlides.length > 1) {
      const next = draftSlides.filter((_, i) => i !== idx);
      setDraftSlides(next);
      const nextPage = Math.max(1, Math.min(currentPage, next.length));
      setCurrentPage(nextPage);
      setPageInputText(String(nextPage));
    }
  };

  const handleMoveStudyPage = (direction: 'up' | 'down') => {
    const idx = currentPage - 1;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (draftSections.length > 1) {
      if (targetIdx < 0 || targetIdx >= draftSections.length) return;
      const copy = [...draftSections];
      const [moved] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, moved);
      setDraftSections(copy);
      setCurrentPage(targetIdx + 1);
      setPageInputText(String(targetIdx + 1));
    } else if (draftSlides.length > 1) {
      if (targetIdx < 0 || targetIdx >= draftSlides.length) return;
      const copy = [...draftSlides];
      const [moved] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, moved);
      setDraftSlides(copy.map((s, i) => ({ ...s, slideNumber: i + 1 })));
      setCurrentPage(targetIdx + 1);
      setPageInputText(String(targetIdx + 1));
    }
  };

  // Keyboard navigation & copy/print blocking when reader is active
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow normal copy/paste/editing shortcuts when Admin Edit Mode is active inside form inputs
    if (
      isAdminEditing &&
      (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
    ) {
      return;
    }

    if ((e.ctrlKey || e.metaKey) && ['c', 'p', 's', 'u'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      e.stopPropagation();
      const actionMap: Record<string, string> = {
        c: 'Copying text (Ctrl+C)',
        p: 'Printing document (Ctrl+P)',
        s: 'Saving/Downloading file (Ctrl+S)',
        u: 'Viewing source',
      };
      triggerProtectionNotice(actionMap[e.key.toLowerCase()] || 'Action');
      return;
    }

    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      goToPage(currentPage + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      goToPage(currentPage - 1);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      setZoom((z) => Math.min(200, z + 15));
    } else if (e.key === '-') {
      e.preventDefault();
      setZoom((z) => Math.max(60, z - 15));
    } else if (e.key === 'Escape' && isFullscreen) {
      setIsFullscreen(false);
    }
  };

  // Text-to-Speech (TTS) audio narration for active statutory page
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let textToSpeak = `${title}. `;
    const activeSec = activeSectionsList[currentPage - 1];
    const activeSlide = activeSlidesList[currentPage - 1];

    if (activeSec) {
      textToSpeak += `Page ${currentPage}: ${activeSec.heading}. Statutory Reference: ${activeSec.statutoryRef}. ${activeSec.content}. Key Verification Checklist: ${activeSec.keyChecklist.join('. ')}`;
    } else if (activeSlide) {
      textToSpeak += `Slide ${currentPage}: ${activeSlide.title}. ${activeSlide.subtitle}. ${activeSlide.bulletPoints.join('. ')}. Key Takeaway: ${activeSlide.keyTakeaway}`;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.98;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Filter matching sections when search query is typed
  const matchingPageNumbers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const matches: number[] = [];
    activeSectionsList.forEach((sec, idx) => {
      const hay = `${sec.heading} ${sec.statutoryRef} ${sec.content} ${sec.keyChecklist.join(' ')}`.toLowerCase();
      if (hay.includes(q)) matches.push(idx + 1);
    });
    activeSlidesList.forEach((sl, idx) => {
      const hay = `${sl.title} ${sl.subtitle} ${sl.bulletPoints.join(' ')} ${sl.keyTakeaway}`.toLowerCase();
      if (hay.includes(q) && !matches.includes(idx + 1)) matches.push(idx + 1);
    });
    return matches;
  }, [searchQuery, activeSectionsList, activeSlidesList]);

  const canvasFilterStyle = useMemo(() => {
    if (paperTheme === 'sepia') {
      return 'sepia(0.32) contrast(0.96) brightness(0.98)';
    }
    if (paperTheme === 'dark') {
      return 'invert(0.9) hue-rotate(180deg) contrast(1.05)';
    }
    return 'none';
  }, [paperTheme]);

  const paperSurfaceClasses = useMemo(() => {
    if (paperTheme === 'sepia') {
      return 'bg-[#f8f1e0] text-[#2d2216] border-[#decbb1]';
    }
    if (paperTheme === 'dark') {
      return 'bg-slate-900 text-slate-100 border-slate-700';
    }
    return 'bg-white text-slate-900 border-slate-200';
  }, [paperTheme]);

  const activeSection = activeSectionsList[currentPage - 1] || activeSectionsList[0];
  const activeSlide = activeSlidesList[currentPage - 1] || activeSlidesList[0];

  // Clean shielded URL for embedded PDF fallback (strips browser toolbar/download bar)
  const shieldedEmbedUrl = useMemo(() => {
    const raw = proxiedPdfUrl || pdfUrl;
    if (!raw) return '';
    const base = raw.split('#')[0];
    return `${base}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
  }, [proxiedPdfUrl, pdfUrl]);

  const canEditStudyPages =
    isAdmin && Boolean(onAdminSaveSections || onAdminSaveSlides);

  return (
    <div
      ref={readerContainerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onContextMenu={(e) => {
        if (isAdminEditing) return;
        e.preventDefault();
        e.stopPropagation();
        triggerProtectionNotice('Right-click menu');
      }}
      onCopy={(e) => {
        if (isAdminEditing) return;
        e.preventDefault();
        e.stopPropagation();
        triggerProtectionNotice('Copying content');
      }}
      onCut={(e) => {
        if (isAdminEditing) return;
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragStart={(e) => {
        if (isAdminEditing) return;
        e.preventDefault();
      }}
      className={`${
        isAdminEditing ? 'select-text' : 'select-none'
      } rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-xl overflow-hidden flex flex-col focus:outline-none transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 h-screen w-screen' : ''
      }`}
    >
      {/* 1. TOP PDF READER STATUS & DRM PROTECTION BAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white truncate">{fileName || title}</span>
              {fileSizeBytes ? (
                <span className="font-mono text-[11px] text-slate-400 shrink-0">
                  ({formatBytes(fileSizeBytes)})
                </span>
              ) : null}
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-700/50 text-[10px] font-mono text-emerald-300 shrink-0">
                <Lock className="w-2.5 h-2.5" />
                Read-Only Protected PDF
              </span>
            </div>
            {subtitle && (
              <div className="text-[11px] text-slate-400 truncate">{subtitle}</div>
            )}
          </div>
        </div>

        {/* Mode Switcher & Admin Study Pages Edit Trigger */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 gap-0.5">
            {hasUploadedPdf && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminEditing(false);
                    setRenderMode('canvas-pdf');
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    renderMode === 'canvas-pdf'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Protected Canvas PDF Reader (No Browser Toolbar)"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Canvas PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminEditing(false);
                    setRenderMode('embedded-pdf');
                  }}
                  className="hidden"
                  title="Embedded Stream Reader"
                >
                  <Eye className="w-3 h-3" />
                  <span>Stream View</span>
                </button>
              </>
            )}

            {(sections.length > 0 || slides.length > 0) && (
              <button
                type="button"
                onClick={() => setRenderMode('statutory-pages')}
                className="hidden"
                title="Interactive Statutory Handout Pages"
              >
                <BookOpen className="w-3 h-3" />
                <span>Study Pages</span>
              </button>
            )}

            {canEditStudyPages && (
              <button
                type="button"
                onClick={() => {
                  if (isAdminEditing) {
                    handleCancelAdminEdit();
                  } else {
                    handleStartAdminEdit();
                  }
                }}
                className="hidden"
                title="Admin Option: Edit Study Pages Content & Sections"
              >
                <Pencil className="w-3 h-3" />
                <span>{isAdminEditing ? 'Editing Study Pages' : 'Admin Edit'}</span>
              </button>
            )}
          </div>

          {onRetrySignedUrl && hasUploadedPdf && (
            <button
              type="button"
              onClick={onRetrySignedUrl}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
              title="Refresh Signed PDF Stream"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSignedUrl ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* 2. INTERACTIVE PDF READER CONTROL TOOLBAR */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Sidebar Toggle + Page Navigation */}
        <div className="flex items-center gap-1.5">
          {renderMode !== 'embedded-pdf' && (
            <button
              type="button"
              onClick={() => setShowSidebar((s) => !s)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                showSidebar
                  ? 'bg-slate-800 border-emerald-500/50 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Toggle Page Outline & Thumbnails"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          )}

          {renderMode !== 'embedded-pdf' && (
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => goToPage(1)}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Previous Page (Left Arrow)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const parsed = parseInt(pageInputText, 10);
                  if (!Number.isNaN(parsed)) goToPage(parsed);
                }}
                className="flex items-center gap-1 font-mono text-[11px]"
              >
                <span className="text-slate-400">Page</span>
                <input
                  type="text"
                  value={pageInputText}
                  onChange={(e) => setPageInputText(e.target.value)}
                  onBlur={() => {
                    const parsed = parseInt(pageInputText, 10);
                    if (!Number.isNaN(parsed)) goToPage(parsed);
                    else setPageInputText(String(currentPage));
                  }}
                  className="w-9 text-center bg-slate-900 border border-slate-700 rounded py-0.5 text-white font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="text-slate-400">of {totalPages}</span>
              </form>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Next Page (Right Arrow)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(totalPages)}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {renderMode === 'canvas-pdf' && numPdfPages > 1 && (
            <button
              type="button"
              onClick={() =>
                setScrollLayout((prev) => (prev === 'single' ? 'continuous' : 'single'))
              }
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white cursor-pointer"
              title="Switch Single Page vs Continuous Scroll"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{scrollLayout === 'single' ? 'Single Page' : 'Continuous'}</span>
            </button>
          )}
        </div>

        {/* Center: Zoom & Rotate Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(60, z - 15))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="font-mono tabular-nums text-[11px] font-bold text-emerald-400 px-1.5 hover:underline cursor-pointer"
              title="Reset Zoom to 100%"
            >
              {zoom}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(200, z + 15))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {renderMode !== 'embedded-pdf' && (
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Rotate Page 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Paper Reading Theme Switcher */}
          <div className="hidden sm:flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setPaperTheme('light')}
              className={`p-1 rounded cursor-pointer ${
                paperTheme === 'light' ? 'bg-slate-800 text-amber-300' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Original Paper Theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPaperTheme('sepia')}
              className={`p-1 rounded cursor-pointer ${
                paperTheme === 'sepia' ? 'bg-slate-800 text-amber-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Sepia Eye-Comfort Theme"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPaperTheme('dark')}
              className={`p-1 rounded cursor-pointer ${
                paperTheme === 'dark' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Night Dark Contrast Theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Search, Read Aloud (TTS), Fullscreen */}
        <div className="flex items-center gap-1.5">
          {(activeSectionsList.length > 0 || activeSlidesList.length > 0) && (
            <>
              <button
                type="button"
                onClick={() => setShowSearchBar((s) => !s)}
                className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                  showSearchBar
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Search within Document"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleToggleSpeech}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isSpeaking
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Listen to Current Page (Text-to-Speech)"
              >
                {isSpeaking ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span className="hidden sm:inline">Stop Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Listen</span>
                  </>
                )}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand Fullscreen PDF Reader'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Optional In-Document Search Bar */}
      {showSearchBar && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search statutory terms, sections, or citations in this PDF..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          {searchQuery.trim() && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400">
                {matchingPageNumbers.length > 0
                  ? `Found on page(s):`
                  : 'No matches in pages'}
              </span>
              {matchingPageNumbers.map((pageNum) => (
                <button
                  key={`match-p-${pageNum}`}
                  type="button"
                  onClick={() => {
                    if (renderMode === 'embedded-pdf') setRenderMode('statutory-pages');
                    goToPage(pageNum);
                  }}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
                  }`}
                >
                  P.{pageNum}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Save Confirmation Banner */}
      {adminSaveNotice && (
        <div className="bg-emerald-950/95 border-b border-emerald-700/80 px-4 py-2 text-xs text-emerald-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{adminSaveNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdminSaveNotice(null)}
            className="text-[11px] text-emerald-300 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Security Protection Toast Banner */}
      {securityToast && (
        <div className="bg-amber-950/95 border-b border-amber-700/80 px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{securityToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSecurityToast(null)}
            className="text-[11px] text-amber-300 hover:text-white underline cursor-pointer"
          >
            OK
          </button>
        </div>
      )}

      {/* 3. MAIN PDF READER VIEWPORT (Sidebar + Document Canvas Stage) */}
      <div
        className={`flex flex-1 overflow-hidden relative ${
          isFullscreen ? 'h-[calc(100vh-110px)]' : 'h-[620px]'
        }`}
      >
        {/* Left Page Thumbnails / Statutory Outline Sidebar */}
        {showSidebar && renderMode !== 'embedded-pdf' && (
          <div className="w-52 sm:w-60 bg-slate-900/90 border-r border-slate-800 overflow-y-auto p-3 space-y-2 shrink-0 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1 flex items-center justify-between">
                <span>Document Pages ({totalPages})</span>
                <Layers className="w-3 h-3 text-emerald-400" />
              </div>

              {Array.from({ length: totalPages }, (_, idx) => {
                const pageNum = idx + 1;
                const isCurrent = currentPage === pageNum;
                const sec = activeSectionsList[idx];
                const sl = activeSlidesList[idx];
                const isRead = sec ? readSectionIds.includes(sec.id) : false;

                return (
                  <button
                    key={`thumb-page-${pageNum}`}
                    type="button"
                    onClick={() => goToPage(pageNum)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isCurrent
                        ? 'bg-emerald-950/80 border-emerald-500/70 text-white shadow-sm'
                        : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-7 h-9 rounded border flex flex-col items-center justify-center font-mono text-[11px] font-bold shrink-0 ${
                        isCurrent
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      {pageNum}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">
                        {renderMode === 'canvas-pdf'
                          ? `PDF Page ${pageNum}`
                          : sec
                          ? sec.heading
                          : sl
                          ? sl.title
                          : `PDF Page ${pageNum}`}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        {renderMode === 'canvas-pdf' ? (
                          <span>Protected Page</span>
                        ) : sec ? (
                          <span>{sec.statutoryRef}</span>
                        ) : sl ? (
                          <span>{sl.statutoryCitation}</span>
                        ) : (
                          <span>Protected Page</span>
                        )}
                      </div>
                    </div>
                    {isRead && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {canEditStudyPages && renderMode === 'statutory-pages' && (
              <div className="pt-3 border-t border-slate-800 space-y-1.5">
                {!isAdminEditing ? (
                  <button
                    type="button"
                    onClick={handleStartAdminEdit}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Study Pages</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddStudyPage}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Study Page</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right Document Stage */}
        <div className="flex-1 bg-slate-950 overflow-auto relative flex flex-col items-center p-4 sm:p-6">
          {/* Dynamic Repeating Security Watermark Overlay (Non-Interactive) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden flex flex-col justify-around items-center opacity-15 select-none"
          >
            <div className="-rotate-12 text-xs sm:text-sm font-mono font-bold text-slate-400 tracking-widest whitespace-nowrap">
              {watermarkText} · DO NOT COPY OR DOWNLOAD
            </div>
            <div className="-rotate-12 text-xs sm:text-sm font-mono font-bold text-slate-400 tracking-widest whitespace-nowrap">
              {watermarkText} · PROTECTED STATUTORY READER
            </div>
            <div className="-rotate-12 text-xs sm:text-sm font-mono font-bold text-slate-400 tracking-widest whitespace-nowrap">
              {watermarkText} · AUTHORIZED LMS ACCESS ONLY
            </div>
          </div>

          {/* MODE A: REAL PDF.JS CANVAS RENDERER */}
          {renderMode === 'canvas-pdf' && (
            <div className="relative z-10 flex flex-col items-center w-full">
              {isLoadingSignedUrl || isPdfLoading ? (
                <div className="my-auto py-20 text-center space-y-3">
                  <RefreshCw className="w-7 h-7 animate-spin text-emerald-400 mx-auto" />
                  <div className="text-sm font-bold text-slate-200">
                    Rendering Protected PDF Pages...
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Initializing DRM Canvas Stream · Direct Download Disabled
                  </div>
                </div>
              ) : pdfLoadError ? (
                <div className="my-auto max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">
                      Switching to Protected Stream View
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {pdfLoadError}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {pdfUrl && (
                      <button
                        type="button"
                        onClick={() => setRenderMode('embedded-pdf')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Open Protected Stream View
                      </button>
                    )}
                    {(activeSectionsList.length > 0 || activeSlidesList.length > 0) && (
                      <button
                        type="button"
                        onClick={() => setRenderMode('statutory-pages')}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                      >
                        View Statutory Study Pages
                      </button>
                    )}
                  </div>
                </div>
              ) : scrollLayout === 'single' ? (
                <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white">
                  <canvas
                    ref={singleCanvasRef}
                    style={{ filter: canvasFilterStyle }}
                    className="block max-w-full h-auto pointer-events-none select-none"
                  />
                </div>
              ) : (
                <div className="space-y-6 flex flex-col items-center">
                  {Array.from({ length: numPdfPages }, (_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <div
                        key={`cont-canvas-${pageNum}`}
                        className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white"
                      >
                        <div className="bg-slate-900/90 text-slate-300 text-[10px] font-mono px-3 py-1 flex items-center justify-between border-b border-slate-800">
                          <span>Page {pageNum} of {numPdfPages}</span>
                          <span>{watermarkText}</span>
                        </div>
                        <canvas
                          ref={(el) => {
                            continuousCanvasRefs.current[pageNum] = el;
                          }}
                          style={{ filter: canvasFilterStyle }}
                          className="block max-w-full h-auto pointer-events-none select-none"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MODE B: EMBEDDED SHIELDED PDF STREAM VIEW */}
          {renderMode === 'embedded-pdf' && shieldedEmbedUrl && (
            <div
              className="relative z-10 w-full h-full flex flex-col rounded-xl overflow-hidden border border-slate-700 bg-white"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                filter: canvasFilterStyle,
              }}
            >
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  triggerProtectionNotice('Toolbar download/print action');
                }}
                className="h-11 w-full bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between text-[11px] font-mono text-slate-300 z-30 shrink-0 cursor-not-allowed"
              >
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Protected PDF Stream · Download & Print Locked
                </span>
                <span className="truncate max-w-xs">{watermarkText}</span>
              </div>

              <iframe
                src={shieldedEmbedUrl}
                title={title}
                sandbox="allow-scripts allow-same-origin"
                className="w-full flex-1 bg-white border-0"
              />
            </div>
          )}

          {/* MODE C: MULTI-PAGE FORMATTED STATUTORY PDF DOCUMENT HANDOUT (WITH INLINE ADMIN EDITOR) */}
          {renderMode === 'statutory-pages' && (
            <div
              style={{
                width: `${Math.min(100, Math.max(65, zoom * 0.85))}%`,
                transform: `rotate(${rotation}deg)`,
              }}
              className={`relative z-30 max-w-3xl w-full rounded-xl border shadow-2xl p-6 sm:p-10 transition-all duration-200 flex flex-col justify-between min-h-[480px] ${paperSurfaceClasses}`}
            >
              {/* Page Running Header + Admin Edit Toolbar */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-current/15 text-[11px] font-mono">
                  <div className="flex items-center gap-2 opacity-80">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold uppercase tracking-wider">
                      {subtitle || 'Official Statutory Course Handout'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="opacity-75 font-bold">
                      PAGE {currentPage} OF {totalPages}
                    </span>

                    {canEditStudyPages && !isAdminEditing && (
                      <button
                        type="button"
                        onClick={handleStartAdminEdit}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        title="Admin: Edit this Study Page"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit Study Page (Admin)</span>
                      </button>
                    )}

                    {canEditStudyPages && isAdminEditing && (
                      <div className="flex items-center gap-1.5 font-sans">
                        <button
                          type="button"
                          onClick={handleAddStudyPage}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                          title="Add a new Study Page"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>+ Add Page</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveAdminEdit}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelAdminEdit}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ADMIN EDIT FORM VIEW FOR CURRENT STUDY PAGE */}
                {isAdminEditing ? (
                  <div className="space-y-4 font-sans text-left">
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                        <Pencil className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Admin Study Page Editor — Editing Page {currentPage} of {totalPages}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={currentPage <= 1}
                          onClick={() => handleMoveStudyPage('up')}
                          className="px-2 py-1 rounded bg-white/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          title="Move Page Earlier"
                        >
                          <ArrowUp className="w-3 h-3" />
                          <span>Move Up</span>
                        </button>
                        <button
                          type="button"
                          disabled={currentPage >= totalPages}
                          onClick={() => handleMoveStudyPage('down')}
                          className="px-2 py-1 rounded bg-white/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          title="Move Page Later"
                        >
                          <ArrowDown className="w-3 h-3" />
                          <span>Move Down</span>
                        </button>
                        {totalPages > 1 && (
                          <button
                            type="button"
                            onClick={handleDeleteCurrentStudyPage}
                            className="px-2 py-1 rounded bg-rose-600 text-white hover:bg-rose-500 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Delete Current Study Page"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete Page</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Handout Document Title */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider opacity-75 mb-1">
                        Document / Handout Title
                      </label>
                      <input
                        type="text"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    {activeSection ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-75 mb-1">
                              Page {currentPage} Heading
                            </label>
                            <input
                              type="text"
                              value={activeSection.heading}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftSections((prev) =>
                                  prev.map((s, i) =>
                                    i === currentPage - 1 ? { ...s, heading: val } : s
                                  )
                                );
                              }}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-emerald-600"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-75 mb-1">
                              Statutory Authority / Section Reference
                            </label>
                            <input
                              type="text"
                              value={activeSection.statutoryRef}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftSections((prev) =>
                                  prev.map((s, i) =>
                                    i === currentPage - 1 ? { ...s, statutoryRef: val } : s
                                  )
                                );
                              }}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider opacity-75 mb-1">
                            Main Statutory Commentary & Analysis (Page {currentPage})
                          </label>
                          <textarea
                            rows={5}
                            value={activeSection.content}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftSections((prev) =>
                                prev.map((s, i) =>
                                  i === currentPage - 1 ? { ...s, content: val } : s
                                )
                              );
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm leading-relaxed focus:outline-none focus:border-emerald-600"
                          />
                        </div>

                        {/* Editable Checklist Points */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                              Practitioner Compliance & Audit Verification Points
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setDraftSections((prev) =>
                                  prev.map((s, i) =>
                                    i === currentPage - 1
                                      ? {
                                          ...s,
                                          keyChecklist: [
                                            ...s.keyChecklist,
                                            'New compliance verification requirement',
                                          ],
                                        }
                                      : s
                                  )
                                );
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Verification Point</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {activeSection.keyChecklist.map((point, ptIdx) => (
                              <div key={`edit-pt-${currentPage}-${ptIdx}`} className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-emerald-600 w-7 shrink-0">
                                  {currentPage}.{ptIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={point}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftSections((prev) =>
                                      prev.map((s, i) => {
                                        if (i !== currentPage - 1) return s;
                                        const nextList = [...s.keyChecklist];
                                        nextList[ptIdx] = val;
                                        return { ...s, keyChecklist: nextList };
                                      })
                                    );
                                  }}
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDraftSections((prev) =>
                                      prev.map((s, i) => {
                                        if (i !== currentPage - 1) return s;
                                        return {
                                          ...s,
                                          keyChecklist: s.keyChecklist.filter((_, idx) => idx !== ptIdx),
                                        };
                                      })
                                    );
                                  }}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                  title="Remove Verification Point"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : activeSlide ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-75 mb-1">
                              Slide {currentPage} Title
                            </label>
                            <input
                              type="text"
                              value={activeSlide.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftSlides((prev) =>
                                  prev.map((s, i) =>
                                    i === currentPage - 1 ? { ...s, title: val } : s
                                  )
                                );
                              }}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-emerald-600"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-75 mb-1">
                              Statutory Citation
                            </label>
                            <input
                              type="text"
                              value={activeSlide.statutoryCitation}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftSlides((prev) =>
                                  prev.map((s, i) =>
                                    i === currentPage - 1 ? { ...s, statutoryCitation: val } : s
                                  )
                                );
                              }}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider opacity-75 mb-1">
                            Key Statutory Takeaway
                          </label>
                          <textarea
                            rows={2}
                            value={activeSlide.keyTakeaway}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftSlides((prev) =>
                                prev.map((s, i) =>
                                  i === currentPage - 1 ? { ...s, keyTakeaway: val } : s
                                )
                              );
                            }}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                      </>
                    ) : null}

                    {/* Bottom Save & Cancel Action Bar inside Study Page Card */}
                    <div className="pt-4 border-t border-current/15 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs opacity-75">
                        Changes sync immediately to Student Portal & Firestore (`lms_courses`).
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCancelAdminEdit}
                          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveAdminEdit}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Study Pages Configuration</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* READ-ONLY FORMATTED STATUTORY STUDY PAGE VIEW */
                  <>
                    {activeSection ? (
                      <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold">
                          <span>Statutory Authority: {activeSection.statutoryRef}</span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">
                          {activeSection.heading}
                        </h3>

                        <p className="text-sm sm:text-base leading-relaxed opacity-90 text-justify whitespace-pre-line">
                          {activeSection.content}
                        </p>

                        {activeSection.keyChecklist && activeSection.keyChecklist.length > 0 && (
                          <div className="mt-6 p-4 sm:p-5 rounded-xl border border-current/15 bg-black/[0.02] dark:bg-white/[0.03] space-y-3">
                            <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Practitioner Compliance & Audit Verification Points</span>
                            </div>
                            <ul className="space-y-2 text-xs sm:text-sm">
                              {activeSection.keyChecklist.map((point, i) => (
                                <li key={`pdf-pt-${currentPage}-${i}`} className="flex items-start gap-2.5">
                                  <span className="font-mono font-bold text-emerald-600 shrink-0">
                                    {currentPage}.{i + 1}
                                  </span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : activeSlide ? (
                      <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 text-xs font-mono font-bold">
                          <span>{activeSlide.subtitle} · {activeSlide.statutoryCitation}</span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                          {activeSlide.title}
                        </h3>

                        <ul className="space-y-3 text-sm sm:text-base">
                          {activeSlide.bulletPoints.map((pt, i) => (
                            <li key={`sl-pt-${currentPage}-${i}`} className="flex items-start gap-3">
                              <span className="font-mono font-bold text-emerald-600">
                                0{i + 1}.
                              </span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-6 p-4 rounded-xl border border-current/15 bg-black/[0.02] text-xs sm:text-sm">
                          <strong>Key Statutory Takeaway:</strong> {activeSlide.keyTakeaway}
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {/* Page Running Footer */}
              <div className="pt-6 mt-8 border-t border-current/15 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono opacity-70">
                <span className="truncate max-w-md">{watermarkText}</span>
                <span>
                  Read-Only Protected PDF · Page {currentPage} / {totalPages}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. BOTTOM PDF READER PAGINATION & COMPLETION BAR */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate max-w-md">{watermarkText}</span>
        </div>

        <div className="flex items-center gap-2">
          {canEditStudyPages && renderMode === 'statutory-pages' && !isAdminEditing && (
            <button
              type="button"
              onClick={handleStartAdminEdit}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Admin Edit Page</span>
            </button>
          )}

          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev Page</span>
          </button>

          {currentPage < totalPages ? (
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer flex items-center gap-1"
            >
              <span>Next Page ({currentPage + 1}/{totalPages})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : onCompleteDocument ? (
            <button
              type="button"
              onClick={onCompleteDocument}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verify & Complete PDF Notes</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
