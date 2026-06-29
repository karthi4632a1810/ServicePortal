import { useApp } from '../context/AppContext';

export function useAnimationsEnabled() {
  const { preferences } = useApp();
  return preferences.animations;
}
