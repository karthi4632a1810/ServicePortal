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
    || mime === 'application/vnd.ms-excel'
    || /\.(xlsx|xls|xlsm|ods)$/i.test(name)
  ) return 'excel';

  return 'unknown';
}

export function mimeForKind(kind: AttachmentKind, attachment?: Attachment | null): string {
  switch (kind) {
    case 'pdf': return 'application/pdf';
    case 'csv': return 'text/csv';
    case 'excel':
      if (attachment?.name?.toLowerCase().endsWith('.xls')) return 'application/vnd.ms-excel';
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'video': return attachment?.type || 'video/mp4';
    case 'image': return attachment?.type || 'image/jpeg';
    default: return attachment?.type || 'application/octet-stream';
  }
}

function isLikelyHtml(buffer: ArrayBuffer): boolean {
  const head = new TextDecoder().decode(buffer.slice(0, 512)).trim().toLowerCase();
  return head.startsWith('<!doctype html')
    || head.startsWith('<html')
    || head.includes('<div id="root"')
    || head.includes('<!doctype html');
}

export function isPdfBuffer(buffer: ArrayBuffer): boolean {
  return new TextDecoder().decode(buffer.slice(0, 5)) === '%PDF-';
}

export async function fetchAttachmentBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load file (${res.status})`);
  const buffer = await res.arrayBuffer();
  if (isLikelyHtml(buffer)) {
    throw new Error('Server returned a web page instead of the file. Uploads may need redeploy.');
  }
  return buffer;
}

export async function fetchAttachmentBlobUrl(url: string, mimeType: string): Promise<string> {
  const buffer = await fetchAttachmentBuffer(url);
  const blob = new Blob([buffer], { type: mimeType.split(';')[0].trim() });
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

export async function parseSpreadsheetBuffer(buffer: ArrayBuffer): Promise<{ sheetName: string; rows: string[][] }> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { sheetName: 'Sheet1', rows: [] };
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '', raw: false }) as string[][];
  const normalized = rows.map((row) => row.map((cell) => String(cell ?? '')));
  return { sheetName, rows: normalized };
}

export async function loadSpreadsheetRows(url: string): Promise<{ sheetName: string; rows: string[][] }> {
  const buffer = await fetchAttachmentBuffer(url);
  return parseSpreadsheetBuffer(buffer);
}
