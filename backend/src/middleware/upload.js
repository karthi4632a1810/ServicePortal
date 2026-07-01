import multer from 'multer';
import path from 'path';
import config from '../config/index.js';
import { AppError } from '../utils/response.js';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.xls', '.xlsx']);

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_TYPES.includes(file.mimetype) || ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
    return;
  }
  cb(new AppError('Invalid file type. Allowed: PDF, JPG, PNG, Word, Excel', 400));
}

function safeFilename(originalname) {
  const ext = path.extname(originalname).toLowerCase();
  const base = path.basename(originalname, ext).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  return `${base || 'file'}_${Date.now()}${ext}`;
}

export function createUploadMiddleware() {
  return multer({
    storage: multer.diskStorage({
      destination: (req, _file, cb) => {
        cb(null, req.uploadContext?.destination || config.paths.uploads);
      },
      filename: (_req, file, cb) => {
        cb(null, safeFilename(file.originalname));
      },
    }),
    limits: { fileSize: config.uploadMaxSize },
    fileFilter,
  });
}

/** @deprecated Use createUploadMiddleware() with prepareUploadContext */
export const upload = multer({
  storage: multer.diskStorage({
    destination: config.paths.uploads,
    filename: (_req, file, cb) => {
      cb(null, safeFilename(file.originalname));
    },
  }),
  limits: { fileSize: config.uploadMaxSize },
  fileFilter,
});
