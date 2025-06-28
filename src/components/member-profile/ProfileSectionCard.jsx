/**
 * Enhanced Profile Section Card
 * Improved accessibility, loading states, and mobile experience
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const ProfileSectionCard = ({
  title,
  description,
  icon: Icon,
  children,
  actions,
  isLoading = false,
  error = null,
  className = '',
  collapsible = false,
  defaultCollapsed = false,
  onRetry,
  headerActions,
  ...props
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)} {...props}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 bg-gray-100 rounded-lg animate-pulse">
                  <Icon className="h-4 w-4 text-gray-400" />
                </div>
              )}
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
                {description && (
                  <div className="h-3 bg-gray-200 rounded w-48 animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-5 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("overflow-hidden border-red-200 bg-red-50", className)} {...props}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium">Failed to load {title}</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const CardWrapper = collapsible ? Collapsible : React.Fragment;
  const cardWrapperProps = collapsible ? { 
    open: !isCollapsed, 
    onOpenChange: setIsCollapsed 
  } : {};

  return (
    <CardWrapper {...cardWrapperProps}>
      <Card 
        className={cn(
          "group relative overflow-hidden rounded-lg border transition-all duration-300",
          "border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300",
          className
        )}
        {...props}
      >
        <CardHeader className="relative pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {Icon && (
                <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {title}
                  </CardTitle>
                  {collapsible && (
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
                      >
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>
                {description && (
                  <CardDescription className="text-sm leading-relaxed max-w-md mt-1">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            
            {/* Header Actions */}
            {(actions || headerActions) && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {headerActions}
                {actions && (
                  <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    {actions}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CollapsibleContent className={collapsible ? undefined : "block"}>
          <CardContent className="pt-0">
            <motion.div
              initial={collapsible ? { opacity: 0, height: 0 } : false}
              animate={collapsible ? { opacity: 1, height: 'auto' } : false}
              exit={collapsible ? { opacity: 0, height: 0 } : false}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </CardWrapper>
  );
};

export default ProfileSectionCard;