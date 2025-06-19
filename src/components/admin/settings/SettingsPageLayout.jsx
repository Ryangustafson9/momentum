
import React from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Wrench as Tool } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { useNavigate } from 'react-router-dom';

const SettingsPageLayout = ({ pageTitle, pageDescription, children }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <SettingsIcon className="mr-3 h-8 w-8 text-primary" /> {pageTitle}
          </h1>
          <p className="text-muted-foreground mt-1">{pageDescription}</p>
        </div>
        <Button
            onClick={() => navigate('/admin/adminpanel')}
            variant="outline"
            className="mt-4 md:mt-0 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-purple-600 hover:border-purple-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <Tool className="mr-2 h-4 w-4" /> Admin Panel
        </Button>
      </div>
      {children}
    </motion.div>
  );
};

export default SettingsPageLayout;


