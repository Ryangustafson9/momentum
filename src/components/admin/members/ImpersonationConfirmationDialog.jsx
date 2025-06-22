
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle } from 'lucide-react';

const ImpersonationConfirmationDialog = ({ isOpen, onOpenChange, memberName, onConfirm }) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <Eye className="mr-2 h-5 w-5 text-orange-500" />
            Confirm Impersonation
          </AlertDialogTitle>
          <AlertDialogDescription className="py-4">
            Are you sure you want to impersonate <strong>{memberName || 'this member'}</strong>? 
            You will have access to their dashboard and settings as if you were them. 
            This action will be logged.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={onConfirm}>
              <Eye className="mr-2 h-4 w-4" /> Confirm Impersonation
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ImpersonationConfirmationDialog;



