import React from 'react';
import { motion } from 'framer-motion';
import ProfileSystemDemo from '@/components/profile/ProfileSystemDemo';

/**
 * Test page for the enhanced profile management system
 */
const ProfileSystemTest = () => {
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto py-8">
        <ProfileSystemDemo />
      </div>
    </motion.div>
  );
};

export default ProfileSystemTest;
