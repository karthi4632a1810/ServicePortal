const STAFF_PHOTO_BASE = 'https://mapims.online/files/staff_idcard';

export function getStaffPhotoUrl(staffId) {
  const id = String(staffId || '').trim();
  if (!id) return null;
  return `${STAFF_PHOTO_BASE}/${id}.png`;
}
