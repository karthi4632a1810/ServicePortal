const STAFF_PHOTO_BASE = 'https://mapims.online/files/staff_idcard';

export function getStaffPhotoUrl(staffId: string | null | undefined): string | undefined {
  const id = String(staffId || '').trim();
  if (!id) return undefined;
  return `${STAFF_PHOTO_BASE}/${id}.png`;
}

export function isStaffPhotoUrl(value: string | undefined): boolean {
  return Boolean(value?.startsWith('http'));
}
