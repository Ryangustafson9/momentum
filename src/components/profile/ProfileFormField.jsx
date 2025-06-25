import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Standardized profile form field component with validation and error handling
 */
const ProfileFormField = ({
  label,
  name,
  type = 'text',
  value = '',
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error = null,
  success = false,
  helperText = null,
  options = [], // For select fields
  rows = 3, // For textarea
  min,
  max,
  step,
  className = '',
  children, // For custom input components
  ...props
}) => {
  const fieldId = `profile-field-${name}`;
  const hasError = !!error;
  const hasSuccess = success && !hasError;

  const handleInputChange = (e) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    onChange?.(name, newValue, e);
  };

  const handleSelectChange = (newValue) => {
    onChange?.(name, newValue);
  };

  const renderInput = () => {
    // If children are provided, use them (for custom components like Select)
    if (children) {
      return children;
    }

    // Handle different input types
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            id={fieldId}
            name={name}
            value={value}
            onChange={handleInputChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={cn(
              'transition-colors',
              hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              hasSuccess && 'border-green-500 focus:border-green-500 focus:ring-green-500',
              className
            )}
            {...props}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={handleSelectChange} disabled={disabled}>
            <SelectTrigger
              className={cn(
                'transition-colors',
                hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                hasSuccess && 'border-green-500 focus:border-green-500 focus:ring-green-500',
                className
              )}
            >
              <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            id={fieldId}
            name={name}
            type={type}
            value={value}
            onChange={handleInputChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={cn(
              'transition-colors',
              hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              hasSuccess && 'border-green-500 focus:border-green-500 focus:ring-green-500',
              className
            )}
            {...props}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label 
          htmlFor={fieldId}
          className={cn(
            'text-sm font-medium',
            hasError && 'text-red-700',
            hasSuccess && 'text-green-700'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {/* Status indicators */}
        <div className="flex items-center gap-1">
          {required && (
            <Badge variant="outline" className="text-xs">
              Required
            </Badge>
          )}
          {hasError && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          {hasSuccess && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>

      {renderInput()}

      {/* Error message */}
      {hasError && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* Helper text */}
      {helperText && !hasError && (
        <p className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default ProfileFormField;
