import React from 'react';

/**
 * Full-page loading spinner for authentication and major app states
 * @param {string} message - Main loading message
 * @param {string} subtitle - Optional subtitle text
 * @param {string} variant - Loader style variant ('auth', 'switching', 'heavy')
 */
export default function FullPageLoader({ 
  message = "Loading application...", 
  subtitle = "Connecting to authentication...",
  variant = "auth"
}) {
  
  // ⭐ VARIANTS: Different styles for different contexts
  const variants = {
    auth: {
      bgColor: "bg-gray-50",
      spinnerColor: "border-blue-600",
      messageColor: "text-gray-600",
      subtitleColor: "text-gray-400"
    },
    switching: {
      bgColor: "bg-gradient-to-br from-blue-50 to-indigo-100",
      spinnerColor: "border-indigo-600",
      messageColor: "text-indigo-700",
      subtitleColor: "text-indigo-500"
    },
    heavy: {
      bgColor: "bg-gradient-to-br from-purple-50 to-pink-100",
      spinnerColor: "border-purple-600",
      messageColor: "text-purple-700",
      subtitleColor: "text-purple-500"
    },
    error: {
      bgColor: "bg-gradient-to-br from-red-50 to-orange-100",
      spinnerColor: "border-red-600",
      messageColor: "text-red-700",
      subtitleColor: "text-red-500"
    }
  };

  const currentVariant = variants[variant] || variants.auth;

  return (
    <div className={`min-h-screen flex items-center justify-center ${currentVariant.bgColor}`}>
      <div className="text-center max-w-md px-6">
        {/* ⭐ SPINNER: Animated loading spinner */}
        <div className="relative mb-6">
          <div 
            className={`animate-spin rounded-full h-12 w-12 border-b-2 ${currentVariant.spinnerColor} mx-auto`}
          ></div>
          {variant === 'heavy' && (
            <div 
              className={`animate-ping absolute inset-0 rounded-full h-12 w-12 border ${currentVariant.spinnerColor} opacity-20 mx-auto`}
            ></div>
          )}
        </div>

        {/* ⭐ MESSAGE: Main loading message */}
        <p className={`mt-4 ${currentVariant.messageColor} font-medium text-lg`}>
          {message}
        </p>

        {/* ⭐ SUBTITLE: Optional subtitle */}
        {subtitle && (
          <p className={`mt-2 text-sm ${currentVariant.subtitleColor}`}>
            {subtitle}
          </p>
        )}

        {/* ⭐ CONTEXT: Show different hints based on variant */}
        {variant === 'switching' && (
          <div className="mt-4 text-xs text-indigo-400">
            <p>Switching context...</p>
          </div>
        )}

        {variant === 'heavy' && (
          <div className="mt-4 text-xs text-purple-400">
            <p>Loading charts and analytics...</p>
            <p className="mt-1">This may take a moment</p>
          </div>
        )}

        {variant === 'error' && (
          <div className="mt-4 text-xs text-red-400">
            <p>Taking longer than expected...</p>
            <p className="mt-1">Please wait or refresh if needed</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Specific loader variants for common use cases
 */

// ⭐ AUTH: For authentication loading
export const AuthLoader = ({ message, subtitle }) => (
  <FullPageLoader 
    message={message || "Loading application..."} 
    subtitle={subtitle || "Connecting to authentication..."}
    variant="auth" 
  />
);

// ⭐ SWITCHING: For context switching (gym switching, role switching)
export const SwitchingLoader = ({ message, subtitle }) => (
  <FullPageLoader 
    message={message || "Switching context..."} 
    subtitle={subtitle || "Updating your view..."}
    variant="switching" 
  />
);

// ⭐ HEAVY: For heavy operations (reports, analytics)
export const HeavyLoader = ({ message, subtitle }) => (
  <FullPageLoader 
    message={message || "Loading analytics..."} 
    subtitle={subtitle || "Processing charts and data..."}
    variant="heavy" 
  />
);

// ⭐ ERROR: For timeout or error states
export const ErrorLoader = ({ message, subtitle }) => (
  <FullPageLoader 
    message={message || "Still loading..."} 
    subtitle={subtitle || "This is taking longer than expected..."}
    variant="error" 
  />
);