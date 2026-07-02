import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ZoomIn, ZoomOut, Maximize2, Download, FileText, FileSpreadsheet,
  Image as ImageIcon, Film, Loader2, AlertCircle, RotateCcw,
} from 'lucide-react';
import { cn } from '../ui/utils';
import type { Attachment } from '../../types';
import {
  fetchAttachmentBlobUrl,
  getAttachmentKind,
  loadSpreadsheetRows,
  parseCsvText,
  resolveAttachmentUrl,
  revokeBlobUrl,
  type AttachmentKind,
} from '../../utils/attachmentUtils';

const KIND_META: Record<AttachmentKind, { label: string; icon: React.ElementType; tone: string }> = {
  pdf: { label: 'PDF', icon: FileText, tone: 'text-red-600 bg-red-50 dark:bg-red-950/40' },
  image: { label: 'Image', icon: ImageIcon, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  video: { label: 'Video', icon: Film, tone: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
  csv: { label: 'CSV', icon: FileSpreadsheet, tone: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
  excel: { label: 'Excel', icon: FileSpreadsheet, tone: 'text-green-600 bg-green-50 dark:bg-green-950/40' },
  unknown: { label: 'File', icon: FileText, tone: 'text-muted-foreground bg-muted' },
};

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.15;

function mimeForKind(kind: AttachmentKind, attachment?: Attachment | null): string | undefined {
  if (attachment?.type) return attachment.type;
  if (kind === 'pdf') return 'application/pdf';
  if (kind === 'video') return 'video/mp4';
  return undefined;
}

function ZoomableSurface({
  zoom,
  children,
  className,
}: {
  zoom: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex-1 min-h-0 overflow-auto overscroll-contain', className)}>
      <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          className="transition-transform duration-150"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SpreadsheetTable({ rows }: { rows: string[][] }) {
  if (!rows.length) {
    return (
      <div className="text-center text-muted-foreground py-16" style={{ fontSize: '13px' }}>
        No data in this file
      </div>
    );
  }

  const [header, ...body] = rows;
  const hasHeader = header?.some(Boolean);

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="overflow-auto">
        <table className="w-full border-collapse text-left" style={{ fontSize: '12px' }}>
          {hasHeader && (
            <thead>
              <tr className="bg-primary/5 border-b border-border">
                {header.map((cell, i) => (
                  <th key={i} className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap border-r border-border/40 last:border-r-0">
                    {cell || `Column ${i + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {(hasHeader ? body : rows).map((row, ri) => (
              <tr key={ri} className="border-b border-border/40 last:border-b-0 hover:bg-muted/30">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-foreground whitespace-nowrap border-r border-border/30 last:border-r-0">
                    {cell || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AttachmentPreviewModal({
  attachment,
  open,
  onClose,
}: {
  attachment: Attachment | null;
  open: boolean;
  onClose: () => void;
}) {
  const url = attachment ? resolveAttachmentUrl(attachment) : '';
  const kind = attachment ? getAttachmentKind(attachment) : 'unknown';
  const meta = KIND_META[kind];
  const KindIcon = meta.icon;

  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [sheetLabel, setSheetLabel] = useState('');
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const resetZoom = useCallback(() => setZoom(1), []);
  const zoomIn = useCallback(() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2))), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2))), []);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [open]);

  // Load file content
  useEffect(() => {
    if (!open || !attachment || !url) {
      setBlobUrl(null);
      setError(null);
      setCsvRows([]);
      setSheetRows([]);
      setSheetLabel('');
      return;
    }

    setZoom(1);
    setError(null);
    setCsvRows([]);
    setSheetRows([]);
    setSheetLabel('');

    let cancelled = false;
    let createdBlobUrl: string | null = null;

    const load = async () => {
      setLoading(true);
      try {
        if (kind === 'pdf' || kind === 'image' || kind === 'video') {
          createdBlobUrl = await fetchAttachmentBlobUrl(url, mimeForKind(kind, attachment));
          if (!cancelled) setBlobUrl(createdBlobUrl);
        } else if (kind === 'csv') {
          const res = await fetch(url);
          if (!res.ok) throw new Error('Could not load CSV file');
          const text = await res.text();
          if (!cancelled) setCsvRows(parseCsvText(text));
        } else if (kind === 'excel') {
          const { sheetName, rows } = await loadSpreadsheetRows(url);
          if (!cancelled) {
            setSheetLabel(sheetName);
            setSheetRows(rows);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load file');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      revokeBlobUrl(createdBlobUrl);
      setBlobUrl(null);
    };
  }, [open, attachment, url, kind]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, zoomIn, zoomOut]);

  const handleWheel = (e: React.WheelEvent) => {
    if (kind === 'video' || kind === 'unknown') return;
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  const handleDownload = () => {
    if (!attachment) return;
    const href = blobUrl || url;
    if (!href) return;
    const a = document.createElement('a');
    a.href = href;
    a.download = attachment.name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const renderContent = () => {
    if (!attachment || !url) return null;
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p style={{ fontSize: '13px' }}>Loading preview…</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 px-6 text-center">
          <AlertCircle className="size-10 text-destructive" />
          <p className="text-foreground" style={{ fontSize: '14px', fontWeight: 600 }}>Preview unavailable</p>
          <p className="text-muted-foreground max-w-sm" style={{ fontSize: '12px' }}>{error}</p>
          <button
            type="button"
            onClick={handleDownload}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            style={{ fontSize: '12px', fontWeight: 600 }}
          >
            <Download className="size-4" />
            Download file
          </button>
        </div>
      );
    }

    switch (kind) {
      case 'image':
        return blobUrl ? (
          <ZoomableSurface zoom={zoom} className="bg-neutral-950/95">
            <img
              src={blobUrl}
              alt={attachment.name}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
              draggable={false}
            />
          </ZoomableSurface>
        ) : null;
      case 'pdf':
        return blobUrl ? (
          <ZoomableSurface zoom={zoom} className="bg-neutral-200 dark:bg-neutral-900">
            <iframe
              title={attachment.name}
              src={blobUrl}
              className="rounded-lg border border-border/60 bg-white shadow-xl"
              style={{ width: '850px', height: '1100px', maxWidth: '90vw' }}
            />
          </ZoomableSurface>
        ) : null;
      case 'video':
        return blobUrl ? (
          <div className="flex-1 min-h-0 flex items-center justify-center bg-black">
            <video
              src={blobUrl}
              controls
              className="max-w-full max-h-full"
              style={{ maxHeight: 'calc(100vh - 72px)' }}
            >
              Your browser does not support video playback.
            </video>
          </div>
        ) : null;
      case 'csv':
        return (
          <ZoomableSurface zoom={zoom} className="bg-muted/20">
            <SpreadsheetTable rows={csvRows} />
          </ZoomableSurface>
        );
      case 'excel':
        return (
          <ZoomableSurface zoom={zoom} className="bg-muted/20">
            <div className="space-y-3">
              {sheetLabel && (
                <p className="text-muted-foreground px-1" style={{ fontSize: '11px', fontWeight: 600 }}>
                  Sheet: {sheetLabel}
                </p>
              )}
              <SpreadsheetTable rows={sheetRows} />
            </div>
          </ZoomableSurface>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
              <FileText className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-foreground" style={{ fontSize: '14px', fontWeight: 600 }}>{attachment.name}</p>
              <p className="text-muted-foreground mt-1" style={{ fontSize: '12px' }}>
                Preview is not available for this file type. Download to open it.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              style={{ fontSize: '12px', fontWeight: 600 }}
            >
              <Download className="size-4" />
              Download
            </button>
          </div>
        );
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && attachment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[9999] flex flex-col bg-background"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${attachment.name}`}
        >
          {/* Toolbar */}
          <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-card/95 backdrop-blur-sm">
            <div className={cn('size-9 rounded-xl flex items-center justify-center shrink-0', meta.tone)}>
              <KindIcon className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground truncate" style={{ fontSize: '14px', fontWeight: 600 }}>
                {attachment.name}
              </p>
              <p className="text-muted-foreground" style={{ fontSize: '11px' }}>
                {meta.label}{attachment.size ? ` · ${attachment.size}` : ''}
              </p>
            </div>

            {kind !== 'video' && kind !== 'unknown' && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-muted/60 border border-border/50">
                <button type="button" onClick={zoomOut} className="size-8 flex items-center justify-center rounded-lg hover:bg-background transition-colors" title="Zoom out">
                  <ZoomOut className="size-4 text-muted-foreground" />
                </button>
                <span className="w-12 text-center text-foreground tabular-nums" style={{ fontSize: '11px', fontWeight: 600 }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button type="button" onClick={zoomIn} className="size-8 flex items-center justify-center rounded-lg hover:bg-background transition-colors" title="Zoom in">
                  <ZoomIn className="size-4 text-muted-foreground" />
                </button>
                <button type="button" onClick={resetZoom} className="size-8 flex items-center justify-center rounded-lg hover:bg-background transition-colors" title="Reset zoom">
                  <RotateCcw className="size-3.5 text-muted-foreground" />
                </button>
                <button type="button" onClick={() => setZoom(1)} className="size-8 flex items-center justify-center rounded-lg hover:bg-background transition-colors" title="Fit view">
                  <Maximize2 className="size-3.5 text-muted-foreground" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="size-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Download"
            >
              <Download className="size-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="size-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Close (Esc)"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Preview — scroll only inside this area */}
          <div
            ref={surfaceRef}
            className="flex-1 min-h-0 flex flex-col overflow-hidden touch-none"
            onWheel={handleWheel}
          >
            {renderContent()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function AttachmentListItem({
  attachment,
  onPreview,
}: {
  attachment: Attachment;
  onPreview: (attachment: Attachment) => void;
}) {
  const kind = getAttachmentKind(attachment);
  const meta = KIND_META[kind];
  const KindIcon = meta.icon;

  return (
    <button
      type="button"
      onClick={() => onPreview(attachment)}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
    >
      <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0', meta.tone)}>
        <KindIcon className="size-3.5" />
      </div>
      <span className="flex-1 min-w-0 truncate text-foreground group-hover:text-primary transition-colors" style={{ fontSize: '12px', fontWeight: 500 }}>
        {attachment.name}
      </span>
      <span className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: '10px', fontWeight: 600 }}>
        Preview
      </span>
    </button>
  );
}
