
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const DeleteMembershipDialog = ({ isOpen, onClose, onConfirm, membershipToDelete }) => {
  if (!membershipToDelete) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card dark:bg-slate-900 shadow-xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-card-foreground dark:text-slate-100">Confirm Deletion</DialogTitle>
          <DialogDescription className="text-muted-foreground dark:text-slate-400">
            Are you sure you want to delete the membership plan "<strong>{membershipToDelete.name}</strong>"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose} className="text-slate-700 dark:text-slate-300">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMembershipDialog;



