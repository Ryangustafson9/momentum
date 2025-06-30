# Phase 1: Core Foundation - Detailed Implementation Plan

## Overview
Phase 1 establishes the critical foundation that all other system components depend on. This phase must be 100% complete before any Phase 2 work begins. Estimated duration: 4 weeks.

---

## 🔐 Component 1.1: Authentication & Security System
**Owner:** Lead Developer  
**Duration:** 1 week  
**Current Status:** 85% complete  
**Priority:** CRITICAL

### Technical Specifications

#### Authentication Methods
```javascript
// Multi-role authentication structure
const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin', 
  MANAGER: 'manager',
  STAFF: 'staff',
  MEMBER: 'member'
};

const PERMISSIONS = {
  // Member Management
  'members.create': ['super_admin', 'admin', 'manager'],
  'members.read': ['super_admin', 'admin', 'manager', 'staff'],
  'members.update': ['super_admin', 'admin', 'manager'],
  'members.delete': ['super_admin', 'admin'],
  
  // Billing Management
  'billing.create': ['super_admin', 'admin', 'manager'],
  'billing.read': ['super_admin', 'admin', 'manager', 'staff'],
  'billing.update': ['super_admin', 'admin', 'manager'],
  'billing.process_payments': ['super_admin', 'admin', 'manager'],
  
  // Staff Management
  'staff.create': ['super_admin', 'admin'],
  'staff.read': ['super_admin', 'admin', 'manager'],
  'staff.update': ['super_admin', 'admin'],
  'staff.delete': ['super_admin'],
  
  // System Configuration
  'system.configure': ['super_admin'],
  'system.backup': ['super_admin', 'admin'],
  'system.logs': ['super_admin', 'admin']
};
```

### Detailed Tasks

#### Task 1.1.1: Multi-Role Authentication
**Estimated:** 1 day
**Status:** ✅ COMPLETE

**Implementation Requirements:**
- [ ] JWT token-based authentication
- [ ] Role-based access control middleware
- [ ] Session management with configurable timeouts
- [ ] Automatic token refresh mechanism
- [ ] Cross-device session handling

**Acceptance Criteria:**
- [ ] Users can log in with email/password
- [ ] Roles are properly assigned and enforced
- [ ] Sessions expire after configured time
- [ ] Token refresh works seamlessly
- [ ] Concurrent sessions are managed properly

#### Task 1.1.2: Password Security
**Estimated:** 1 day
**Status:** 🔄 IN PROGRESS

**Implementation Requirements:**
```javascript
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfoInPassword: true
};

const SECURITY_POLICIES = {
  maxLoginAttempts: 5,
  lockoutDuration: 15, // minutes
  passwordHistoryCount: 5,
  passwordExpiration: 90, // days
  forcePasswordChangeOnFirstLogin: true
};
```

**Files to Create/Update:**
- `src/utils/passwordValidation.js`
- `src/hooks/usePasswordSecurity.js`
- `src/components/auth/PasswordStrengthIndicator.jsx`
- `src/services/authSecurityService.js`

**Acceptance Criteria:**
- [ ] Password complexity validation on frontend and backend
- [ ] Real-time password strength indicator
- [ ] Account lockout after failed attempts
- [ ] Password history tracking (prevent reuse)
- [ ] Forced password change for new accounts

#### Task 1.1.3: Two-Factor Authentication (2FA)
**Estimated:** 2 days
**Status:** ❌ NOT STARTED

**Implementation Requirements:**
```javascript
const TFA_METHODS = {
  SMS: 'sms',
  EMAIL: 'email',
  AUTHENTICATOR_APP: 'app'
};

const TFA_CONFIG = {
  tokenLength: 6,
  tokenExpiration: 300, // 5 minutes
  maxVerificationAttempts: 3,
  backupCodeCount: 10,
  qrCodeDimensions: 200
};
```

