import PortalSettings from '../models/PortalSettings.js';
import { loadConfigFile } from '../utils/fileLoader.js';
import { AppError } from '../utils/response.js';

const SETTINGS_KEY = 'organization';

async function getDefaultOrganization() {
  try {
    const [defaults] = await loadConfigFile('organization.json');
    if (defaults) return defaults;
  } catch {
    // fall through
  }
  return {
    companyName: 'MAPIMS',
    companyDomain: 'mapims.edu.in',
    defaultSlaHours: 24,
    adminEmail: 'it@mapims.edu.in',
  };
}

function normalizeOrganization(input) {
  const companyName = String(input.companyName || '').trim();
  const companyDomain = String(input.companyDomain || '').trim();
  const adminEmail = String(input.adminEmail || '').trim().toLowerCase();
  const defaultSlaHours = Number(input.defaultSlaHours);

  if (!companyName) throw new AppError('Company name is required', 400);
  if (!companyDomain) throw new AppError('Company domain is required', 400);
  if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new AppError('Valid admin email is required', 400);
  }
  if (!Number.isFinite(defaultSlaHours) || defaultSlaHours < 1 || defaultSlaHours > 720) {
    throw new AppError('Default SLA must be between 1 and 720 hours', 400);
  }

  return { companyName, companyDomain, adminEmail, defaultSlaHours };
}

export const settingsService = {
  async getOrganization() {
    let doc = await PortalSettings.findOne({ key: SETTINGS_KEY }).lean();
    if (!doc) {
      const organization = await getDefaultOrganization();
      doc = await PortalSettings.create({ key: SETTINGS_KEY, organization });
      return doc.organization;
    }
    return doc.organization;
  },

  async updateOrganization(payload, user) {
    const organization = normalizeOrganization(payload);
    const doc = await PortalSettings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { organization, updatedBy: user?._id || null },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    return doc.organization;
  },
};

export default settingsService;
