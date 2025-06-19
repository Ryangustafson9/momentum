/**
 * 🔧 ADMIN PANEL PAGE
 * Master administrative control panel with backend settings
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Database, Activity, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions.jsx';
import AdminPanelSettingsTab from '@/components/admin/settings/tabs/AdminPanelSettingsTab';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need administrator privileges to access this panel.</p>
          <Button onClick={() => navigate('/staff/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start">
          <Button
            variant="ghost"
            onClick={() => navigate('/staff/settings')}
            className="mr-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <Settings className="w-6 h-6 text-white" />
              </div>
              Admin Panel
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Master administrative controls and backend settings</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 rounded-xl border border-green-200 shadow-sm">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
          <span className="text-sm text-green-700 font-semibold">Admin Access Active</span>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">System Status</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">Healthy</p>
              <p className="text-xs text-blue-600 mt-1">All systems operational</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Security</p>
              <p className="text-2xl font-bold text-green-900 mt-1">Secure</p>
              <p className="text-xs text-green-600 mt-1">No threats detected</p>
            </div>
            <div className="p-3 bg-green-500 rounded-xl shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Active Users</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">24</p>
              <p className="text-xs text-purple-600 mt-1">Currently online</p>
            </div>
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Configurations</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">12</p>
              <p className="text-xs text-orange-600 mt-1">Settings configured</p>
            </div>
            <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Admin Panel Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gray-600" />
            Administrative Controls
          </h2>
          <p className="text-sm text-gray-600 mt-1">Manage system settings, permissions, and configurations</p>
        </div>
        <div className="p-6">
          <AdminPanelSettingsTab />
        </div>
      </motion.div>
    </div>
  );
};

export default AdminPanel;
