import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Database, Loader2 } from 'lucide-react';
import { logger } from '@/utils/logger';

const TestDataButton = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createTestMemberships = async () => {
    setIsCreating(true);
    try {
      logger.info('🔄 Creating test memberships for Greg and Lauren...');

      // First, get or create a basic membership type
      let { data: membershipTypes, error: typesError } = await supabase
        .from('membership_types')
        .select('*')
        .eq('name', 'Basic Membership')
        .limit(1);

      if (typesError) {
        throw new Error(`Error fetching membership types: ${typesError.message}`);
      }

      let membershipTypeId;
      if (!membershipTypes || membershipTypes.length === 0) {
        // Create a basic membership type
        const { data: newType, error: createTypeError } = await supabase
          .from('membership_types')
          .insert({
            name: 'Basic Membership',
            price: 49.99,
            billing_type: 'Monthly',
            category: 'Membership',
            available_for_sale: true,
            available_online: true,
            features: ['Gym Access', 'Basic Classes']
          })
          .select()
          .single();

        if (createTypeError) {
          throw new Error(`Error creating membership type: ${createTypeError.message}`);
        }
        membershipTypeId = newType.id;
        logger.info('✅ Created Basic Membership type:', membershipTypeId);
      } else {
        membershipTypeId = membershipTypes[0].id;
        logger.info('✅ Using existing Basic Membership type:', membershipTypeId);
      }

      // Get user IDs from profiles table (they should exist from auth)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('email', ['greg@test.com', 'lauren@test.com']);

      if (profilesError) {
        throw new Error(`Error fetching profiles: ${profilesError.message}`);
      }

      if (!profiles || profiles.length === 0) {
        throw new Error('Greg and Lauren profiles not found. Please ensure they are logged in first.');
      }

      logger.info('✅ Found profiles:', profiles);

      // Create memberships for each profile
      const membershipsToCreate = profiles.map(profile => ({
        auth_user_id: profile.id,
        user_id: profile.id,
        current_membership_type_id: membershipTypeId,
        status: 'active',
        join_date: profile.email === 'greg@test.com' ? '2024-01-15' : '2024-02-01',
        next_payment_date: profile.email === 'greg@test.com' ? '2024-07-15' : '2024-07-01',
        monthly_fee: 49.99
      }));

      let created = 0;
      let existing = 0;

      // Check if memberships already exist and create if needed
      for (const membership of membershipsToCreate) {
        const { data: existingMembership, error: checkError } = await supabase
          .from('memberships')
          .select('id')
          .eq('auth_user_id', membership.auth_user_id)
          .limit(1);

        if (checkError) {
          console.error('Error checking existing membership:', checkError);
          continue;
        }

        if (existingMembership && existingMembership.length > 0) {
          logger.info(`✅ Membership already exists for user ${membership.auth_user_id}`);
          existing++;
          continue;
        }

        // Create the membership
        const { data: newMembership, error: createError } = await supabase
          .from('memberships')
          .insert(membership)
          .select()
          .single();

        if (createError) {
          console.error('Error creating membership:', createError);
          continue;
        }

        logger.info(`✅ Created membership for user ${membership.auth_user_id}:`, newMembership.id);
        created++;
      }

      // Update profiles to ensure they have the correct role and names
      for (const profile of profiles) {
        const isGreg = profile.email === 'greg@test.com';
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: isGreg ? 'Greg' : 'Lauren',
            last_name: 'Test',
            role: 'member'
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        } else {
          logger.info(`✅ Updated profile for ${profile.email}`);
        }
      }

      toast({
        title: 'Success',
        description: `Test memberships created! ${created} new, ${existing} existing.`,
      });

      logger.info('🎉 Test memberships created successfully!');

    } catch (error) {
      console.error('❌ Error creating test memberships:', error);
      toast({
        title: 'Error',
        description: `Failed to create test memberships: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={createTestMemberships}
      disabled={isCreating}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {isCreating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Database className="h-4 w-4" />
      )}
      {isCreating ? 'Creating...' : 'Create Test Data'}
    </Button>
  );
};

export default TestDataButton;
