import Form from '../models/Form.js';
import FormVersion from '../models/FormVersion.js';
import path from 'path';
import config from '../config/index.js';
import { AppError } from '../utils/response.js';
import { loadFormJson, listFormFiles, slugify, writeJsonFile } from '../utils/fileLoader.js';
import { normalizeFormFields, normalizeFormSchema } from '../utils/formFieldNormalizer.js';
import {
  buildFormDepartmentMetaFromSchema,
  DEFAULT_FORM_CATEGORY,
  getFormFileFolder,
} from '../utils/formMetadata.js';

function enrichLoadedSchema(schema) {
  const normalized = normalizeFormSchema(schema);
  const meta = buildFormDepartmentMetaFromSchema(normalized);
  return {
    ...normalized,
    departmentId: meta.departmentId,
    department: meta.department,
    category: DEFAULT_FORM_CATEGORY,
  };
}

export class FormService {
  async listForms({ department, category, active = true, page = 1, limit = 50 } = {}) {
    const filter = {};
    if (active !== undefined) filter.active = active === true || active === 'true';
    if (department) filter.department = new RegExp(department, 'i');
    if (category) filter.category = new RegExp(category, 'i');

    const skip = (page - 1) * limit;
    const [forms, total] = await Promise.all([
      Form.find(filter).sort('-updatedAt').skip(skip).limit(limit),
      Form.countDocuments(filter),
    ]);

    return { forms, total, page, limit };
  }

  async getFormSchema(formId) {
    const formMeta = await Form.findOne({ formId, active: true });
    if (!formMeta) throw new AppError('Form not found', 404);

    const schema = enrichLoadedSchema(await loadFormJson(formMeta.filename));
    return {
      ...schema,
      id: formMeta.formId,
      version: formMeta.currentVersion,
      workflowTemplateId: formMeta.workflowTemplateId,
      mdApprove: formMeta.mdApprove === true,
    };
  }

  async getFormById(formId) {
    const formMeta = await Form.findOne({ formId });
    if (!formMeta) throw new AppError('Form not found', 404);
    const schema = enrichLoadedSchema(await loadFormJson(formMeta.filename));
    return { metadata: formMeta, schema };
  }

  async listVersions(formId) {
    const formMeta = await Form.findOne({ formId });
    if (!formMeta) throw new AppError('Form not found', 404);

    const versions = await FormVersion.find({ formId }).sort('-version');
    return {
      formId,
      currentVersion: formMeta.currentVersion,
      versions: versions.map((v) => ({
        version: v.version,
        filename: v.filename,
        publishedBy: v.publishedBy,
        publishedAt: v.publishedAt,
        changelog: v.changelog,
        isCurrent: v.version === formMeta.currentVersion,
      })),
    };
  }

  async getFormVersion(formId, versionNum) {
    const version = await FormVersion.findOne({ formId, version: versionNum });
    if (!version) throw new AppError(`Version ${versionNum} not found`, 404);

    const schema = enrichLoadedSchema(await loadFormJson(version.filename));
    const formMeta = await Form.findOne({ formId });
    return {
      metadata: formMeta,
      version: versionNum,
      isCurrent: formMeta?.currentVersion === versionNum,
      schema,
    };
  }

