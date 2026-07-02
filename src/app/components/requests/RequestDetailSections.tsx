import React, { useMemo, useState } from 'react';
import { User, Building2, Paperclip } from 'lucide-react';
import type { Attachment, FormSchema, Request } from '../../types';
import { AttachmentListItem, AttachmentPreviewModal } from '../attachments/AttachmentPreviewModal';

function formatAnswerValue(value: unknown): string {
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

export function useFormAnswerRows(request: Request | null, forms: FormSchema[]) {
  return useMemo(() => {
    if (!request?.answers) return [];
    const schema = forms.find((f) => f.id === request.formId);
    const labelMap = new Map(
      (schema?.fields || [])
        .filter((f) => f.type !== 'section_title' && f.type !== 'divider')
        .map((f) => [f.id, f.label]),
    );

    return Object.entries(request.answers)
      .filter(([key]) => !key.startsWith('_'))
      .map(([key, value]) => ({
        key,
        label: labelMap.get(key) || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: formatAnswerValue(value),
      }));
  }, [request, forms]);
}

export function RequestEmployeeSection({ request }: { request: Request }) {
  const emp = request.employee;
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
      <p className="text-foreground flex items-center gap-1.5" style={{ fontSize: '12px', fontWeight: 600 }}>
        <User className="size-3.5 text-primary" />
        Employee Details
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[
          { label: 'Name', value: emp.name },
          { label: 'Staff ID', value: emp.id },
          { label: 'Department', value: emp.department },
          { label: 'Designation', value: emp.designation },
          { label: 'Branch', value: emp.branch },
          { label: 'Mobile', value: emp.mobile },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-muted-foreground" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
            <p className="text-foreground" style={{ fontSize: '12px' }}>{value || '—'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RequestAnswersSection({
  rows,
}: {
  rows: { key: string; label: string; value: string }[];
}) {
  if (!rows.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
      <p className="text-foreground flex items-center gap-1.5" style={{ fontSize: '12px', fontWeight: 600 }}>
        <Building2 className="size-3.5 text-primary" />
        Request Details
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {rows.map(({ key, label, value }) => (
          <div key={key} className={value.length > 80 ? 'sm:col-span-2' : undefined}>
            <p className="text-muted-foreground" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
            <p className="text-foreground whitespace-pre-wrap break-words" style={{ fontSize: '12px' }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RequestAttachmentsSection({ request }: { request: Request }) {
  const [preview, setPreview] = useState<Attachment | null>(null);

  if (!request.attachments?.length) return null;
  return (
    <>
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
        <p className="text-foreground flex items-center gap-1.5" style={{ fontSize: '12px', fontWeight: 600 }}>
          <Paperclip className="size-3.5 text-primary" />
          Attachments
        </p>
        <div className="space-y-1.5">
          {request.attachments.map((att) => (
            <AttachmentListItem key={att.id} attachment={att} onPreview={setPreview} />
          ))}
        </div>
      </div>
      <AttachmentPreviewModal
        attachment={preview}
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
      />
    </>
  );
}

export function RequestDetailSections({
  request,
  forms,
}: {
  request: Request;
  forms: FormSchema[];
}) {
  const rows = useFormAnswerRows(request, forms);
  return (
    <div className="space-y-3">
      <RequestEmployeeSection request={request} />
      <RequestAnswersSection rows={rows} />
      <RequestAttachmentsSection request={request} />
    </div>
  );
}