**Files to Create:**
- `src/components/auth/TwoFactorSetup.jsx`
- `src/components/auth/TwoFactorVerification.jsx`
- `src/services/twoFactorService.js`
- `src/utils/qrCodeGenerator.js`

**Third-party Integrations:**
- **SMS Provider:** Twilio or AWS SNS
- **Authenticator:** Support for Google Authenticator, Authy
- **QR Code:** qrcode.js library

**Acceptance Criteria:**
- [ ] Users can enable/disable 2FA
- [ ] Support for SMS, email, and authenticator apps
- [ ] QR code generation for app setup
- [ ] Backup codes for account recovery
- [ ] Admin can enforce 2FA for roles

#### Task 1.1.4: Security Audit Logging
**Estimated:** 1 day
**Status:** ❌ NOT STARTED

**Implementation Requirements:**
```javascript
const AUDIT_EVENTS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  ROLE_CHANGE: 'role_change',
  PERMISSION_DENIED: 'permission_denied',
  DATA_ACCESS: 'data_access',
  DATA_MODIFICATION: 'data_modification',
  SYSTEM_CONFIG_CHANGE: 'system_config_change'
};

const auditLog = {
  event: 'login_success',
  userId: 'user123',
  timestamp: new Date().toISOString(),
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  sessionId: 'session123',
  additionalData: {}
};
```

**Files to Create:**
- `src/services/auditLogService.js`
- `src/middleware/auditLogMiddleware.js`
- `src/components/admin/AuditLogViewer.jsx`

**Database Schema:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  additional_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Acceptance Criteria:**
- [ ] All authentication events are logged
- [ ] Data modifications are tracked
- [ ] Admin can view and filter audit logs
- [ ] Logs include IP, user agent, and session info
- [ ] Automated alerts for suspicious activity

### Security Testing Requirements
- [ ] **Penetration Testing:** External security audit
- [ ] **Vulnerability Scanning:** OWASP ZAP automated scans
- [ ] **Code Security Review:** Static analysis with SonarQube
- [ ] **Session Security:** Test session hijacking protection
- [ ] **Brute Force Protection:** Verify lockout mechanisms

---

## 💾 Component 1.2: Database Schema & Migrations
**Owner:** Database Administrator + Lead Developer  
**Duration:** 1 week  
**Current Status:** 75% complete  
**Priority:** CRITICAL

### Database Architecture

#### Core Tables Structure
```sql
-- Users and Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ DEFAULT NOW(),
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  backup_codes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member Profiles (extends users)
CREATE TABLE member_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  member_number VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  preferred_name VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(20),
  phone VARCHAR(20),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  profile_image_url TEXT,
  membership_start_date DATE,
  membership_status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Addresses (polymorphic - can belong to members, staff, etc.)
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addressable_type VARCHAR(50) NOT NULL, -- 'member_profile', 'staff_profile'
  addressable_id UUID NOT NULL,
  address_type VARCHAR(50) DEFAULT 'primary', -- 'primary', 'billing', 'emergency'
  street_line_1 VARCHAR(255) NOT NULL,
  street_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'United States',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Detailed Tasks

#### Task 1.2.1: Complete Member Schema
**Estimated:** 1 day
**Status:** 🔄 IN PROGRESS

**Files to Create:**
- `supabase/migrations/002_complete_member_profiles.sql`
- `supabase/migrations/003_member_addresses.sql`
- `supabase/migrations/004_member_custom_fields.sql`

**Schema Requirements:**
```sql
-- Custom Fields Support
CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- 'member', 'staff'
  field_name VARCHAR(100) NOT NULL,
  field_label VARCHAR(200) NOT NULL,
  field_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'date', 'boolean', 'select'
  field_options JSONB, -- for select fields
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member-specific custom field values
CREATE TABLE member_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES member_profiles(id) ON DELETE CASCADE,
  field_definition_id UUID REFERENCES custom_field_definitions(id),
  field_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, field_definition_id)
);
```

**Acceptance Criteria:**
- [ ] All member data fields are properly typed
- [ ] Custom fields system is flexible and extensible
- [ ] Address system supports multiple addresses per member
- [ ] Data validation constraints are in place
- [ ] Indexes are optimized for common queries

#### Task 1.2.2: Membership & Billing Schema
**Estimated:** 2 days
**Status:** ❌ NOT STARTED

**Schema Requirements:**
```sql
-- Membership Types and Plans
CREATE TABLE membership_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  billing_frequency VARCHAR(50) NOT NULL, -- 'monthly', 'quarterly', 'annual'
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member Memberships (history of all memberships)
CREATE TABLE member_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES member_profiles(id),
  membership_type_id UUID REFERENCES membership_types(id),
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'cancelled', 'expired'
  monthly_price DECIMAL(10,2) NOT NULL,
  billing_frequency VARCHAR(50) NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing and Payments
