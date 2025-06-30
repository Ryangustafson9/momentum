
import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

const EmptyState = ({
  icon: IconElement,
  title,
  description,
  actionText,
  onActionClick,
  className,
}) => {
  const DefaultIcon = Info;
  
  const renderIcon = () => {
    if (React.isValidElement(IconElement)) {
      return IconElement; 
    }
    if (typeof IconElement === 'function') {
      const CustomIconComponent = IconElement;
      return <CustomIconComponent className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />;
    }
    return <DefaultIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-slate-800/30 ${className}`}
    >
      {renderIcon()}
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">{title}</h3>
      {description && <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">{description}</p>}
      {actionText && onActionClick && (
        <Button
          onClick={onActionClick}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
        >
          {actionText}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;



