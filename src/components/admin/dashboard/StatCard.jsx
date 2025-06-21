import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GripVertical, X } from 'lucide-react';

const StatCard = ({
  cardConfig,
  value,
  trend,
  navigateTo,
  description,
  badgeCount,
  isEditMode,
  onRemoveCard,
  isDragging = false
}) => {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    // Prevent navigation if we're in edit mode or if this is a drag operation
    if (isEditMode || isDragging) {
      e.preventDefault();
      return;
    }
    if (navigateTo) {
      navigate(navigateTo);
    }
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={handleCardClick}
      className={`bg-card border border-border overflow-hidden shadow-sm hover:shadow-md rounded-xl relative transition-all duration-200 ${
        !isEditMode && navigateTo ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-primary/20' : ''
      } ${isDragging ? 'shadow-lg scale-105 rotate-2 z-50' : ''} ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {isEditMode && (
        <>
          {/* Drag Handle */}
          <div className="absolute top-2 left-2 opacity-70 hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-gray-500" />
          </div>

          {/* Remove Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveCard(cardConfig.id);
            }}
            className="absolute top-3 right-3 z-10 bg-destructive text-destructive-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-destructive/90 transition-colors shadow-sm"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="absolute top-3 left-3 z-10 text-muted-foreground/50">
            <GripVertical className="w-4 h-4" />
          </div>
        </>
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {cardConfig.icon ? (
                <div className="p-2 bg-primary/10 rounded-lg">
                  <cardConfig.icon className="h-6 w-6 text-primary" />
                </div>
              ) : (
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <div className="h-4 w-4 bg-primary rounded"></div>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <dt className="text-sm font-medium text-muted-foreground truncate mb-1">
                {cardConfig.title}
              </dt>
              <dd className="text-2xl font-bold text-foreground leading-none">
                {value}
              </dd>
            </div>
          </div>
          {badgeCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
              {badgeCount}
            </span>
          )}
        </div>
        {trend && (
          <p className="mt-4 text-sm text-muted-foreground flex items-center">
            <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            {trend}
          </p>
        )}
        {description && (
          <p className="mt-2 text-xs text-muted-foreground/80">{description}</p>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;


