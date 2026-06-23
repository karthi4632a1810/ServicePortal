import { cn } from '../ui/utils';
import { getDepartmentTagStyle, getHrmsDepartmentTagStyle } from '../../utils/branding';

interface DepartmentTagProps {
  department?: string;
  category?: string;
  departmentId?: string;
  className?: string;
}

export function DepartmentTag({ department, category, departmentId, className }: DepartmentTagProps) {
  const useHrms = Boolean(departmentId && department);
  const style = useHrms
    ? { ...getHrmsDepartmentTagStyle(departmentId), label: department! }
    : getDepartmentTagStyle(department, category);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border font-semibold shrink-0',
        style.bg,
        style.text,
        style.border,
        className,
      )}
      style={{ fontSize: '10px' }}
    >
      <span className={cn('size-1.5 rounded-full', style.dot)} />
      {style.label || department}
    </span>
  );
}
