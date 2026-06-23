import AuditLog from '../models/AuditLog.js';

export function getClientMeta(req) {
  return {
    ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '-',
    browser: req.headers['user-agent']?.slice(0, 120) || '-',
  };
}

export async function createAuditLog({
  action,
  entity,
  entityId,
  user,
  userId,
  department,
  ip,
  browser,
  details,
  severity = 'info',
  metadata,
}) {
  return AuditLog.create({
    action,
    entity,
    entityId,
    user,
    userId,
    department,
    ip,
    browser,
    details,
    severity,
    metadata,
  });
}

export function auditMiddleware(action, entity, getEntityId, getDetails) {
  return async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode >= 400) return;
      try {
        const meta = getClientMeta(req);
        await createAuditLog({
          action,
          entity,
          entityId: getEntityId?.(req, res) || req.params.id || '-',
          user: req.user?.name || 'System',
          userId: req.user?._id,
          department: req.user?.department || 'System',
          ip: meta.ip,
          browser: meta.browser,
          details: getDetails?.(req, res) || `${action} on ${entity}`,
          severity: action.includes('REJECT') || action.includes('ERROR') ? 'error' : action.includes('COMPLETE') || action.includes('APPROVE') ? 'success' : 'info',
        });
      } catch (err) {
        console.error('Audit log failed:', err.message);
      }
    });
    next();
  };
}
