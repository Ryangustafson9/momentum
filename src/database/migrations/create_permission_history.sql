-- ==================== PERMISSION HISTORY TABLE ====================
-- Track changes to staff role permissions over time

CREATE TABLE IF NOT EXISTS permission_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL,
  role_name TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'template_applied', 'bulk_update', 'bulk_add', 'bulk_remove', 'copy_permissions', 'revert')),
  old_permissions JSONB DEFAULT '{}',
  new_permissions JSONB DEFAULT '{}',
  changes_summary TEXT,
  template_applied TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT fk_permission_history_role FOREIGN KEY (role_id) REFERENCES staff_roles(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_permission_history_role_id ON permission_history(role_id);
CREATE INDEX IF NOT EXISTS idx_permission_history_changed_by ON permission_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_permission_history_change_type ON permission_history(change_type);
CREATE INDEX IF NOT EXISTS idx_permission_history_created_at ON permission_history(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE permission_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin and staff can view permission history" ON permission_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.auth_user_id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can insert permission history" ON permission_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.auth_user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- No update or delete policies - history should be immutable

-- ==================== HELPER FUNCTIONS ====================

-- Function to automatically log permission changes
CREATE OR REPLACE FUNCTION log_staff_role_permission_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if permissions actually changed
  IF (TG_OP = 'UPDATE' AND OLD.permissions IS DISTINCT FROM NEW.permissions) THEN
    INSERT INTO permission_history (
      role_id,
      role_name,
      changed_by,
      change_type,
      old_permissions,
      new_permissions,
      changes_summary
    ) VALUES (
      NEW.id,
      NEW.name,
      auth.uid(),
      'update',
      COALESCE(OLD.permissions, '{}'::jsonb),
      COALESCE(NEW.permissions, '{}'::jsonb),
      'Permissions updated'
    );
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO permission_history (
      role_id,
      role_name,
      changed_by,
      change_type,
      old_permissions,
      new_permissions,
      changes_summary
    ) VALUES (
      NEW.id,
      NEW.name,
      auth.uid(),
      'create',
      '{}'::jsonb,
      COALESCE(NEW.permissions, '{}'::jsonb),
      'Role created'
    );
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO permission_history (
      role_id,
      role_name,
      changed_by,
      change_type,
      old_permissions,
      new_permissions,
      changes_summary
    ) VALUES (
      OLD.id,
      OLD.name,
      auth.uid(),
      'delete',
      COALESCE(OLD.permissions, '{}'::jsonb),
      '{}'::jsonb,
      'Role deleted'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log changes
DROP TRIGGER IF EXISTS staff_role_permission_change_trigger ON staff_roles;
CREATE TRIGGER staff_role_permission_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON staff_roles
  FOR EACH ROW
  EXECUTE FUNCTION log_staff_role_permission_change();

-- ==================== CLEANUP FUNCTION ====================

-- Function to clean up old permission history
CREATE OR REPLACE FUNCTION cleanup_permission_history(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM permission_history 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== COMMENTS ====================

COMMENT ON TABLE permission_history IS 'Tracks changes to staff role permissions over time';
COMMENT ON COLUMN permission_history.role_id IS 'ID of the staff role that was changed';
COMMENT ON COLUMN permission_history.role_name IS 'Name of the role at time of change';
COMMENT ON COLUMN permission_history.changed_by IS 'User who made the change';
COMMENT ON COLUMN permission_history.change_type IS 'Type of change made';
COMMENT ON COLUMN permission_history.old_permissions IS 'Permissions before the change';
COMMENT ON COLUMN permission_history.new_permissions IS 'Permissions after the change';
COMMENT ON COLUMN permission_history.changes_summary IS 'Human-readable summary of changes';
COMMENT ON COLUMN permission_history.template_applied IS 'Template key if a template was applied';

-- Grant necessary permissions
GRANT SELECT ON permission_history TO authenticated;
GRANT INSERT ON permission_history TO authenticated;
