import type { Attachment } from '../types';

export type AttachmentKind = 'pdf' | 'image' | 'video' | 'csv' | 'excel' | 'unknown';

function relativeFromAttachment(att: Attachment): string {
  const raw = att.url || '';
  if (raw) {
    return raw
      .replace(/^\/+/, '')
      .replace(/^api\/uploads\//i, '')
      .replace(/^uploads\/+/i, '')
      .replace(/^uploads_data\/+/i, '')
      .replace(/^\/api\/uploads\//i, '')
      .replace(/^\/uploads\//i, '')
      .replace(/^\/+/, '');
  }

  if (!att.path) return '';
  return String(att.path)
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^api\/uploads\//i, '')
    .replace(/^uploads\/+/i, '')
    .replace(/^uploads_data\/+/i, '');
}

export function resolveAttachmentUrl(att: Attachment): string {
  const relative = relativeFromAttachment(att);
  if (relative) {
    return `/api/files/serve?path=${encodeURIComponent(relative)}`;
  }
  return '';
}

export function getAttachmentKind(att: Attachment): AttachmentKind {
  const name = (att.name || '').toLowerCase();
  const mime = (att.type || '').toLowerCase();

  if (mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(name)) return 'image';
  if (mime === 'png' || mime === 'jpg' || mime === 'jpeg' || mime === 'gif' || mime === 'webp') return 'image';
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
  const rawType = (attachment?.type || '').toLowerCase();
  if (rawType.includes('/')) return rawType;

  switch (kind) {
    case 'pdf': return 'application/pdf';
    case 'csv': return 'text/csv';
    case 'excel':
      if (attachment?.name?.toLowerCase().endsWith('.xls')) return 'application/vnd.ms-excel';
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'video': return rawType ? `video/${rawType}` : 'video/mp4';
    case 'image':
      if (rawType === 'png') return 'image/png';
      if (rawType === 'jpg' || rawType === 'jpeg') return 'image/jpeg';
      if (rawType === 'gif') return 'image/gif';
      if (rawType === 'webp') return 'image/webp';
      if (attachment?.name?.toLowerCase().endsWith('.png')) return 'image/png';
      return 'image/jpeg';
    default: return 'application/octet-stream';
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

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const token = localStorage.getItem('sp_token');
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // ignore
  }
  return headers;
}

export async function fetchAttachmentBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { headers: authHeaders(), credentials: 'same-origin' });
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
