import formService from '../services/form.service.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../utils/response.js';

export const formController = {
  list: async (req, res, next) => {
    try {
      const { department, category, active, page, limit } = req.query;
      const { forms, total, page: p, limit: l } = await formService.listForms({
        department, category, active, page, limit,
      });

      const schemas = await Promise.all(
        forms.map(async (f) => {
          const schema = await formService.getFormSchema(f.formId);
          return schema;
        })
      );

      return successResponse(res, {
        message: 'Forms retrieved',
        data: schemas,
        pagination: { total, page: p, limit: l, totalPages: Math.ceil(total / l) || 1 },
      });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const schema = await formService.getFormSchema(req.params.id);
      return successResponse(res, { message: 'Form retrieved', data: schema });
    } catch (err) {
      next(err);
    }
  },
};

export const formBuilderController = {
  list: async (req, res, next) => {
    try {
      const { forms } = await formService.listForms({ active: undefined });
      return successResponse(res, { message: 'Form builder list retrieved', data: forms });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { metadata, schema } = await formService.getFormById(req.params.id);
      return successResponse(res, { message: 'Form retrieved', data: { metadata, schema } });
    } catch (err) {
      next(err);
    }
  },

  save: async (req, res, next) => {
    try {
      const formId = req.body.formId || req.params.id;
      const { title, departmentId, department, description, icon, fields, workflowTemplateId, estimatedTime, slaHours, basedOnVersion } = req.body;
      if (!title || !departmentId || !department || !fields?.length) {
        throw new AppError('Title, HRMS department, and fields are required', 400);
      }
      const result = await formService.saveForm({
        formId, title, departmentId, department, description, icon, fields,
        workflowTemplateId, estimatedTime, slaHours,
        userId: req.user?._id,
        basedOnVersion,
      });
      const isNewVersion = result.schema.version > 1;
      return successResponse(res, {
        message: isNewVersion ? `Saved as version ${result.schema.version}` : 'Form created',
        data: result,
        statusCode: 201,
      });
    } catch (err) {
      next(err);
    }
  },

  listVersions: async (req, res, next) => {
    try {
      const data = await formService.listVersions(req.params.id);
      return successResponse(res, { message: 'Form versions retrieved', data });
    } catch (err) {
      next(err);
    }
  },

  getVersion: async (req, res, next) => {
    try {
      const data = await formService.getFormVersion(req.params.id, parseInt(req.params.version, 10));
      return successResponse(res, { message: 'Form version retrieved', data });
    } catch (err) {
      next(err);
    }
  },

  sync: async (req, res, next) => {
    try {
      const synced = await formService.syncFormsFromFiles();
      return successResponse(res, { message: 'Forms synced from files', data: synced });
    } catch (err) {
      next(err);
    }
  },
};
