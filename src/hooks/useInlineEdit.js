/**
 * Standardized Inline Editing Hook
 * Provides consistent editing behavior across all profile sections
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';

export const useInlineEdit = ({
  initialValue = '',
  fieldName,
  onSave,
  onValidate,
  autoSave = false,
  autoSaveDelay = 1000,
  required = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [originalValue, setOriginalValue] = useState(initialValue);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const autoSaveTimeoutRef = useRef(null);

  // Update value when initialValue changes
  useEffect(() => {
    setValue(initialValue);
    setOriginalValue(initialValue);
  }, [initialValue]);

  // Validation function
  const validate = useCallback((val) => {
    if (required && (!val || val.toString().trim() === '')) {
      return `${fieldName} is required`;
    }
    
    if (onValidate) {
      return onValidate(val);
    }
    
    return '';
  }, [required, fieldName, onValidate]);

  // Debounced auto-save
  const debouncedAutoSave = useCallback(
    debounce(async (val) => {
      if (autoSave && val !== originalValue) {
        const validationError = validate(val);
        if (!validationError) {
          try {
            setIsSaving(true);
            await onSave(val);
            setOriginalValue(val);
            setError('');
          } catch (err) {
            setError(err.message || 'Failed to save');
            toast({
              title: "Auto-save failed",
              description: err.message || 'Please try again',
              variant: "destructive"
            });
          } finally {
            setIsSaving(false);
          }
        }
      }
    }, autoSaveDelay),
    [autoSave, originalValue, validate, onSave, autoSaveDelay, toast]
  );

  // Start editing
  const startEdit = useCallback(() => {
    setIsEditing(true);
    setError('');
  }, []);

  // Handle value change
  const handleChange = useCallback((newValue) => {
    setValue(newValue);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
    
    // Trigger auto-save if enabled
    if (autoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      debouncedAutoSave(newValue);
    }
  }, [error, autoSave, debouncedAutoSave]);

  // Save changes
  const save = useCallback(async () => {
    const validationError = validate(value);
    if (validationError) {
      setError(validationError);
      return false;
    }

    try {
      setIsSaving(true);
      await onSave(value);
      setOriginalValue(value);
      setIsEditing(false);
      setError('');
      
      toast({
        title: "Saved",
        description: `${fieldName} updated successfully`,
        variant: "default"
      });
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to save');
      toast({
        title: "Save failed",
        description: err.message || 'Please try again',
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [value, validate, onSave, fieldName, toast]);

  // Cancel editing
  const cancel = useCallback(() => {
    setValue(originalValue);
    setIsEditing(false);
    setError('');
    
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    debouncedAutoSave.cancel();
  }, [originalValue, debouncedAutoSave]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  }, [save, cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      debouncedAutoSave.cancel();
    };
  }, [debouncedAutoSave]);

  return {
    // State
    isEditing,
    value,
    originalValue,
    error,
    isSaving,
    hasChanges: value !== originalValue,
    
    // Actions
    startEdit,
    save,
    cancel,
    handleChange,
    handleKeyDown,
    
    // Computed
    isValid: !error && validate(value) === '',
    isDirty: value !== originalValue
  };
};

export default useInlineEdit;
