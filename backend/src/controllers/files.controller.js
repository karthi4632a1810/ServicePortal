import fs from 'fs';
import path from 'path';
import config from '../config/index.js';
import { AppError } from '../utils/response.js';

function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function resolveUploadFile(relativePath) {
  const rel = String(relativePath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^api\/uploads\//i, '')
    .replace(/^uploads\/+/i, '')
    .replace(/^uploads_data\/+/i, '');
  if (!rel || rel.includes('..')) throw new AppError('Invalid file path', 400);

  const root = path.resolve(config.paths.uploads);
  const full = path.resolve(root, rel);
  if (!full.startsWith(root)) throw new AppError('Invalid file path', 403);

  if (fs.existsSync(full)) return full;

  const dir = path.dirname(full);
  const wantExt = path.extname(full).toLowerCase();
  if (!fs.existsSync(dir)) throw new AppError('File not found', 404);

  const wantBase = normalizeKey(path.basename(full, wantExt));
  const candidates = fs.readdirSync(dir).filter((f) => path.extname(f).toLowerCase() === wantExt);
  if (!candidates.length) throw new AppError('File not found', 404);

  if (candidates.length === 1) return path.join(dir, candidates[0]);

  const match = candidates.find((fileName) => {
    const base = normalizeKey(path.basename(fileName, path.extname(fileName)));
    if (!wantBase || !base) return false;
    return base.includes(wantBase.slice(0, 16)) || wantBase.includes(base.slice(0, 16));
  });

  if (match) return path.join(dir, match);

  throw new AppError('File not found', 404);
}

export const filesController = {
  serve: (req, res, next) => {
    try {
      const filePath = resolveUploadFile(req.query.path);
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  },
};
