# 🌐 Remote Supabase Setup Guide

## 📋 **Overview**

This guide walks you through connecting your Momentum Gym application to a remote Supabase database to resolve local schema issues.

## ✅ **What's Already Done**

1. ✅ **Environment Configuration Updated** - `.env.local` now points to remote Supabase
2. ✅ **Remote Database Setup Script Created** - `sql/remote_database_setup.sql`
3. ✅ **Connection Test Script Created** - `scripts/test_remote_connection.js`

## 🔧 **Step 1: Test Remote Connection**

First, verify the connection to your remote Supabase instance:

```bash
node scripts/test_remote_connection.js
```

**Expected Output:**
```
🔍 Testing Remote Supabase Connection...
✅ Successfully connected to remote database
✅ Auth system accessible
🎉 Remote connection test completed!
```

## 🗄️ **Step 2: Set Up Remote Database Schema**

### **Option A: Using Supabase Studio (Recommended)**

1. **Open Supabase Studio**: https://supabase.com/dashboard/project/emmnxjcanerhihrlqjwp
2. **Go to SQL Editor**
3. **Copy the entire content** of `sql/remote_database_setup.sql`
4. **Paste and run** the script
5. **Verify success** by checking the output messages

### **Option B: Using Supabase CLI**

```bash
# Link to your remote project
supabase link --project-ref emmnxjcanerhihrlqjwp

# Run the setup script
supabase db reset --db-url "your-remote-db-url"
```

## 🔐 **Step 3: Verify Admin User Creation**

After running the setup script, you should see:

```
SUCCESS: Admin user created
Email: admin@momentum.com
Password: SecureAdminPassword123!
```

## 🧪 **Step 4: Test Application Login**

1. **Start your application**:
   ```bash
   npm run dev
   ```

2. **Navigate to login**: http://localhost:3000/login

3. **Use admin credentials**:
   - **Email**: `admin@momentum.com`
   - **Password**: `SecureAdminPassword123!`

4. **Verify successful login** and redirect to admin dashboard

## 📊 **Step 5: Verify Database Setup**

Check that all tables and data were created correctly:

### **In Supabase Studio:**

1. **Go to Table Editor**
2. **Verify these tables exist**:
   - ✅ `profiles` (with admin user)
   - ✅ `membership_types` (with 3 types)
   - ✅ `memberships` (with admin membership)

3. **Check Row Level Security**:
   - ✅ All tables should have RLS enabled
   - ✅ Policies should be created

## 🔍 **Troubleshooting**

### **Connection Issues**

If the connection test fails:

1. **Check environment variables**:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Verify project is active**:
   - Check Supabase dashboard
   - Ensure project status is "ACTIVE_HEALTHY"

3. **Test with curl**:
   ```bash
   curl -H "apikey: YOUR_ANON_KEY" https://emmnxjcanerhihrlqjwp.supabase.co/rest/v1/
   ```

### **Schema Setup Issues**

If the database setup fails:

1. **Check permissions** in Supabase Studio
2. **Verify you have admin access** to the project
3. **Run setup script in smaller chunks** if needed

### **Login Issues**

If admin login still fails:

1. **Check browser console** for errors
2. **Verify network requests** go to remote URL
3. **Check auth user exists** in Supabase Studio

## 🔒 **Security Considerations**

### **Immediate Actions**

1. ✅ **Change default password** after first login
2. ✅ **Review RLS policies** for your use case
3. ✅ **Set up proper backup** strategy
4. ✅ **Configure monitoring** and alerts

### **Production Checklist**

- ✅ **Strong passwords** enforced
- ✅ **API keys** properly secured
- ✅ **Database backups** configured
- ✅ **Monitoring** set up
- ✅ **Rate limiting** configured

## 🎯 **Benefits of Remote Database**

### **Resolved Issues**
- ✅ **No more local schema errors**
- ✅ **Consistent database state**
- ✅ **Proper auth function support**
- ✅ **Reliable RLS policies**

### **Additional Benefits**
- ✅ **Automatic backups**
- ✅ **Better performance**
- ✅ **Real-time features**
- ✅ **Production-ready infrastructure**

## 📞 **Support**

If you encounter issues:

1. **Check Supabase Status**: https://status.supabase.com/
2. **Review logs** in Supabase Dashboard
3. **Test connection** with the provided script
4. **Verify environment** configuration

## 🎉 **Success Criteria**

The remote setup is complete when:

- ✅ **Connection test passes**
- ✅ **Database schema is created**
- ✅ **Admin user can login**
- ✅ **Application works without errors**
- ✅ **All features function correctly**

---

## 🚀 **Ready for Production!**

Once the remote connection is established and tested, your application will be running on a robust, production-ready Supabase infrastructure without the local schema issues that were causing authentication problems.