CREATE TABLE billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES member_profiles(id),
  payment_method_type VARCHAR(50), -- 'credit_card', 'bank_transfer', 'cash'
  payment_method_details JSONB, -- encrypted payment info
  billing_address_id UUID REFERENCES addresses(id),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  member_id UUID REFERENCES member_profiles(id),
  membership_id UUID REFERENCES member_memberships(id),
  billing_account_id UUID REFERENCES billing_accounts(id),
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
  description TEXT,
  line_items JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  payment_method_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_id VARCHAR(255),
  processor_response JSONB,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Acceptance Criteria:**
- [ ] Flexible membership plan structure
- [ ] Complete billing and payment tracking
- [ ] Support for different payment methods
- [ ] Invoice generation and management
- [ ] Payment history and reconciliation

#### Task 1.2.3: Staff & Permissions Schema
**Estimated:** 1 day
**Status:** ❌ NOT STARTED

**Schema Requirements:**
```sql
-- Staff Profiles
CREATE TABLE staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  position VARCHAR(100),
  department VARCHAR(100),
  hire_date DATE,
  employment_status VARCHAR(50) DEFAULT 'active',
  phone VARCHAR(20),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role Definitions
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Role Assignments
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(user_id, role_id)
);
```

**Acceptance Criteria:**
- [ ] Staff profile management
- [ ] Flexible role and permission system
- [ ] Role assignment tracking
- [ ] System vs custom roles distinction

#### Task 1.2.4: Migration Scripts & Data Validation
**Estimated:** 1 day
**Status:** ❌ NOT STARTED

**Migration Requirements:**
```sql
-- Migration versioning and tracking
CREATE TABLE schema_migrations (
  version VARCHAR(14) PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data validation constraints
ALTER TABLE member_profiles 
  ADD CONSTRAINT valid_email 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE member_profiles 
  ADD CONSTRAINT valid_phone 
  CHECK (phone ~ '^\+?[1-9]\d{1,14}$');

-- Indexes for performance
CREATE INDEX idx_member_profiles_email ON member_profiles(email);
CREATE INDEX idx_member_profiles_member_number ON member_profiles(member_number);
CREATE INDEX idx_member_profiles_status ON member_profiles(membership_status);
CREATE INDEX idx_invoices_member_status ON invoices(member_id, status);
CREATE INDEX idx_payments_status_date ON payments(status, processed_at);
```

**Files to Create:**
- `scripts/migrate.js` - Migration runner
- `scripts/rollback.js` - Rollback capability
- `scripts/seed-data.js` - Initial data seeding
- `scripts/validate-schema.js` - Schema validation

**Acceptance Criteria:**
- [ ] All migrations run successfully
- [ ] Rollback capability for each migration
- [ ] Data validation constraints prevent invalid data
- [ ] Performance indexes are optimized
- [ ] Seed data for development and testing

