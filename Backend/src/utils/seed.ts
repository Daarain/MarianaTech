import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { config } from '../config/env';
import { connectDatabase, disconnectDatabase } from '../config/database';

export async function seedInitialUsers(): Promise<void> {
  try {
    const adminPasswordHash = await bcrypt.hash(config.adminInitialPassword, 10);
    await User.findOneAndUpdate(
      { username: 'admin' },
      {
        name: 'Cdr. A. Fernando',
        username: 'admin',
        passwordHash: adminPasswordHash,
        role: 'admin',
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('[Seed] Admin user configured: Cdr. A. Fernando (username: admin)');

    const operatorPasswordHash = await bcrypt.hash(config.operatorInitialPassword, 10);
    await User.findOneAndUpdate(
      { username: 'operator' },
      {
        name: 'Lt. R. Mehta',
        username: 'operator',
        passwordHash: operatorPasswordHash,
        role: 'operator',
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('[Seed] Operator user configured: Lt. R. Mehta (username: operator)');
  } catch (error: any) {
    console.error('[Seed Error] Failed to seed initial users:', error.message);
  }
}

// Runnable seed script entry point if called via `npm run seed`
if (require.main === module) {
  (async () => {
    await connectDatabase();
    await seedInitialUsers();
    await disconnectDatabase();
    process.exit(0);
  })();
}
