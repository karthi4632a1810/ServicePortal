import fs from 'fs/promises';
import path from 'path';
import Form from '../models/Form.js';
import { buildUploadDestination } from '../utils/uploadPaths.js';

export async function prepareUploadContext(req, res, next) {
  try {
    const formId = String(req.query.formId || '').trim();
    const staffId = String(req.query.staffId || '').trim();
    const batchKey = String(req.query.batchKey || '').trim();
    const fieldId = String(req.query.fieldId || '').trim();

    if (!formId || !staffId) {
      return res.status(400).json({
        success: false,
        message: 'formId and staffId are required for upload',
      });
    }

    const form = await Form.findOne({ formId, active: true });
    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    const destination = buildUploadDestination(form.title, form.formId, staffId, batchKey || undefined);
    await fs.mkdir(destination, { recursive: true });

    req.uploadContext = {
      formId,
      staffId,
      batchKey: batchKey || path.basename(destination),
      fieldId: fieldId || undefined,
      destination,
      formTitle: form.title,
    };
    next();
  } catch (err) {
    next(err);
  }
}
