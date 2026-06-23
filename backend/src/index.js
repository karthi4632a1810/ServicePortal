import app from './app.js';
import config from './config/index.js';
import connectDatabase from './config/database.js';
import { seedDatabase } from './seeds/seed.js';
import formService from './services/form.service.js';
async function start() {
  try {
    await connectDatabase();

    if (config.nodeEnv !== 'production') {
      await seedDatabase();
      const syncResult = await formService.syncFormsFromFiles();
      if (syncResult.removed.forms > 0) {
        console.log(`Removed ${syncResult.removed.forms} stale form(s) from MongoDB`);
      }
    }

    app.listen(config.port, () => {
    console.log(`Service Portal API running on http://localhost:${config.port}`);
    console.log(`Health: http://localhost:${config.port}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
