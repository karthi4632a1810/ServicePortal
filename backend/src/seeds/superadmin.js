import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { getInitials } from '../utils/helpers.js';

/** Fixed super admin — not managed via User Management staff add/import. */
export const SUPER_ADMIN_STAFF_ID = '12345';
export const SUPER_ADMIN_EMAIL = 'superadmin@mapims.edu.in';
export const SUPER_ADMIN_PASSWORD = 'superadmin';
export const SUPER_ADMIN_NAME = 'Super Admin';
export const SUPER_ADMIN_DEPARTMENT = 'Information Technology';

export function isSuperAdminAccount(user) {
  if (!user) return false;
  const staffId = String(user.employeeId || '').trim();
  const email = String(user.email || '').toLowerCase();
  return user.role === 'super_admin'
    && (staffId === SUPER_ADMIN_STAFF_ID || email === SUPER_ADMIN_EMAIL.toLowerCase());
}

/**
 * Sync the fixed super admin profile.
 * Password is updated only when updatePassword is true (run seed:superadmin).
 */
export async function syncSuperAdmin({ updatePassword = false } = {}) {
  const email = SUPER_ADMIN_EMAIL.toLowerCase();
  const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

  const profile = {
    name: SUPER_ADMIN_NAME,
    email,
    role: 'super_admin',
    department: SUPER_ADMIN_DEPARTMENT,
    employeeId: SUPER_ADMIN_STAFF_ID,
    initials: getInitials(SUPER_ADMIN_NAME),
    avatar: getInitials(SUPER_ADMIN_NAME),
    active: true,
    portalPasswordChangedAt: null,
  };

  let user = await User.findOne({
    $or: [{ employeeId: SUPER_ADMIN_STAFF_ID }, { email }],
  }).select('+password');

  if (user) {
    const update = { $set: profile };
    if (updatePassword) {
      update.$set.password = hashedPassword;
    }
    await User.findOneAndUpdate({ _id: user._id }, update);
  } else {
    user = await User.create({ ...profile, password: hashedPassword });
  }

  // Remove any other super_admin accounts (staff must be employee/hod only).
  const removed = await User.deleteMany({
    role: 'super_admin',
    employeeId: { $ne: SUPER_ADMIN_STAFF_ID },
    email: { $ne: email },
  });

  if (updatePassword) {
    console.log(`Super admin password set to seed value. Staff ID: ${SUPER_ADMIN_STAFF_ID}`);
  } else {
    console.log(`Synced super admin profile (Staff ID ${SUPER_ADMIN_STAFF_ID})`);
  }
  if (removed.deletedCount > 0) {
    console.log(`Removed ${removed.deletedCount} duplicate super admin account(s)`);
  }

  return user;
}

if (process.argv[1]?.includes('superadmin.js')) {
  import('../config/database.js').then(({ default: connectDatabase }) =>
    connectDatabase()
      .then(() => syncSuperAdmin({ updatePassword: true }))
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      }),
  );
}