### Database Performance Requirements
- [ ] **Query Performance:** All common queries < 100ms
- [ ] **Index Coverage:** All frequent query patterns indexed
- [ ] **Backup Strategy:** Automated daily backups with point-in-time recovery
- [ ] **Monitoring:** Query performance and slow query logging
- [ ] **Scalability:** Schema design supports 100k+ members

---

## 🔌 Component 1.3: API Service Layer
**Owner:** Backend Developer + Lead Developer  
**Duration:** 1 week  
**Current Status:** 70% complete  
**Priority:** CRITICAL

### API Architecture

#### RESTful API Design
```javascript
// Standard API response format
const APIResponse = {
  success: boolean,
  data: any,
  message: string,
  errors: ValidationError[],
  meta: {
    pagination?: PaginationInfo,
    timestamp: string,
    version: string,
    requestId: string
  }
};

// Error response format
const ErrorResponse = {
  success: false,
  data: null,
  message: string,
  errors: [
    {
      field: string,
      code: string,
      message: string,
      value: any
    }
  ],
  meta: {
    timestamp: string,
    requestId: string
  }
};
```

### Detailed Tasks

#### Task 1.3.1: Standardized Response Format
**Estimated:** 1 day
**Status:** ✅ COMPLETE

**Implementation Requirements:**
- [ ] Consistent JSON response structure
- [ ] Error handling with proper HTTP status codes
- [ ] Request/response logging
- [ ] Response time tracking
- [ ] Request ID for debugging

#### Task 1.3.2: Authentication Middleware
**Estimated:** 1 day
**Status:** 🔄 IN PROGRESS

**Files to Create:**
- `src/middleware/authMiddleware.js`
- `src/middleware/roleMiddleware.js`
- `src/utils/jwtHelper.js`

**Implementation Requirements:**
```javascript
// JWT Authentication Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: [{ code: 'AUTH_REQUIRED', message: 'No authentication token provided' }]
      });
    }

    const decoded = verifyToken(token);
    const user = await getUserById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication',
        errors: [{ code: 'AUTH_INVALID', message: 'User account not found or inactive' }]
      });
    }

    req.user = user;
    req.sessionId = decoded.sessionId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      errors: [{ code: 'AUTH_FAILED', message: error.message }]
    });
  }
};

// Permission-based access control
const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const hasPermission = await checkUserPermission(req.user.id, permission);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        errors: [{ 
          code: 'PERMISSION_DENIED', 
          message: `Required permission: ${permission}` 
        }]
      });
    }

    next();
  };
};
```

**Acceptance Criteria:**
- [ ] JWT token validation on all protected routes
- [ ] Role-based access control implementation
- [ ] Session management and token refresh
- [ ] Permission checking middleware
- [ ] Proper error responses for auth failures

#### Task 1.3.3: Request Validation & Sanitization
**Estimated:** 1 day
**Status:** ❌ NOT STARTED

**Files to Create:**
- `src/middleware/validationMiddleware.js`
- `src/validators/memberValidators.js`
- `src/validators/billingValidators.js`
- `src/utils/sanitizer.js`

**Implementation Requirements:**
```javascript
// Request validation using Joi or similar
const memberCreateValidator = Joi.object({
  first_name: Joi.string().min(1).max(100).required().trim(),
  last_name: Joi.string().min(1).max(100).required().trim(),
  email: Joi.string().email().required().lowercase(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  date_of_birth: Joi.date().max('now').optional(),
  emergency_contact: Joi.object({
    name: Joi.string().max(200).optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
  }).optional(),
  custom_fields: Joi.object().optional()
});

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove HTML tags and dangerous characters
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  next();
};

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        code: 'VALIDATION_ERROR',
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    req.body = value;
    next();
  };
};
```

**Acceptance Criteria:**
- [ ] Input validation for all API endpoints
- [ ] HTML and script tag sanitization
- [ ] SQL injection prevention
- [ ] XSS attack prevention
- [ ] File upload validation and sanitization

