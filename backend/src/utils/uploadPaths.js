import path from 'path';
import config from '../config/index.js';
import { slugify } from './fileLoader.js';

/** Folder key: STAFFID_YYYYMMDDHHmmss */
export function formatSubmitBatchKey(staffId, date = new Date()) {
  const id = String(staffId || '').trim().toUpperCase();
  const pad = (n) => String(n).padStart(2, '0');
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

/** uploads/{form_name}/{staff_id}_{submit_time}/ */
export function getFormUploadFolder(formTitle, formId) {
  return slugify(formTitle || formId || 'request');
}

export function buildUploadDestination(formTitle, formId, staffId, batchKey) {
  const formFolder = getFormUploadFolder(formTitle, formId);
  const batchFolder = batchKey || formatSubmitBatchKey(staffId);
  return path.join(config.paths.uploads, formFolder, batchFolder);
}

export function toRelativeUploadPath(absolutePath) {
  const uploadsRoot = path.resolve(config.paths.uploads);
  const resolved = path.resolve(absolutePath);
  if (!resolved.startsWith(uploadsRoot)) return null;
  return resolved.slice(uploadsRoot.length + 1).replace(/\\/g, '/');
}

export function toPublicUploadUrl(relativePath) {
  if (!relativePath) return null;
  return `/api/uploads/${relativePath.replace(/\\/g, '/')}`;
}