  async saveForm({ formId: existingFormId, title, departmentId, department, description, icon, fields, workflowTemplateId, estimatedTime, slaHours, userId, basedOnVersion }) {
    const slug = slugify(title);

    let form = existingFormId ? await Form.findOne({ formId: existingFormId }) : null;
    if (!form && existingFormId) throw new AppError('Form not found', 404);

    const deptMeta = buildFormDepartmentMetaFromSchema({ departmentId, department });
    if (!deptMeta.departmentId || !deptMeta.department) {
      throw new AppError('Department is required', 400);
    }

    const resolvedFormId = form?.formId || existingFormId || `form-${slug}`.slice(0, 50);
    const version = form ? form.currentVersion + 1 : 1;
    const fileSlug = form?.filename?.match(/\/(.+)_v\d+\.json$/)?.[1] || slug;
    const folder = getFormFileFolder(form, resolvedFormId);
    const filename = `${folder}/${fileSlug}_v${version}.json`;

    const schema = {
      id: resolvedFormId,
      title,
      departmentId: deptMeta.departmentId,
      department: deptMeta.department,
      icon: icon || 'FileText',
      description: description || '',
      category: DEFAULT_FORM_CATEGORY,
      version,
      estimatedTime: estimatedTime || '1-2 business days',
      slaHours: slaHours || 48,
      active: true,
      workflowTemplateId: workflowTemplateId || 'wf-hod-then-processor',
      fields: normalizeFormFields(fields),
    };

    await writeJsonFile(path.join(config.paths.forms, filename), schema);

    if (form) {
      form.title = title;
      form.description = description;
      form.icon = icon;
      form.department = deptMeta.department;
      form.departmentId = deptMeta.departmentId;
      form.category = DEFAULT_FORM_CATEGORY;
      form.workflowTemplateId = workflowTemplateId || form.workflowTemplateId;
      form.currentVersion = version;
      form.filename = filename;
      form.estimatedTime = estimatedTime;
      form.slaHours = slaHours;
      await form.save();
    } else {
      form = await Form.create({
        formId: schema.id,
        title,
        department: deptMeta.department,
        departmentId: deptMeta.departmentId,
        description,
        icon,
        category: DEFAULT_FORM_CATEGORY,
        workflowTemplateId: workflowTemplateId || 'wf-hod-then-processor',
        currentVersion: version,
        filename,
        estimatedTime,
        slaHours,
        active: true,
      });
    }

    const changelog = version === 1
      ? 'Initial version'
      : basedOnVersion && basedOnVersion !== version - 1
        ? `Created from v${basedOnVersion} as v${version}`
        : `Version ${version} published`;

    await FormVersion.create({
      formId: form.formId,
      version,
      filename,
      publishedBy: userId,
      changelog,
    });

    return { form, schema };
  }

  pickCanonicalFormFiles(files) {
    const byFormId = new Map();

    for (const file of files) {
      const relativeFilename = `${file.department}/${file.filename}`;
      const existing = byFormId.get(file.schema.id);

      if (!existing) {
        byFormId.set(file.schema.id, { ...file, relativeFilename });
        continue;
      }

      const nextVersion = file.schema.version ?? 0;
      const currentVersion = existing.schema.version ?? 0;
      const nextActive = file.schema.active !== false;
      const currentActive = existing.schema.active !== false;

      if (nextVersion > currentVersion || (nextVersion === currentVersion && nextActive && !currentActive)) {
        byFormId.set(file.schema.id, { ...file, relativeFilename });
      }
    }

    return [...byFormId.values()];
  }

  async syncFormsFromFiles() {
    const files = await listFormFiles();
    const loaded = [];

    for (const file of files) {
      const schema = enrichLoadedSchema(await loadFormJson(file.filepath));
      loaded.push({ ...file, schema });
    }

    const canonical = this.pickCanonicalFormFiles(loaded);
    const syncedFormIds = [];
    const fileVersionKeys = new Set(
      loaded.map((file) => `${file.schema.id}:${file.schema.version}`),
    );

    for (const file of canonical) {
      const { schema, relativeFilename } = file;

      await Form.findOneAndUpdate(
        { formId: schema.id },
        {
          formId: schema.id,
          title: schema.title,
          department: schema.department,
          departmentId: schema.departmentId,
          description: schema.description,
          icon: schema.icon,
          category: DEFAULT_FORM_CATEGORY,
          workflowTemplateId: schema.workflowTemplateId || 'wf-hod-then-processor',
          mdApprove: schema.md_approve === true || schema.mdApprove === true,
          currentVersion: schema.version,
          filename: relativeFilename,
          estimatedTime: schema.estimatedTime,
          slaHours: schema.slaHours,
          active: schema.active !== false,
        },
        { upsert: true, new: true }
      );

      await FormVersion.findOneAndUpdate(
        { formId: schema.id, version: schema.version },
        {
          formId: schema.id,
          version: schema.version,
          filename: relativeFilename,
          changelog: 'Synced from file',
        },
        { upsert: true }
      );

      syncedFormIds.push(schema.id);
    }

    const removedForms = await Form.deleteMany({
      formId: { $nin: syncedFormIds },
    });

    const existingVersions = await FormVersion.find({ formId: { $in: syncedFormIds } });
    const staleVersionIds = existingVersions
      .filter((entry) => !fileVersionKeys.has(`${entry.formId}:${entry.version}`))
      .map((entry) => entry._id);
    const removedVersions = staleVersionIds.length
      ? await FormVersion.deleteMany({ _id: { $in: staleVersionIds } })
      : { deletedCount: 0 };

    const removedOrphanVersions = await FormVersion.deleteMany({
      formId: { $nin: syncedFormIds },
    });

    return {
      synced: syncedFormIds,
      removed: {
        forms: removedForms.deletedCount,
        versions: removedVersions.deletedCount + removedOrphanVersions.deletedCount,
      },
    };
  }
}

export default new FormService();
