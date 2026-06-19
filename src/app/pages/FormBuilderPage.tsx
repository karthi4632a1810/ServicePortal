import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import {
  Plus, Trash2, GripVertical, ChevronDown, Settings, Eye,
  Save, Wrench, Type, AlignLeft, Hash, Mail, Phone, Calendar,
  Clock, ChevronRight, CheckSquare, List, Upload, Divide, Tag,
  ToggleLeft, Minus, User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { cn } from '../components/ui/utils';
import { MOCK_FORMS } from '../data/mockData';

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
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
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
                      className="w-full h-8 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                      className="w-full h-8 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
  const [formTitle, setFormTitle] = useState('New Service Request Form');
  const [formDept, setFormDept] = useState('IT');
  const [fields, setFields] = useState<BuilderField[]>([
    { ...defaultField('section_title'), label: 'Employee Information', id: 'init-1' },
    { ...defaultField('text'), label: 'Full Name', required: true, id: 'init-2' },
    { ...defaultField('email'), label: 'Email Address', required: true, id: 'init-3', width: 'half' },
  ]);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'build' | 'preview'>('build');

  const addField = (type: FieldType) => {
    setFields(prev => [...prev, defaultField(type)]);
  };

  const updateField = (id: string, field: BuilderField) => {
    setFields(prev => prev.map(f => f.id === id ? field : f));
  };

  const deleteField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground" style={{ fontSize: '20px', fontWeight: 600 }}>Form Builder</h1>
          <p className="text-muted-foreground" style={{ fontSize: '13px' }}>Create dynamic service request forms with drag-and-drop</p>
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
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
              saved ? 'bg-emerald-600 text-white' : 'bg-primary text-primary-foreground hover:opacity-90'
            )}
            style={{ fontSize: '13px', fontWeight: 500 }}
          >
            <Save className="size-4" />
            {saved ? 'Saved!' : 'Save Form'}
          </motion.button>
        </div>
      </div>

      {/* Form Meta */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <label className="block mb-1 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>DEPARTMENT</label>
              <select
                value={formDept}
                onChange={e => setFormDept(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: '13px' }}
              >
                <option>IT</option>
                <option>HR</option>
                <option>Finance</option>
                <option>Operations</option>
                <option>Admin</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>CATEGORY</label>
              <select className="w-full h-9 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30" style={{ fontSize: '13px' }}>
                <option>IT Services</option>
                <option>HR Services</option>
                <option>Finance Services</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>SLA (HOURS)</label>
              <input
                type="number"
                defaultValue={24}
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
        <Card className="border-border/60 shadow-sm max-w-[700px]">
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
