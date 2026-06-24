import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import {
  Plus, Trash2, GripVertical, ChevronDown, Settings, Eye,
  Save, Wrench, Type, AlignLeft, Hash, Mail, Phone, Calendar,
  Clock, ChevronRight, CheckSquare, List, Upload, Divide, Tag,
  ToggleLeft, Minus, User, History, FileText, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { cn } from '../components/ui/utils';
import { api } from '../services/api';
import type { FormField } from '../types';
import { isDateOfJoiningLabel } from '../utils/formDateFields';
import { normalizeFormField, normalizeFormFields } from '../utils/hrmsFormFields';
import { createStaffVerificationFields, ensureStaffVerificationFields, isStaffVerificationField } from '../utils/hrmsVerificationFields';
import { DEFAULT_FORM_CATEGORY, LEGACY_OWNER_DEPT_MAP } from '../utils/branding';
import { DepartmentTag } from '../components/common/DepartmentTag';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date' | 'time' | 'dropdown' | 'multiselect' | 'radio' | 'checkbox' | 'file' | 'section_title' | 'divider';

interface BuilderField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder: string;
  helpText: string;
  options: string[];
  width: 'full' | 'half';
  hrmsSource?: 'staff_id' | 'phone' | 'department' | 'designation';
  locked?: boolean;
}

function createDefaultBuilderFields(): BuilderField[] {
  return createStaffVerificationFields().map((field) => ({
    id: field.id,
    type: field.type as FieldType,
    label: field.label,
    required: true,
    placeholder: field.placeholder ?? '',
    helpText: field.helpText ?? '',
    options: [],
    width: field.width === 'half' ? 'half' : 'full',
    hrmsSource: field.hrmsSource,
    locked: true,
  }));
}

const FIELD_PALETTE: Array<{ type: FieldType; label: string; icon: React.ElementType; color: string }> = [
  { type: 'text', label: 'Text', icon: Type, color: 'text-blue-600' },
  { type: 'textarea', label: 'Text Area', icon: AlignLeft, color: 'text-blue-600' },
  { type: 'number', label: 'Number', icon: Hash, color: 'text-purple-600' },
  { type: 'email', label: 'Email', icon: Mail, color: 'text-emerald-600' },
  { type: 'phone', label: 'Phone', icon: Phone, color: 'text-emerald-600' },
  { type: 'date', label: 'Date', icon: Calendar, color: 'text-amber-600' },
  { type: 'time', label: 'Time', icon: Clock, color: 'text-amber-600' },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDown, color: 'text-indigo-600' },
  { type: 'multiselect', label: 'Multi Select', icon: List, color: 'text-indigo-600' },
  { type: 'radio', label: 'Radio', icon: ToggleLeft, color: 'text-pink-600' },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, color: 'text-pink-600' },
  { type: 'file', label: 'File Upload', icon: Upload, color: 'text-gray-600' },
  { type: 'section_title', label: 'Section Title', icon: Tag, color: 'text-gray-500' },
  { type: 'divider', label: 'Divider', icon: Minus, color: 'text-gray-500' },
];

const defaultField = (type: FieldType): BuilderField => ({
  id: `f-${Date.now()}`,
  type,
  label: FIELD_PALETTE.find(p => p.type === type)?.label ?? 'Field',
  required: false,
  placeholder: '',
  helpText: '',
  options: type === 'dropdown' || type === 'radio' || type === 'checkbox' || type === 'multiselect' ? ['Option 1', 'Option 2'] : [],
  width: 'full',
});

interface BuilderFormMeta {
  formId: string;
  title: string;
  departmentId?: string;
  department: string;
  currentVersion: number;
  category?: string;
  slaHours?: number;
  description?: string;
}

interface VersionMeta {
  version: number;
  filename: string;
  publishedAt?: string;
  changelog?: string;
  isCurrent: boolean;
}

function schemaFieldsToBuilder(fields: FormField[]): BuilderField[] {
  return ensureStaffVerificationFields(normalizeFormFields(fields)).map((f) => ({
    id: f.id,
    type: (f.type === 'employee_info' || f.type === 'readonly' || f.type === 'hidden' || f.type === 'signature' ? 'section_title' : f.type) as FieldType,
    label: f.label,
    required: f.required ?? false,
    placeholder: f.placeholder ?? '',
    helpText: f.helpText ?? '',
    options: f.options?.map((o) => o.label) ?? [],
    width: f.width === 'half' ? 'half' : 'full',
    hrmsSource: f.hrmsSource,
    locked: isStaffVerificationField(f),
  }));
}