#### Task 1.3.4: Rate Limiting & Throttling
**Estimated:** 1 day
**Status:** ❌ NOT STARTED

**Files to Create:**
- `src/middleware/rateLimitMiddleware.js`
- `src/utils/rateLimiter.js`
- `src/config/rateLimits.js`

**Implementation Requirements:**
```javascript
// Rate limiting configuration
const RATE_LIMITS = {
  authentication: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    skipSuccessfulRequests: true
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    skipSuccessfulRequests: false
  },
  fileUpload: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 file uploads per minute
    skipSuccessfulRequests: false
  }
};

// Redis-based rate limiter for distributed systems
const createRateLimiter = (config) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient
    }),
    ...config,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests',
        errors: [{
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Please try again later.'
        }]
      });
    }
  });
};
```

**Acceptance Criteria:**
- [ ] Different rate limits for different endpoint types
- [ ] IP-based and user-based rate limiting
- [ ] Redis-backed rate limiting for scalability
- [ ] Proper HTTP 429 responses
- [ ] Rate limit headers in responses

#### Task 1.3.5: API Documentation & Testing
**Estimated:** 1 day
**Status:** ❌ NOT STARTED

**Files to Create:**
- `docs/api/swagger.yaml`
- `src/routes/docs.js`
- `tests/api/auth.test.js`
- `tests/api/members.test.js`

**Documentation Requirements:**
```yaml
# Swagger/OpenAPI specification
openapi: 3.0.0
info:
  title: Momentum Gym Management API
  version: 1.0.0
  description: Complete API for gym management system
  
paths:
  /api/auth/login:
    post:
      summary: User authentication
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
      responses:
        200:
          description: Successful authentication
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        401:
          description: Authentication failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
```

**Testing Requirements:**
```javascript
// API endpoint testing
describe('Authentication API', () => {
  test('POST /api/auth/login - successful login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.email).toBe('test@example.com');
  });

  test('POST /api/auth/login - invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.errors[0].code).toBe('AUTH_FAILED');
  });
});
```

**Acceptance Criteria:**
- [ ] Complete Swagger/OpenAPI documentation
- [ ] Interactive API documentation interface
- [ ] Comprehensive test suite with 90%+ coverage
- [ ] Performance benchmarks for all endpoints
- [ ] Integration tests for critical workflows

### API Performance Requirements
- [ ] **Response Time:** 95% of requests < 200ms
- [ ] **Throughput:** Handle 1000+ concurrent requests
- [ ] **Error Rate:** < 0.1% error rate under normal load
- [ ] **Documentation:** 100% API endpoint documentation
- [ ] **Testing:** 90%+ code coverage with integration tests

---

## 👤 Component 1.4: Member Profile Management
**Owner:** Frontend Developer + Backend Developer  
**Duration:** 1 week  
**Current Status:** 90% complete  
**Priority:** CRITICAL

### Current Implementation Analysis
The member profile system is nearly complete but needs final touches for 100% completion.

### Detailed Tasks

#### Task 1.4.1: Photo Upload & Management
**Estimated:** 1 day
**Status:** 🔄 IN PROGRESS

**Current Issues to Resolve:**
- Photo storage configuration (AWS S3 vs local storage)
- Image compression and optimization
- Upload progress indicators
- Error handling for failed uploads

**Files to Update:**
- `src/pages/staff-portal/MemberProfile.jsx`
- `src/services/photoUploadService.js`
- `src/utils/imageProcessor.js`

