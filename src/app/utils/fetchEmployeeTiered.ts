import { api } from '../services/api';
import type { Employee } from '../types';
import { getCachedEmployee, setCachedEmployee } from './employeeCacheDb';

/** IndexedDB → Mongo fast API → HRMS live (background refresh). */
export async function fetchEmployeeTiered(
  employeeId: string,
  phone?: string,
  onUpdate?: (employee: Employee) => void,
): Promise<Employee | null> {
  const id = employeeId.trim();
  if (!id) return null;

  if (phone) {
    const res = await api.getEmployeeLive(id, phone);
    onUpdate?.(res.data);
    void setCachedEmployee(res.data);
    return res.data;
  }

  const local = await getCachedEmployee(id);
  if (local) {
    onUpdate?.(local);
  }

  const refreshLive = () => {
    void api.getEmployeeLive(id).then((live) => {
      onUpdate?.(live.data);
      void setCachedEmployee(live.data);
    }).catch(() => {});
  };

  try {
    const fast = await api.getEmployeeFast(id);
    onUpdate?.(fast.data);
    void setCachedEmployee(fast.data);
    refreshLive();
    return fast.data;
  } catch {
    if (local) {
      refreshLive();
      return local;
    }
    try {
      const res = await api.getEmployee(id);
      onUpdate?.(res.data);
      void setCachedEmployee(res.data);
      return res.data;
    } catch {
      return null;
    }
  }
}
