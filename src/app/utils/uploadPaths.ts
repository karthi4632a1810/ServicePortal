/** uploads/{form_name}/{STAFFID_YYYYMMDDHHmmss}/ */
export function formatUploadBatchKey(staffId: string, date = new Date()): string {
  const id = staffId.trim().toUpperCase();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
  return `${id}_${ts}`;
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_UPLOAD_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.xls', '.xlsx'];

export function isAllowedUploadFile(file: File): boolean {
  if (file.size > MAX_UPLOAD_BYTES) return false;
  const name = file.name.toLowerCase();
  return ALLOWED_UPLOAD_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function formatUploadSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