**Implementation Requirements:**
```javascript
// Photo upload service
const PhotoUploadService = {
  async uploadPhoto(file, memberId) {
    // Validate file type and size
    if (!this.validatePhotoFile(file)) {
      throw new Error('Invalid file type or size');
    }

    // Compress image if needed
    const compressedFile = await this.compressImage(file);
    
    // Generate unique filename
    const filename = `members/${memberId}/${Date.now()}-${file.name}`;
    
    // Upload to storage (S3 or local)
    const url = await this.uploadToStorage(compressedFile, filename);
    
    // Update member profile with new photo URL
    await this.updateMemberPhoto(memberId, url);
    
    return url;
  },

  validatePhotoFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    return validTypes.includes(file.type) && file.size <= maxSize;
  },

  async compressImage(file) {
    // Use canvas or library like sharp for compression
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Maintain aspect ratio, max 800x800
        const maxSize = 800;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      };
      img.src = URL.createObjectURL(file);
    });
  }
};
```

**Acceptance Criteria:**
- [ ] Support for JPEG, PNG, WebP formats
- [ ] Automatic image compression and resizing
- [ ] Upload progress indicator
- [ ] Error handling for network issues
- [ ] Hover-based upload buttons (already implemented)

#### Task 1.4.2: Emergency Contact Management
**Estimated:** 0.5 days
**Status:** ✅ COMPLETE

**Current Status:** Emergency contact fields are implemented and working properly.

#### Task 1.4.3: Custom Fields Support
**Estimated:** 1 day
**Status:** ❌ NOT STARTED

