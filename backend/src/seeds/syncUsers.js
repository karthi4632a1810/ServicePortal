import User from '../models/User.js';
import {
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_STAFF_ID,
  syncSuperAdmin,
} from './superadmin.js';

const LEGACY_ADMIN_EMAILS = ['karthikeyan@company.com', 'karthi@mapims.edu.in'];

/** Remove legacy accounts — keep super admin and real staff portal users (@portal.local). */
export async function pruneMockUsers() {
  await User.deleteMany({ email: { $in: LEGACY_ADMIN_EMAILS } });

  const result = await User.deleteMany({
    $and: [
      { email: { $not: /@portal\.local$/i } },
      { email: { $ne: SUPER_ADMIN_EMAIL.toLowerCase() } },
      { employeeId: { $ne: SUPER_ADMIN_STAFF_ID } },
    ],
  });
  return result.deletedCount ?? 0;
}

export async function syncDemoUsers() {
  const removed = await pruneMockUsers();
  await syncSuperAdmin({ updatePassword: false });
  if (removed > 0) console.log(`Removed ${removed} other user(s)`);
}

if (process.argv[1]?.includes('syncUsers.js')) {
  import('../config/database.js').then(({ default: connectDatabase }) =>
    connectDatabase()
      .then(() => syncDemoUsers())
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      }),
  );
}
