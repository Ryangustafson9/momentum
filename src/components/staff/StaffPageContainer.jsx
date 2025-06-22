import React from 'react';
import { motion } from 'framer-motion';

/**
 * Standardized page container for staff portal pages
 * Provides consistent spacing, animation, and responsive layout
 */
const StaffPageContainer = ({ 
  children, 
  className = "",
  enableAnimation = true,
  containerType = "default" // "default", "full-width", "card"
}) => {
  const baseClasses = "min-h-screen";
  
  const containerClasses = {
    default: "container mx-auto px-4 md:px-6 py-6 space-y-6",
    "full-width": "px-4 md:px-6 py-6 space-y-6",
    card: "container mx-auto px-4 md:px-6 py-6"
  };

  const content = (
    <div className={`${baseClasses} ${containerClasses[containerType]} ${className}`}>
      {children}
    </div>
  );

  if (!enableAnimation) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${baseClasses} ${containerClasses[containerType]} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default StaffPageContainer;

