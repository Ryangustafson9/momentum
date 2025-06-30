/**
 * Password Strength Indicator Component
 * Visual feedback for password strength and requirements
 */

import React from 'react';
import { Check, X, AlertTriangle, Eye, EyeOff, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Password strength progress bar with color coding
 */
export const PasswordStrengthBar = ({ strength, score, className }) => {
  const getStrengthColor = (strengthLevel) => {
    const colors = {
      'very-weak': 'bg-red-500',
      'weak': 'bg-orange-500',
      'medium': 'bg-yellow-500',
      'strong': 'bg-green-500',
      'very-strong': 'bg-emerald-500'
    };
    return colors[strengthLevel] || 'bg-gray-300';
  };

  const getProgressWidth = () => {
    if (score <= 0) return '0%';
    if (score >= 100) return '100%';
    return `${score}%`;
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-600">Password Strength</span>
        <span className={cn(
          "text-xs font-medium capitalize",
          strength === 'very-strong' && "text-emerald-600",
          strength === 'strong' && "text-green-600",
          strength === 'medium' && "text-yellow-600",
          strength === 'weak' && "text-orange-600",
          strength === 'very-weak' && "text-red-600"
        )}>
          {strength?.replace('-', ' ') || 'None'}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={cn(
            "h-2 rounded-full transition-all duration-300 ease-in-out",
            getStrengthColor(strength)
          )}
          style={{ width: getProgressWidth() }}
        />
      </div>
    </div>
  );
};

/**
 * Password requirements checklist
 */
export const PasswordRequirements = ({ requirements, className }) => {
  if (!requirements || requirements.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-medium text-gray-700">Password Requirements</h4>
      <div className="space-y-1">
        {requirements.map((req) => (
          <div key={req.key} className="flex items-center gap-2">
            {req.met ? (
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
            <span className={cn(
              "text-xs",
              req.met ? "text-green-700" : "text-gray-500",
              req.required && !req.met && "font-medium"
            )}>
              {req.label}
            </span>
            {req.required && !req.met && (
              <span className="text-red-500 text-xs">*</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Password security warnings and suggestions
 */
export const PasswordWarnings = ({ 
  isCompromised, 
  suggestions, 
  crackTime, 
  isChecking,
  className 
}) => {
  if (!isCompromised && (!suggestions || suggestions.length === 0) && !crackTime) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Compromised password warning */}
      {isCompromised && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Password Found in Data Breach
            </p>
            <p className="text-xs text-red-600 mt-1">
              This password has been found in known data breaches. Please choose a different password.
            </p>
          </div>
        </div>
      )}

      {/* Checking status */}
      {isChecking && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
          <span>Checking password security...</span>
        </div>
      )}

      {/* Crack time estimation */}
      {crackTime && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Clock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Time to Crack: {crackTime.time}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {crackTime.isSecure 
                ? "This password would take a very long time to crack."
                : "This password could be cracked relatively quickly. Consider making it stronger."
              }
            </p>
          </div>
        </div>
      )}

      {/* Improvement suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="space-y-1">
          <h5 className="text-xs font-medium text-gray-700">Suggestions to improve:</h5>
          <ul className="text-xs text-gray-600 space-y-0.5">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-gray-400">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Password visibility toggle button
 */
export const PasswordToggle = ({ showPassword, onToggle, className }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "absolute right-3 top-1/2 transform -translate-y-1/2",
        "text-gray-400 hover:text-gray-600 transition-colors",
        "focus:outline-none focus:text-gray-600",
        className
      )}
      tabIndex={-1}
    >
      {showPassword ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </button>
  );
};

/**
 * Complete password strength indicator with all features
 */
export const PasswordStrengthIndicator = ({ 
  validation,
  isCompromised,
  crackTime,
  isChecking,
  showRequirements = true,
  showWarnings = true,
  className 
}) => {
  if (!validation) {
    return null;
  }

  const requirements = [
    {
      key: 'minLength',
      label: 'At least 8 characters',
      met: validation.requirements?.minLength || false,
      required: true
    },
    {
      key: 'hasUppercase',
      label: 'One uppercase letter (A-Z)',
      met: validation.requirements?.hasUppercase || false,
      required: true
    },
    {
      key: 'hasLowercase',
      label: 'One lowercase letter (a-z)',
      met: validation.requirements?.hasLowercase || false,
      required: true
    },
    {
      key: 'hasNumbers',
      label: 'One number (0-9)',
      met: validation.requirements?.hasNumbers || false,
      required: true
    },
    {
      key: 'hasSpecialChars',
      label: 'One special character (!@#$%^&*)',
      met: validation.requirements?.hasSpecialChars || false,
      required: true
    },
    {
      key: 'notCommonPassword',
      label: 'Not a common password',
      met: validation.requirements?.notCommonPassword || false,
      required: true
    }
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength bar */}
      <PasswordStrengthBar 
        strength={validation.strength}
        score={validation.score}
      />

      {/* Requirements checklist */}
      {showRequirements && (
        <PasswordRequirements requirements={requirements} />
      )}

      {/* Warnings and suggestions */}
      {showWarnings && (
        <PasswordWarnings
          isCompromised={isCompromised}
          suggestions={validation.suggestions}
          crackTime={crackTime}
          isChecking={isChecking}
        />
      )}
    </div>
  );
};

/**
 * Enhanced password input with built-in strength indicator
 */
export const PasswordInput = ({ 
  value,
  onChange,
  validation,
  isCompromised,
  crackTime,
  isChecking,
  showPassword,
  onTogglePassword,
  placeholder = "Enter password",
  className,
  ...props 
}) => {
  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full px-3 py-2 pr-10 border border-gray-300 rounded-md",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "placeholder-gray-400",
            validation && !validation.isValid && "border-red-300 focus:ring-red-500 focus:border-red-500",
            validation && validation.isValid && "border-green-300 focus:ring-green-500 focus:border-green-500",
            className
          )}
          {...props}
        />
        <PasswordToggle 
          showPassword={showPassword}
          onToggle={onTogglePassword}
        />
      </div>

      {value && (
        <PasswordStrengthIndicator
          validation={validation}
          isCompromised={isCompromised}
          crackTime={crackTime}
          isChecking={isChecking}
        />
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
