export interface NotificationPreferences {
  inAppRealtime: boolean;
  inAppNewTask: boolean;
  inAppSubmitted: boolean;
  inAppApprovalRequired: boolean;
  inAppRequestApproved: boolean;
  inAppRequestRejected: boolean;
  inAppRequestCompleted: boolean;
  inAppSlaReminder: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  inAppRealtime: true,
  inAppNewTask: true,
  inAppSubmitted: true,
  inAppApprovalRequired: true,
  inAppRequestApproved: true,
  inAppRequestRejected: true,
  inAppRequestCompleted: true,
  inAppSlaReminder: true,
};
