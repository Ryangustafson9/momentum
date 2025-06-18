# 🔧 Admin Setup Guide - Production Ready

## 📋 **Overview**

This guide provides multiple methods to create the first admin user in a clean production database.

## 🚀 **Method 1: SQL Script (Recommended)**

### **Step 1: Run the Admin Setup Script**
1. **Open Supabase Studio**: http://localhost:54323
2. **Go to SQL Editor**
3. **Copy and paste** the following script:

```sql
-- PRODUCTION ADMIN SETUP SCRIPT
DO $create_first_admin$
DECLARE
    admin_user_id UUID;
    admin_email TEXT := 'admin@momentum.com';
    admin_password TEXT := 'SecureAdminPassword123!';
BEGIN
    -- Check if admin already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
        RAISE NOTICE 'Admin user already exists. Skipping creation.';
        RETURN;
    END IF;
    
    admin_user_id := gen_random_uuid();
    
    -- Create auth user
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
        role, aud
    ) VALUES (
        admin_user_id, '00000000-0000-0000-0000-000000000000',
        admin_email, crypt(admin_password, gen_salt('bf')), NOW(),
        NOW(), NOW(), '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "System", "last_name": "Administrator"}',
        'authenticated', 'authenticated'
    );
    
    -- Create identity
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), admin_user_id,
        jsonb_build_object('sub', admin_user_id::text, 'email', admin_email, 'email_verified', true),
        'email', admin_user_id::text, NOW(), NOW(), NOW()
    );
    
    -- Create profile
    INSERT INTO public.profiles (id, name, first_name, last_name, email, role, created_at)
    VALUES (admin_user_id, 'System Administrator', 'System', 'Administrator', admin_email, 'admin', NOW());
    
    RAISE NOTICE 'SUCCESS: Admin user created - Email: %, Password: %', admin_email, admin_password;
END $create_first_admin$;
```

4. **Click "Run"**
5. **Note the credentials** from the success message

### **Step 2: Test Admin Login**
- **Email**: `admin@momentum.com`
- **Password**: `SecureAdminPassword123!`

## 🔧 **Method 2: Application Signup (Alternative)**

### **Modify Signup to Create First Admin**
If you prefer to use the application interface:

1. **Temporarily modify** `src/contexts/AuthContext.jsx`
2. **Add first-user detection**:

```javascript
// In signup function, after profile creation
const isFirstUser = await checkIfFirstUser();
if (isFirstUser) {
  // Update profile to admin role
  await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', data.user.id);
}
```

3. **Sign up normally** through the app
4. **Remove the modification** after first admin is created

## 🛡️ **Method 3: Environment-Based Setup**

### **Create Setup Route**
Add a one-time setup route that only works when no admin exists:

```javascript
// pages/setup.js
export default function Setup() {
  const [isFirstSetup, setIsFirstSetup] = useState(false);
  
  useEffect(() => {
    checkIfFirstSetup().then(setIsFirstSetup);
  }, []);
  
  if (!isFirstSetup) {
    return <div>Setup not available - Admin already exists</div>;
  }
  
  return <AdminSetupForm />;
}
```

## 📊 **Verification Steps**

After creating the admin user, verify the setup:

### **1. Database Verification**
```sql
-- Check admin user exists
SELECT u.email, p.role, p.first_name, p.last_name
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@momentum.com';
```

### **2. Login Test**
1. **Go to login page**: http://localhost:3000/login
2. **Enter credentials**:
   - Email: `admin@momentum.com`
   - Password: `SecureAdminPassword123!`
3. **Verify redirect** to staff dashboard

### **3. Admin Features Test**
- ✅ Access to staff dashboard
- ✅ Member management features
- ✅ Admin-only navigation items
- ✅ Proper role-based permissions

## 🔒 **Security Checklist**

### **Immediate Actions After Setup**
1. ✅ **Change default password** immediately
2. ✅ **Remove setup scripts** from production
3. ✅ **Verify no test data** remains in database
4. ✅ **Check RLS policies** are properly configured
5. ✅ **Test role-based access** controls

### **Production Security**
- ✅ **Strong password policy** enforced
- ✅ **2FA enabled** (if implemented)
- ✅ **Admin actions logged** (if implemented)
- ✅ **Regular security audits** scheduled

## 🎯 **Troubleshooting**

### **Common Issues**

#### **"Admin already exists" message**
- Check if there's already an admin user in the database
- Use verification query to confirm

#### **Login fails after creation**
- Verify password was set correctly
- Check email_confirmed_at is set
- Ensure identity record was created

#### **No admin permissions**
- Verify profile.role = 'admin'
- Check role-based access control logic
- Ensure proper session handling

### **Reset Admin User**
If you need to recreate the admin user:

```sql
-- Remove existing admin
DELETE FROM public.profiles WHERE email = 'admin@momentum.com';
DELETE FROM auth.identities WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'admin@momentum.com'
);
DELETE FROM auth.users WHERE email = 'admin@momentum.com';

-- Then run the creation script again
```

## ✅ **Success Criteria**

The admin setup is complete when:
- ✅ Admin user exists in auth.users
- ✅ Admin profile exists with role='admin'
- ✅ Admin can login successfully
- ✅ Admin has access to staff dashboard
- ✅ Admin can manage members and settings
- ✅ No test artifacts remain in database

## 📞 **Support**

If you encounter issues:
1. **Check the verification queries** above
2. **Review console errors** in browser
3. **Verify database schema** matches expectations
4. **Test with a fresh database** if needed

---

## 🎉 **Production Ready!**

Once the admin user is created and verified, your Momentum Gym application is ready for production use with a clean, secure admin setup.
