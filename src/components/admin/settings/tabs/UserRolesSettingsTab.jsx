
<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast.js';
import { dataService } from '@/services/apiService';
import { PlusCircle, Edit, Trash2, ShieldCheck, Users } from 'lucide-react';
import RoleFormDialog from '@/components/admin/settings/RoleFormDialog.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.jsx";
=======
/**
 * 🔐 USER ROLES SETTINGS TAB
 * Enhanced staff permissions management integrated with Plan Management
 */

import React from 'react';
import StaffPermissionsManager from '@/components/admin/permissions/StaffPermissionsManager';
>>>>>>> feature/role-management

const UserRolesSettingsTabContent = () => {
  return <StaffPermissionsManager />;
};

export default UserRolesSettingsTabContent;
