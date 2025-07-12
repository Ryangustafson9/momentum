# Membership Tables Merge Guide

## Overview
This guide walks you through merging the `membership_addons` table with the `memberships` table by adding a `plan_type` column to distinguish between different types of memberships.

## Plan Types
After the merge, the unified `memberships` table will support these plan types:
- **Membership**: Primary gym memberships
- **Add-On**: Additional services and features
- **Staff**: Employee memberships and access
- **Guest**: Temporary/visitor access

## Pre-Migration Checklist

### 1. Backup Your Data
```sql
-- Create manual backups (optional - migration script creates these automatically)
CREATE TABLE memberships_manual_backup AS SELECT * FROM memberships;
CREATE TABLE membership_addons_manual_backup AS SELECT * FROM membership_addons;
CREATE TABLE addon_memberships_manual_backup AS SELECT * FROM addon_memberships;
```

### 2. Check Current Data
Run the pre-migration check:
```sql
-- Execute run_membership_merge.sql to see current state
\i run_membership_merge.sql
```

### 3. Review Application Dependencies
The following files have been updated to work with the unified table:
- `src/services/memberService.js` - Updated queries
- `src/hooks/useBilling.js` - Updated billing logic
- `src/hooks/useMembers.js` - Added new hooks
- `src/services/unifiedMembershipService.js` - New service for unified operations

## Migration Steps

### Step 1: Run Pre-Migration Check
```bash
# In Supabase SQL Editor, run:
\i run_membership_merge.sql
```

### Step 2: Execute Migration
```bash
# In Supabase SQL Editor, run:
\i merge_memberships_tables.sql
```

### Step 3: Verify Migration
The migration script includes verification steps that will show:
- Total records migrated
- Breakdown by plan type
- Sample data verification

### Step 4: Update Application Code
The application code has been updated to use the new unified structure. Key changes:

#### New Service Methods
```javascript
// Use the new unified service
import { unifiedMembershipService } from '@/services/unifiedMembershipService';

// Get all memberships for a member
const { data: memberships } = await unifiedMembershipService.getMemberMemberships(memberId);

// Get only primary membership
const { data: primary } = await unifiedMembershipService.getPrimaryMembership(memberId);

// Get only add-ons
const { data: addons } = await unifiedMembershipService.getMemberAddons(memberId);
```

#### Updated Hooks
```javascript
// Get all membership types for a member
const { data: allMemberships } = useAllMemberMemberships(memberId);

// Existing hooks still work but now query the unified table
const { data: addons } = useMemberAddons(memberId);
```

## Database Schema Changes

### New Unified Memberships Table Structure
```sql
CREATE TABLE memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    location_id UUID,
    membership_plan_id UUID,
    
    -- New plan_type column
    plan_type VARCHAR(20) NOT NULL DEFAULT 'Membership' 
        CHECK (plan_type IN ('Membership', 'Add-On', 'Staff', 'Guest')),
    
    -- Status and dates
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE,
    cancelled_date TIMESTAMP WITH TIME ZONE,
    suspended_date TIMESTAMP WITH TIME ZONE,
    
    -- Pricing
    monthly_rate DECIMAL(10,2) DEFAULT 0.00,
    setup_fee DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_type VARCHAR(20) DEFAULT 'none',
    
    -- Contract and billing
    contract_length_months INTEGER DEFAULT 0,
    billing_frequency VARCHAR(20) DEFAULT 'monthly',
    auto_renew BOOLEAN DEFAULT true,
    
    -- Capacity and dependents
    capacity_type VARCHAR(20) DEFAULT 'individual',
    max_dependents INTEGER DEFAULT 0,
    current_dependents INTEGER DEFAULT 0,
    
    -- Additional features
    freeze_holds_remaining INTEGER DEFAULT 0,
    guest_passes_remaining INTEGER DEFAULT 0,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);
```

### Indexes Created
- `idx_memberships_member_id` - For member lookups
- `idx_memberships_organization_id` - For organization filtering
- `idx_memberships_plan_type` - For plan type filtering
- `idx_memberships_status` - For status filtering
- `idx_memberships_start_date` - For date range queries
- `idx_memberships_next_billing_date` - For billing operations

## Post-Migration Tasks

### 1. Test Application Functionality
- [ ] Member profile pages load correctly
- [ ] Billing information displays properly
- [ ] Add-on management works
- [ ] Membership assignment functions
- [ ] Reports and analytics work

### 2. Update Any Custom Queries
If you have custom SQL queries or reports that reference the old tables, update them to use the new structure:

```sql
-- Old query
SELECT * FROM membership_addons WHERE member_id = ?;

-- New query
SELECT * FROM memberships WHERE member_id = ? AND plan_type = 'Add-On';
```

### 3. Clean Up (Optional)
After verifying everything works correctly, you can remove the backup tables:
```sql
-- Only run after thorough testing
DROP TABLE IF EXISTS membership_addons_backup;
DROP TABLE IF EXISTS addon_memberships_backup;
DROP TABLE IF EXISTS memberships_backup;
```

## Rollback Plan

If you need to rollback the migration:

1. **Stop the application** to prevent data corruption
2. **Restore from backups**:
   ```sql
   -- Restore original tables
   DROP TABLE IF EXISTS memberships;
   CREATE TABLE memberships AS SELECT * FROM memberships_backup;
   
   -- Restore addon tables if they existed
   CREATE TABLE membership_addons AS SELECT * FROM membership_addons_backup;
   CREATE TABLE addon_memberships AS SELECT * FROM addon_memberships_backup;
   ```
3. **Revert application code** to use the old service methods
4. **Restart application**

## Benefits of the Unified Structure

1. **Simplified Data Model**: One table for all membership types
2. **Better Performance**: Fewer joins required for member data
3. **Easier Maintenance**: Single source of truth for memberships
4. **Flexible Plan Types**: Easy to add new membership categories
5. **Consistent Billing**: Unified billing logic across all plan types
6. **Better Reporting**: Easier to generate comprehensive membership reports

## Support

If you encounter issues during migration:
1. Check the migration logs for error messages
2. Verify all backup tables were created successfully
3. Test with a small subset of data first
4. Contact support if you need assistance with rollback procedures
