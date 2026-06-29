export interface NotificationPreferences {
  emailSubmitted: boolean;
  emailApproval: boolean;
  emailApproved: boolean;
  emailRejected: boolean;
  emailCompleted: boolean;
  emailReminder: boolean;
  inAppRealtime: boolean;
  emailDailyDigest: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailSubmitted: true,
  emailApproval: true,
  emailApproved: true,
  emailRejected: true,
  emailCompleted: false,
  emailReminder: true,
  inAppRealtime: true,
  emailDailyDigest: false,
};
