
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast.js';
import { Loader2 } from 'lucide-react';

const RoleForm = ({ role, onSave, onCancel, allPermissions, isLoading }) => {
  const [name, setName] = useState(role ? role.name : '');
  const [description, setDescription] = useState(role ? role.description : '');
  const [permissions, setPermissions] = useState(role ? role.permissions || [] : []);
  const { toast } = useToast();

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description);
      setPermissions(role.permissions || []);
    } else {
      setName('');
      setDescription('');
      setPermissions([]);
    }
  }, [role]);

  const handlePermissionChange = (permissionId) => {
    setPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast({ title: "Validation Error", description: "Role name and description are required.", variant: "destructive" });
      return;
    }
    onSave({ ...role, name, description, permissions });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="roleNameFormInput">Role Name (Staff Plan Name)</Label>
        <Input id="roleNameFormInput" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Senior Trainer Plan" disabled={isLoading} />
      </div>
      <div>
        <Label htmlFor="roleDescriptionFormInput">Description</Label>
        <Input id="roleDescriptionFormInput" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe this role/plan" disabled={isLoading} />
      </div>
      <div>
        <Label>Permissions</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border p-3 rounded-md max-h-72 overflow-y-auto bg-slate-50 dark:bg-slate-800">
          {allPermissions.map(perm => (
            <div key={perm.id} className="flex items-center space-x-2 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <Checkbox
                id={`perm-form-${perm.id}`}
                checked={permissions.includes(perm.id)}
                onCheckedChange={() => handlePermissionChange(perm.id)}
                disabled={isLoading}
              />
              <Label htmlFor={`perm-form-${perm.id}`} className="text-sm font-normal cursor-pointer">{perm.label}</Label>
            </div>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (role ? 'Save Changes' : 'Create Role/Plan')}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default RoleForm;



