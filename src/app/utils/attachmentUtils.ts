import type { Attachment } from '../types';

export type AttachmentKind = 'pdf' | 'image' | 'video' | 'csv' | 'excel' | 'unknown';

export function resolveAttachmentUrl(att: Attachment): string {
  if (att.url) return att.url;
  if (att.path) return `/uploads/${String(att.path).replace(/\\/g, '/')}`;
  return '';
}

export function getAttachmentKind(att: Attachment): AttachmentKind {
  const name = (att.name || '').toLowerCase();
  const mime = (att.type || '').toLowerCase();

  if (mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(name)) return 'image';
  if (mime.startsWith('video/') || /\.(mp4|webm|ogg|mov|m4v)$/i.test(name)) return 'video';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (mime.includes('csv') || name.endsWith('.csv')) return 'csv';
  if (
    mime.includes('spreadsheet')
    || mime.includes('excel')
    || /\.(xlsx|xls|xlsm|ods)$/i.test(name)
  ) return 'excel';

  return 'unknown';
}

export async function fetchAttachmentBlobUrl(url: string, mimeType?: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load file');
  const buffer = await res.arrayBuffer();
  const type = mimeType || res.headers.get('content-type') || 'application/octet-stream';
  const blob = new Blob([buffer], { type: type.split(';')[0].trim() });
  return URL.createObjectURL(blob);
}

export function revokeBlobUrl(blobUrl: string | null | undefined) {
  if (blobUrl?.startsWith('blob:')) URL.revokeObjectURL(blobUrl);
}

export function formatAttachmentSize(size?: string): string {
  if (!size) return '';
  return size;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function parseCsvText(text: string): string[][] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  return lines.map(parseCsvLine);
}

export async function loadSpreadsheetRows(url: string): Promise<{ sheetName: string; rows: string[][] }> {
  const XLSX = await import('xlsx');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load spreadsheet');
  const buffer = await res.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { sheetName: 'Sheet1', rows: [] };
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][];
  return { sheetName, rows: rows.map((row) => row.map((cell) => String(cell ?? ''))) };
}
