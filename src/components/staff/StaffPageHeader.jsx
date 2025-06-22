import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Standardized page header component for staff portal pages
 * Ensures consistent positioning, spacing, and layout across all pages
 */
const StaffPageHeader = ({ 
  title, 
  description, 
  icon: Icon, 
  actions = [], 
  badges = [], 
  className = "",
  titleClassName = "",
  descriptionClassName = ""
}) => {
  return (
    <div className={`flex flex-col md:flex-row justify-between items-start gap-4 mb-6 ${className}`}>
      {/* Left side - Title and Description */}
      <div className="flex-grow">
        <h1 className={`text-3xl font-bold tracking-tight flex items-center text-slate-900 dark:text-slate-100 ${titleClassName}`}>
          {Icon && <Icon className="mr-3 h-8 w-8 text-primary" />}
          {title}
        </h1>
        {description && (
          <p className={`text-muted-foreground mt-1.5 ${descriptionClassName}`}>
            {description}
          </p>
        )}
        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {badges.map((badge, index) => (
              <Badge key={index} variant={badge.variant || "secondary"} className={badge.className}>
                {badge.icon && <badge.icon className="w-4 h-4 mr-1" />}
                {badge.text}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Right side - Action Buttons */}
      {actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "default"}
              size={action.size || "default"}
              onClick={action.onClick}
              className={action.className}
              disabled={action.disabled}
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.text}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffPageHeader;

