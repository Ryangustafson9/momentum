import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

const DeleteMemberDialog = ({ 
  isOpen, 
  onClose, 
  member, 
  memberName,
  onConfirm, 
  isLoading = false 
}) => {
  const handleConfirm = () => {
    if (member && onConfirm) {
      onConfirm(member.id);
    } else if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Member
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this member? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        {(member || memberName) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <div className="text-sm">
              <p className="font-medium text-red-800">
                {member ? `${member.first_name} ${member.last_name}` : memberName}
              </p>
              {member?.email && (
                <p className="text-red-600">{member.email}</p>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onClose(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Member'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMemberDialog;
