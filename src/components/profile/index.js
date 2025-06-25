/**
 * Profile Management Components
 * 
 * Standardized, reusable components for user profile management
 * including creation, editing, validation, and search functionality.
 */

// Core form components
export { default as ProfileForm } from './ProfileForm';
export { default as ProfileFormField } from './ProfileFormField';

// Modal and dialog components
export { default as ProfileModal } from './ProfileModal';
export { default as ProfileCreationWizard } from './ProfileCreationWizard';

// Search and management components
export { default as ProfileSearch } from './ProfileSearch';
export { default as ProfilePhotoUpload } from './ProfilePhotoUpload';
export { default as ProfileBulkOperations } from './ProfileBulkOperations';

// Validation utilities
export * from '../../utils/profileFormValidation';

/**
 * Usage Examples:
 * 
 * // Simple profile editing modal
 * import { ProfileModal } from '@/components/profile';
 * <ProfileModal 
 *   isOpen={isOpen} 
 *   onClose={onClose} 
 *   profileData={member} 
 *   mode="edit" 
 *   onSave={handleSave} 
 * />
 * 
 * // Profile creation wizard
 * import { ProfileCreationWizard } from '@/components/profile';
 * <ProfileCreationWizard 
 *   isOpen={isOpen} 
 *   onComplete={handleComplete} 
 *   userRole="member" 
 * />
 * 
 * // Profile search with create functionality
 * import { ProfileSearch } from '@/components/profile';
 * <ProfileSearch 
 *   onProfileSelect={handleSelect} 
 *   onCreateNew={handleCreate} 
 *   placeholder="Search members..." 
 * />
 * 
 * // Standalone profile form
 * import { ProfileForm } from '@/components/profile';
 * <ProfileForm 
 *   initialData={data} 
 *   userRole="member" 
 *   onSubmit={handleSubmit} 
 *   showSections={true} 
 * />
 */
