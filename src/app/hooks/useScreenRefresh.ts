import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

/** Register the active page's data loader for the header refresh button. */
export function useScreenRefresh(refresh: () => void | Promise<void>) {
  const { registerScreenRefresh } = useApp();
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    registerScreenRefresh(() => refreshRef.current());
    return () => registerScreenRefresh(null);
  }, [registerScreenRefresh]);
}
