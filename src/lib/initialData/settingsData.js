
import React from 'react';
export const initialGeneralSettingsData = {
  id: 'general_settings',
  gymName: 'GymPro Fitness',
  address: '123 Wellness Way, Fitville, ST 54321',
  phone: '555-123-4567',
  email: 'contact@gympro.com',
  logoUrl: '/placeholder-logo.svg',
  timezone: 'America/New_York',
  currency: 'USD',
  weightUnit: 'lbs',
  measurementUnit: 'inches',
  dateFormat: 'MM/dd/yyyy',
  timeFormat: 'h:mm a',
  checkInWindowMinutes: 15,
  autoAssignNewMemberRole: true, 
  defaultMemberRole: 'member', 
};

export const initialNotificationSettingsData = {
  id: 'notification_settings',
  emailNotificationsEnabled: true,
  smsNotificationsEnabled: false, 
  memberCheckIn: true,
  classBookingConfirmation: true,
  classCancellation: true,
  membershipRenewalReminders: true, 
  paymentReceipts: true,
  lowStockAlerts: false,
  systemUpdates: true,
  daysBeforeRenewalReminder: 7,
};

export const initialSecuritySettingsData = {
  id: 'security_settings',
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumber: true,
  passwordRequireSpecialChar: false,
  twoFactorAuthentication: 'disabled', 
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
};

export const initialBillingSettingsData = {
  id: 'billing_settings',
  paymentGateway: 'stripe', 
  taxRatePercent: 0, 
  autoChargeEnabled: true,
  invoiceNotes: 'Thank you for your business!',
  lateFeeAmount: 0,
  gracePeriodDays: 3,
};

export const initialAdminPanelSettingsData = {
  id: 'admin_panel_settings',
  enableSupportTickets: true,
  enableSystemLogs: true,
  dataRetentionPolicyDays: 365,
};

export const initialReportingSettingsData = {
  id: 'reporting_settings',
  defaultReportPeriod: 'monthly', 
  favoriteReports: ['membership_summary', 'attendance_overview'],
};

export const initialAppearanceSettingsData = {
  id: 'appearance_settings',
  primaryColor: '#3B82F6', 
  secondaryColor: '#6366F1', 
  accentColor: '#EC4899', 
  fontFamily: 'Inter, sans-serif', 
  darkModeEnabled: true,
  allowUserThemeSelection: true,
};