**Implementation Requirements:**
```javascript
// Custom fields component
const CustomFieldsSection = ({ memberId, customFields, onUpdate }) => {
  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [fieldValues, setFieldValues] = useState({});

  useEffect(() => {
    // Load custom field definitions for members
    loadCustomFieldDefinitions('member');
  }, []);

  const renderField = (definition) => {
    switch (definition.field_type) {
      case 'text':
        return (
          <Input
            value={fieldValues[definition.id] || ''}
            onChange={(e) => updateFieldValue(definition.id, e.target.value)}
            placeholder={definition.field_label}
            required={definition.is_required}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={fieldValues[definition.id] || ''}
            onChange={(e) => updateFieldValue(definition.id, e.target.value)}
            placeholder={definition.field_label}
            required={definition.is_required}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={fieldValues[definition.id] || ''}
            onChange={(e) => updateFieldValue(definition.id, e.target.value)}
            required={definition.is_required}
          />
        );
      case 'select':
        return (
          <Select
            value={fieldValues[definition.id] || ''}
            onValueChange={(value) => updateFieldValue(definition.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${definition.field_label}`} />
            </SelectTrigger>
            <SelectContent>
              {definition.field_options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'boolean':
        return (
          <Checkbox
            checked={fieldValues[definition.id] === 'true'}
            onCheckedChange={(checked) => updateFieldValue(definition.id, checked.toString())}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fieldDefinitions.map(definition => (
          <div key={definition.id}>
            <Label className="text-sm font-medium">
              {definition.field_label}
              {definition.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderField(definition)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
```

**Files to Create:**
- `src/components/member-profile/CustomFieldsSection.jsx`
- `src/components/admin/CustomFieldDefinitions.jsx`
- `src/services/customFieldsService.js`

**Acceptance Criteria:**
- [ ] Dynamic custom field rendering
- [ ] Support for text, number, date, select, boolean field types
- [ ] Required field validation
- [ ] Custom field definition management (admin)
- [ ] Field values saved with member profile

#### Task 1.4.4: Member Search & Filtering
**Estimated:** 1 day
**Status:** 🔄 IN PROGRESS

**Enhancement Requirements:**
```javascript
// Advanced member search
const MemberSearch = {
  async searchMembers(query, filters = {}) {
    const searchParams = {
      q: query, // General search term
      status: filters.status, // 'active', 'inactive', 'suspended'
      membership_type: filters.membershipType,
      date_joined_start: filters.dateJoinedStart,
      date_joined_end: filters.dateJoinedEnd,
      has_overdue_payments: filters.hasOverduePayments,
      custom_fields: filters.customFields,
      sort_by: filters.sortBy || 'last_name',
      sort_order: filters.sortOrder || 'asc',
      page: filters.page || 1,
      limit: filters.limit || 25
    };

    return await apiService.get('/api/members/search', { params: searchParams });
  },

  // Real-time search with debouncing
  useSearchMembers() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({});
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedSearch = useMemo(
      () => debounce(async (term, filterObj) => {
        if (term.length < 2 && Object.keys(filterObj).length === 0) {
          setResults([]);
          return;
        }

        setIsLoading(true);
        try {
          const response = await this.searchMembers(term, filterObj);
          setResults(response.data);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300),
      []
    );

    useEffect(() => {
      debouncedSearch(searchTerm, filters);
    }, [searchTerm, filters, debouncedSearch]);

    return {
      searchTerm,
      setSearchTerm,
      filters,
      setFilters,
      results,
      isLoading
    };
  }
};
```

**Acceptance Criteria:**
- [ ] Real-time search with debouncing
- [ ] Advanced filtering options
- [ ] Pagination for large result sets
- [ ] Sort by multiple criteria
- [ ] Search result highlighting
- [ ] Export search results

#### Task 1.4.5: Data Validation & Error Handling
**Estimated:** 0.5 days
**Status:** 🔄 IN PROGRESS

**Enhancement Requirements:**
- Improve error messages and user feedback
- Add client-side validation before API calls
- Handle network errors gracefully
- Implement optimistic updates where appropriate

**Acceptance Criteria:**
- [ ] Comprehensive form validation
- [ ] Clear error messages for users
- [ ] Network error handling
- [ ] Loading states for all operations
- [ ] Data consistency checks

### Integration Testing Requirements
- [ ] **CRUD Operations:** All create, read, update, delete operations
- [ ] **Photo Upload:** All photo upload scenarios including failures
- [ ] **Search Performance:** Search with 10k+ member records
- [ ] **Custom Fields:** Dynamic field creation and validation
- [ ] **Mobile Responsiveness:** All features work on mobile devices

---

## 🎯 Phase 1 Success Criteria

### Definition of Done
Each component must meet ALL of the following criteria:

#### Functional Requirements
- [ ] **Feature Complete:** All specified features implemented and working
- [ ] **Bug Free:** No known bugs or issues
- [ ] **Performance:** Meets all performance requirements
- [ ] **Security:** Passes security audit and testing
- [ ] **Mobile Ready:** Responsive design works on all device sizes

#### Quality Requirements
- [ ] **Code Coverage:** 90%+ test coverage
- [ ] **Documentation:** Complete technical and user documentation
- [ ] **Code Review:** All code reviewed and approved
- [ ] **Standards Compliance:** Follows coding standards and best practices
- [ ] **Accessibility:** WCAG 2.1 AA compliance

#### Deployment Requirements
- [ ] **Production Ready:** Deployed to production environment
- [ ] **Monitoring:** Logging and monitoring configured
- [ ] **Backup:** Data backup and recovery tested
- [ ] **Rollback Plan:** Rollback procedure documented and tested

### Phase 1 Dependencies Resolution
Before starting Phase 2, ensure:
- [ ] All Phase 1 components are 100% complete
- [ ] Integration testing between components passes
- [ ] Performance benchmarks meet requirements
- [ ] Security audit completed and issues resolved
- [ ] Stakeholder acceptance and sign-off received

### Timeline Management
- **Week 1:** Authentication & Security (1.1) + Database Schema (1.2)
- **Week 2:** Complete Database (1.2) + Start API Layer (1.3)
- **Week 3:** Complete API Layer (1.3) + Start Member Profile (1.4)
- **Week 4:** Complete Member Profile (1.4) + Integration testing + Deployment

**Buffer Time:** Each component includes 1 day buffer for unexpected issues
**Review Points:** Daily standup and weekly stakeholder reviews
**Go/No-Go Decision:** Phase 2 only begins after Phase 1 100% completion

---

*Phase 1 Implementation Plan*
*Version: 1.0*
*Created: June 29, 2025*
*Next Review: July 6, 2025*
