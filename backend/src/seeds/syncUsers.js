import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { getInitials } from '../utils/helpers.js';

const DEFAULT_PASSWORD = 'Password@123';

export const DEMO_USERS = [
  {
    name: 'Karthikeyan',
    email: 'karthikeyan@company.com',
    role: 'super_admin',
    department: 'Information Technology',
    employeeId: '60464',
  },
];

export async function syncDemoUsers() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const u of DEMO_USERS) {
    await User.findOneAndUpdate(
      { email: u.email.toLowerCase() },
      {
        ...u,
        email: u.email.toLowerCase(),
        password: hashedPassword,
        initials: getInitials(u.name),
        avatar: getInitials(u.name),
        active: true,
      },
      { upsert: true, new: true },
    );
  }

  console.log(`Synced ${DEMO_USERS.length} admin user(s)`);
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
