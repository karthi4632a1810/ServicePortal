import type { AppNotification } from '../types';
import type { Page } from '../types';
import { hasAdminAccess } from './roleAccess';

export function getPageForNotification(notification: AppNotification, role?: string): Page {
  switch (notification.type) {
    case 'new_task':
      return 'my-tasks';
    case 'approval_required':
      if (notification.title === 'Confirm Completion') return 'my-tasks';
      if (role && hasAdminAccess(role)) return 'approvals';
      return 'my-tasks';
    case 'request_approved':
    case 'request_rejected':
    case 'request_completed':
      return 'request-detail';
    case 'reminder':
      return 'my-tasks';
    default:
      return 'my-requests';
  }
}

export function getParamsForNotification(notification: AppNotification, page: Page): Record<string, unknown> {
  if (page === 'request-detail') {
    const returnTo = ['request_approved', 'request_rejected', 'request_completed'].includes(notification.type)
      ? 'my-requests'
      : 'my-tasks';
    return { returnTo, taskMode: returnTo === 'my-tasks' };
  }
  if (page === 'my-tasks') return { returnTo: 'my-tasks' };
  if (page === 'approvals') return { returnTo: 'approvals' };
  return {};
}