function builderFieldsToSchema(fields: BuilderField[]): FormField[] {
  return ensureStaffVerificationFields(fields.map((f) => normalizeFormField({
    id: f.id,
    type: f.type,
    label: f.label,
    required: f.required,
    placeholder: f.placeholder || undefined,
    helpText: f.helpText || undefined,
    width: f.width,
    hrmsSource: f.hrmsSource,
    ...(f.type === 'date' && !isDateOfJoiningLabel(f.label) ? { defaultValue: 'today' } : {}),
    options: f.options.map((o, i) => ({ label: o, value: o.toLowerCase().replace(/\s+/g, '_') || `opt_${i}` })),
  })));
}

function PaletteItem({ type, label, icon: Icon, color, onAdd }: {
  type: FieldType; label: string; icon: React.ElementType; color: string; onAdd: (t: FieldType) => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onAdd(type)}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
    >
      <Icon className={cn('size-4 shrink-0', color)} />
      <span className="text-foreground" style={{ fontSize: '12px' }}>{label}</span>
      <Plus className="size-3.5 text-muted-foreground ml-auto" />
    </motion.button>
  );
}

function FieldEditor({ field, onChange, onDelete }: {
  field: BuilderField;
  onChange: (f: BuilderField) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const palette = FIELD_PALETTE.find(p => p.type === field.type);
  const Icon = palette?.icon ?? Type;

  return (
    <Reorder.Item value={field} id={field.id}>
      <motion.div
        layout
        className="bg-card border border-border/60 rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
      >
        {/* Field Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <GripVertical className="size-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
          <div className={cn('size-7 rounded-lg flex items-center justify-center', 'bg-primary/10')}>
            <Icon className={cn('size-3.5', palette?.color ?? 'text-primary')} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground truncate" style={{ fontSize: '13px', fontWeight: 500 }}>{field.label}</p>
            <p className="text-muted-foreground" style={{ fontSize: '10px' }}>
              {field.type.replace(/_/g, ' ')} · {field.width} · {field.required ? 'Required' : 'Optional'}
              {field.locked ? ' · Locked' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!field.locked && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
            <ChevronRight className={cn('size-4 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
          </div>
        </div>

        {/* Field Settings */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>LABEL</label>
                    <input
                      value={field.label}
                      onChange={e => onChange({ ...field, label: e.target.value })}
                      disabled={field.locked}
                      className="w-full h-8 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60"
                      style={{ fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>PLACEHOLDER</label>
                    <input
                      value={field.placeholder}
                      onChange={e => onChange({ ...field, placeholder: e.target.value })}
                      className="w-full h-8 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      style={{ fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>WIDTH</label>
                    <select
                      value={field.width}
                      onChange={e => onChange({ ...field, width: e.target.value as 'full' | 'half' })}
                      disabled={field.locked}
                      className="w-full h-8 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60"
                      style={{ fontSize: '12px' }}
                    >
                      <option value="full">Full Width</option>
                      <option value="half">Half Width</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={e => onChange({ ...field, required: e.target.checked })}
                        disabled={field.locked}
                        className="accent-primary"
                      />
                      <span className="text-foreground" style={{ fontSize: '12px' }}>Required field</span>
                    </label>
                  </div>
                </div>

                {['dropdown', 'radio', 'checkbox', 'multiselect'].includes(field.type) && (
                  <div>
                    <label className="block mb-1 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>OPTIONS (one per line)</label>
                    <textarea
                      value={field.options.join('\n')}
                      onChange={e => onChange({ ...field, options: e.target.value.split('\n') })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                      style={{ fontSize: '12px' }}
                    />
                  </div>
                )}

                <div>
                  <label className="block mb-1 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>HELP TEXT</label>
                  <input
                    value={field.helpText}
                    onChange={e => onChange({ ...field, helpText: e.target.value })}
                    placeholder="Optional guidance for the user..."
                    className="w-full h-8 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Reorder.Item>
  );
}

export function FormBuilderPage() {
  const [builderForms, setBuilderForms] = useState<BuilderFormMeta[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [versions, setVersions] = useState<VersionMeta[]>([]);
  const [loadedVersion, setLoadedVersion] = useState<number>(1);
  const [currentLiveVersion, setCurrentLiveVersion] = useState<number>(1);
  const [formTitle, setFormTitle] = useState('New Service Request Form');
  const [formDepartmentId, setFormDepartmentId] = useState(LEGACY_OWNER_DEPT_MAP.IT.id);
  const [formDepartmentName, setFormDepartmentName] = useState(LEGACY_OWNER_DEPT_MAP.IT.name);
  const [hrmsDepartments, setHrmsDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [slaHours, setSlaHours] = useState(24);
  const [fields, setFields] = useState<BuilderField[]>(createDefaultBuilderFields());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'build' | 'preview'>('build');
  const [saveError, setSaveError] = useState('');

  const loadFormList = useCallback(async () => {
    try {
      const res = await api.listBuilderForms();
      setBuilderForms(res.data.map((f) => ({
        formId: f.formId,
        title: f.title,
        departmentId: (f as { departmentId?: string }).departmentId,
        department: f.department,
        currentVersion: f.currentVersion,
        category: f.category,
        slaHours: f.slaHours,
      })));
    } catch {
      setBuilderForms([]);
    }
  }, []);

  useEffect(() => { loadFormList(); }, [loadFormList]);

  useEffect(() => {
    api.getDepartments()
      .then((res) => setHrmsDepartments(res.data))
      .catch(() => setHrmsDepartments([]));
  }, []);

  const loadVersionIntoEditor = useCallback(async (formId: string, version: number) => {
    setLoading(true);
    setSaveError('');
    try {
      const res = await api.getFormVersion(formId, version);
      const { schema, metadata } = res.data;
      setFormTitle(schema.title);
      setFormDepartmentId(schema.departmentId || LEGACY_OWNER_DEPT_MAP.IT.id);
      setFormDepartmentName(schema.department || LEGACY_OWNER_DEPT_MAP.IT.name);
      setSlaHours(schema.slaHours ?? 24);
      setFields(schemaFieldsToBuilder(schema.fields));
      setLoadedVersion(version);
      setCurrentLiveVersion((metadata as { currentVersion?: number }).currentVersion ?? version);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to load version');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectForm = async (formId: string) => {
    setSelectedFormId(formId);
    if (!formId) return;
    try {
      const verRes = await api.listFormVersions(formId);
      setVersions(verRes.data.versions);
      setCurrentLiveVersion(verRes.data.currentVersion);
      await loadVersionIntoEditor(formId, verRes.data.currentVersion);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to load form');
    }
  };

  const handleVersionChange = (version: number) => {
    if (selectedFormId) loadVersionIntoEditor(selectedFormId, version);
  };

  const handleNewForm = () => {
    setSelectedFormId('');
    setVersions([]);
    setLoadedVersion(1);
    setCurrentLiveVersion(1);
    setFormTitle('New Service Request Form');
    setFormDepartmentId(LEGACY_OWNER_DEPT_MAP.IT.id);
    setFormDepartmentName(LEGACY_OWNER_DEPT_MAP.IT.name);
    setSlaHours(24);
    setFields(createDefaultBuilderFields());
  };

  const addField = (type: FieldType) => {
    setFields(prev => [...prev, defaultField(type)]);
  };

  const updateField = (id: string, field: BuilderField) => {
    setFields(prev => prev.map(f => f.id === id ? field : f));
  };

  const deleteField = (id: string) => {
    setFields(prev => {
      const target = prev.find(f => f.id === id);
      if (target?.locked) return prev;
      return prev.filter(f => f.id !== id);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await api.saveForm({
        formId: selectedFormId || undefined,
        title: formTitle,
        departmentId: formDepartmentId,
        department: formDepartmentName,
        slaHours,
        fields: builderFieldsToSchema(fields),
        basedOnVersion: selectedFormId ? loadedVersion : undefined,
      });
      const newVersion = res.data.schema.version;
      const formId = res.data.schema.id;
      setSelectedFormId(formId);
      setLoadedVersion(newVersion);
      setCurrentLiveVersion(newVersion);
      const verRes = await api.listFormVersions(formId);
      setVersions(verRes.data.versions);
      await loadFormList();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed. Log in as admin first.');
    } finally {
      setSaving(false);
    }
  };

  const selectedForm = builderForms.find((f) => f.formId === selectedFormId);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground" style={{ fontSize: '20px', fontWeight: 600 }}>Form Builder</h1>
          <p className="text-muted-foreground" style={{ fontSize: '13px' }}>Create dynamic forms with drag-and-drop</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
            {[{ id: 'build', label: 'Build', icon: Wrench }, { id: 'preview', label: 'Preview', icon: Eye }].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'build' | 'preview')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all',
                  activeTab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
                style={{ fontSize: '12px', fontWeight: 500 }}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving || loading}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all disabled:opacity-60',
              saved ? 'bg-emerald-600 text-white' : 'bg-primary text-primary-foreground hover:opacity-90'
            )}
            style={{ fontSize: '13px', fontWeight: 500 }}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saved ? `Saved v${loadedVersion}!` : selectedFormId ? 'Save New Version' : 'Create Form'}
          </motion.button>
        </div>
      </div>

      {/* Form & Version Selector */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>SELECT FORM</label>
              <Select
                value={selectedFormId || '__new__'}
                onValueChange={(value) => (value === '__new__' ? handleNewForm() : handleSelectForm(value))}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="+ Create New Form">
                    {selectedForm ? (
                      <span className="flex items-center gap-2 min-w-0">
                        <DepartmentTag departmentId={selectedForm.departmentId} department={selectedForm.department} />
                        <span className="truncate">{selectedForm.title} (v{selectedForm.currentVersion})</span>
                      </span>
                    ) : (
                      '+ Create New Form'
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__new__">+ Create New Form</SelectItem>
                  {builderForms.map((f) => (
                    <SelectItem key={f.formId} value={f.formId}>
                      <span className="flex items-center gap-2 min-w-0">
                        <DepartmentTag departmentId={f.departmentId} department={f.department} />
                        <span className="truncate">{f.title} (v{f.currentVersion})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedFormId && versions.length > 0 && (
              <div>
                <label className="block mb-1 text-muted-foreground flex items-center gap-1" style={{ fontSize: '11px', fontWeight: 600 }}>
                  <History className="size-3" /> VERSION
                </label>
                <select
                  value={loadedVersion}
                  onChange={(e) => handleVersionChange(parseInt(e.target.value, 10))}
                  disabled={loading}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ fontSize: '13px' }}
                >
                  {versions.map((v) => (
                    <option key={v.version} value={v.version}>
                      v{v.version}{v.isCurrent ? ' (live)' : ''} — {v.changelog || v.filename}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {selectedFormId && (
              <div className="flex items-end">
                <div className={cn(
                  'px-3 py-2 rounded-lg border text-sm w-full',
                  loadedVersion === currentLiveVersion
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300'
                )} style={{ fontSize: '12px' }}>
                  {loadedVersion === currentLiveVersion ? (
                    <>Editing live version <strong>v{loadedVersion}</strong>. Save creates v{currentLiveVersion + 1}.</>
                  ) : (
                    <>Viewing <strong>v{loadedVersion}</strong> (live is v{currentLiveVersion}). Edit & save → creates v{currentLiveVersion + 1}.</>
                  )}
                </div>
              </div>
            )}
          </div>
          {saveError && (
            <p className="mt-2 text-destructive" style={{ fontSize: '12px' }}>{saveError}</p>
          )}
          {loading && (
            <p className="mt-2 text-muted-foreground flex items-center gap-2" style={{ fontSize: '12px' }}>
              <Loader2 className="size-3 animate-spin" /> Loading version...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Form Meta */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>FORM TITLE</label>
              <input
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                style={{ fontSize: '13px' }}
              />
            </div>
            <div>
              <label className="block mb-1 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>
                DEPARTMENT
              </label>
              <Select
                value={formDepartmentId}
                onValueChange={(value) => {
                  const dept = hrmsDepartments.find((d) => String(d.id) === value);
                  setFormDepartmentId(value);
                  setFormDepartmentName(dept?.name || value);
                }}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="Select department">
                    <span className="flex items-center gap-2 min-w-0">
                      <DepartmentTag departmentId={formDepartmentId} department={formDepartmentName} />
                      <span className="truncate">{formDepartmentName}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {hrmsDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      <span className="flex items-center gap-2 min-w-0">
                        <DepartmentTag departmentId={String(dept.id)} department={dept.name} />
                        <span className="truncate">{dept.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-muted-foreground" style={{ fontSize: '10px' }}>
                Owner department for this form. All forms are listed under &quot;{DEFAULT_FORM_CATEGORY}&quot;.
              </p>
            </div>
            <div>
              <label className="block mb-1 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>SLA (HOURS)</label>
              <input
                type="number"
                value={slaHours}
                onChange={e => setSlaHours(parseInt(e.target.value, 10) || 24)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: '13px' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {activeTab === 'build' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Field Palette */}
          <div className="lg:col-span-1">
            <Card className="border-border/60 shadow-sm sticky top-20">
              <CardHeader>
                <CardTitle>Field Types</CardTitle>
                <CardDescription>Click to add to form</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {FIELD_PALETTE.map((p) => (
                    <PaletteItem key={p.type} {...p} onAdd={addField} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Builder Canvas */}
          <div className="lg:col-span-3">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{formTitle}</CardTitle>
                    <CardDescription>{fields.length} field{fields.length !== 1 ? 's' : ''} configured</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-border rounded-xl">
                    <Wrench className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground" style={{ fontSize: '14px' }}>Form is empty</p>
                    <p className="text-muted-foreground" style={{ fontSize: '12px' }}>Click fields from the palette to add them</p>
                  </div>
                ) : (
                  <Reorder.Group axis="y" values={fields} onReorder={setFields} className="space-y-3">
                    {fields.map(f => (
                      <FieldEditor
                        key={f.id}
                        field={f}
                        onChange={(updated) => updateField(f.id, updated)}
                        onDelete={() => deleteField(f.id)}
                      />
                    ))}
                  </Reorder.Group>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={() => addField('text')}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                  style={{ fontSize: '13px' }}
                >
                  <Plus className="size-4" />
                  Add Text Field
                </motion.button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Preview Mode */
        <Card className="border-border/60 shadow-sm w-full">
          <CardHeader>
            <CardTitle>{formTitle}</CardTitle>
            <CardDescription>Preview of how the form will appear to employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {fields.map((field) => (
                <div key={field.id}>
                  {field.type === 'section_title' ? (
                    <h3 className="text-foreground border-b border-border pb-2" style={{ fontSize: '14px', fontWeight: 600 }}>{field.label}</h3>
                  ) : field.type === 'divider' ? (
                    <div className="border-t border-border" />
                  ) : (
                    <div className={field.width === 'half' ? 'w-1/2' : 'w-full'}>
                      <label className="block mb-1.5 text-foreground" style={{ fontSize: '12px', fontWeight: 500 }}>
                        {field.label}{field.required && <span className="text-destructive ml-1">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-muted-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
                          style={{ fontSize: '13px' }}
                          readOnly
                        />
                      ) : ['dropdown'].includes(field.type) ? (
                        <select disabled className="w-full h-10 px-3 rounded-lg border border-border bg-input-background text-muted-foreground" style={{ fontSize: '13px' }}>
                          <option>{field.placeholder || 'Select an option'}</option>
                          {field.options.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : ['radio', 'checkbox'].includes(field.type) ? (
                        <div className="flex flex-wrap gap-3">
                          {field.options.map(o => (
                            <label key={o} className="flex items-center gap-2">
                              <input type={field.type} name={field.id} disabled />
                              <span className="text-muted-foreground" style={{ fontSize: '13px' }}>{o}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                          className="w-full h-10 px-3 rounded-lg border border-border bg-input-background text-muted-foreground placeholder:text-muted-foreground/50 outline-none"
                          style={{ fontSize: '13px' }}
                          readOnly
                        />
                      )}
                      {field.helpText && (
                        <p className="mt-1 text-muted-foreground" style={{ fontSize: '11px' }}>{field.helpText}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
