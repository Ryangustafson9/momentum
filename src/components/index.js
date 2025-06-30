// Main Components Export File
// This file provides clean imports for all organized components

// Layout Components
export * from './layout';

// Shared/Common Components  
export * from './shared';

// Billing Components
export * from './billing';

// Communication Components
export * from './communication';

// Legacy Components (use with caution)
export * from './legacy';

// Feature-specific exports (existing organized folders)
export * from './ui';
export * from './admin';
export * from './auth';
export * from './checkin';
export * from './classes';
export * from './corporate';
export * from './documents';
export * from './member';
export * from './member-profile';
export * from './membership';
export * from './mobile';
export * from './navigation';
export * from './optimization';
export * from './profile';
export * from './realtime';
export * from './reports';
export * from './sales';
export * from './scheduling';
export * from './staff';

// Root level components that remain
export { default as AccountIndicator } from './AccountIndicator';
export { default as ClubSettingsRoute } from './ClubSettingsRoute';
export { default as PasswordResetModal } from './PasswordResetModal';
export { default as PermissionGate } from './PermissionGate';
export { default as PrivateRoute } from './PrivateRoute';
export { default as PublicRoute } from './PublicRoute';
