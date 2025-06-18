# Development Scripts

This directory contains development and testing scripts for the Momentum gym management application.

## 🔒 Security Notice

**These scripts are for development and testing purposes only. Never use production credentials or deploy these scripts to production environments.**

## 📋 Prerequisites

1. **Environment Variables**: Copy `.env.example` to `.env` and fill in your values
2. **Test User**: Create a dedicated test user in your Supabase auth (not a production user)
3. **Node.js**: Ensure you have Node.js installed

## 📁 Available Scripts

### `fetchWithAccessToken.js`

Demonstrates how to authenticate with Supabase and fetch data using access tokens.

**Purpose:**
- Test authentication flow
- Demonstrate token-based API requests
- Validate Supabase configuration

**Usage:**
```bash
# Set environment variables first
export TEST_EMAIL="your-test-user@example.com"
export TEST_PASSWORD="your-test-password"

# Run the script
node src/scripts/dev/fetchWithAccessToken.js
```

**What it does:**
1. Authenticates with provided credentials
2. Fetches profile data using the access token
3. Displays results and handles errors

### `serverAuth.js`

Demonstrates server-side authentication patterns including token management and automatic refresh.

**Purpose:**
- Show token storage and management
- Demonstrate automatic token refresh
- Test long-running authentication sessions

**Usage:**
```bash
# Set environment variables first
export TEST_EMAIL="your-test-user@example.com"
export TEST_PASSWORD="your-test-password"

# Run the script
node src/scripts/dev/serverAuth.js
```

**What it does:**
1. Logs in and stores tokens in memory
2. Sets up automatic token refresh
3. Tests authenticated API requests
4. Demonstrates token lifecycle management

## 🔧 Environment Variables

Required environment variables (set in `.env` file):

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Test Credentials (development only)
TEST_EMAIL=test@example.com
TEST_PASSWORD=SecureTestPassword123!
```

## 🛡️ Security Best Practices

### ✅ Do:
- Use dedicated test accounts for development
- Set environment variables instead of hardcoding credentials
- Keep test credentials separate from production
- Regularly rotate test credentials
- Use strong passwords even for test accounts

### ❌ Don't:
- Use production user credentials in development scripts
- Commit credentials to version control
- Share test credentials publicly
- Use weak or default passwords
- Deploy development scripts to production

## 🚀 Getting Started

1. **Setup Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Create Test User:**
   - Go to your Supabase dashboard
   - Navigate to Authentication > Users
   - Create a new user for testing
   - Use these credentials in your .env file

3. **Run Scripts:**
   ```bash
   # Test basic authentication
   node src/scripts/dev/fetchWithAccessToken.js
   
   # Test token management
   node src/scripts/dev/serverAuth.js
   ```

## 🔍 Troubleshooting

### Common Issues:

**"Missing required environment variables"**
- Ensure your `.env` file exists and contains all required variables
- Check that variable names match exactly

**"Login failed: Invalid login credentials"**
- Verify your test user exists in Supabase auth
- Check that email and password are correct
- Ensure the user's email is confirmed

**"Error fetching data"**
- Check your Supabase RLS policies
- Verify the test user has appropriate permissions
- Ensure your Supabase URL and anon key are correct

### Debug Mode:

To see more detailed output, you can modify the scripts to include additional logging or use Node.js debugging:

```bash
# Run with Node.js debugging
node --inspect src/scripts/dev/fetchWithAccessToken.js
```

## 📚 Related Documentation

- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Environment Variables in Node.js](https://nodejs.org/api/process.html#process_process_env)

## 🤝 Contributing

When adding new development scripts:

1. Follow the same security patterns (environment variables, no hardcoded credentials)
2. Include proper error handling and user-friendly output
3. Document the script's purpose and usage
4. Add appropriate JSDoc comments
5. Test with various scenarios (success, failure, edge cases)

---

**Remember: These scripts are development tools. Never use them in production or with production credentials.**
