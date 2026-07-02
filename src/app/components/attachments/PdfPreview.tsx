import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`;

const BASE_SCALE = 1.35;

export function PdfPreview({
  data,
  zoom,
}: {
  data: ArrayBuffer;
  zoom: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren();
    setLoading(true);
    setError(null);
    setPageCount(0);

    (async () => {
      try {
        const doc = await pdfjs.getDocument({ data: data.slice(0) }).promise;
        if (cancelled) return;
        setPageCount(doc.numPages);

        for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
          const page = await doc.getPage(pageNum);
          if (cancelled) return;

          const viewport = page.getViewport({ scale: BASE_SCALE });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = 'block mx-auto mb-4 rounded-lg shadow-lg border border-border/40 bg-white';

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          if (cancelled) return;
          container.appendChild(canvas);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render PDF');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-6">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-foreground" style={{ fontSize: '13px', fontWeight: 600 }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="size-7 animate-spin text-primary" />
          <p style={{ fontSize: '12px' }}>Rendering PDF…</p>
        </div>
      )}
      {!loading && pageCount > 0 && (
        <p className="text-center text-muted-foreground mb-4" style={{ fontSize: '11px', fontWeight: 600 }}>
          {pageCount} page{pageCount !== 1 ? 's' : ''}
        </p>
      )}
      <div
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        className="transition-transform duration-150"
      >
        <div ref={containerRef} className="py-2" />
      </div>
    </div>
  );
}
