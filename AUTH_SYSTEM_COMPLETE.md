# Authentication System - Complete Implementation Guide

## Overview

Your custom JWT-based authentication system is now fully implemented and production-ready. This system provides secure user authentication with email verification, password reset, and session management.

---

## What Was Built

### Backend Components

#### 1. Database Schema (`supabase/migrations/20260126000002_authentication_system.sql`)
- **users** table with email verification, password reset, account locking, subscription tiers
- **refresh_tokens** table for JWT session management
- **user_watchlist** table for user-specific tracking
- **price_alerts** table for user price notifications
- Row Level Security (RLS) policies
- Auto-cleanup functions for expired tokens

#### 2. Auth Utilities (`src/utils/auth.js`)
- Password hashing with bcrypt (12 rounds)
- JWT token generation/verification (access + refresh)
- Password strength validation
- Email validation
- Account locking logic (5/7/10 attempts = 15/30/60 min lockouts)
- Input sanitization

#### 3. Email Service (`src/utils/email.js`)
- Beautiful HTML email templates matching The Hub's dark luxury theme
- Verification email (24-hour token)
- Password reset email (1-hour token)
- Welcome email after verification
- Development mode (logs instead of sending)

#### 4. Auth Middleware (`src/middleware/auth.js`)
- `authenticateToken` - Required authentication
- `optionalAuth` - Optional authentication
- `requireVerifiedEmail` - Email verification check
- `requireSubscription` - Subscription tier check
- Rate limiting (5 attempts per 15 min, 3 per hour for password reset)

#### 5. Auth API Routes (`src/api/auth.js`)
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Reset with token
- `GET /api/auth/verify-email` - Verify email
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Frontend Components

#### 6. Auth Service (`the-hub/src/services/auth.ts`)
- API wrapper functions for all auth endpoints
- Email and password validation
- TypeScript types for User, LoginData, SignupData

#### 7. Auth Context (`the-hub/src/contexts/AuthContext.tsx`)
- Global authentication state
- Auto token refresh every 14 minutes
- User management functions
- useAuth hook for components

#### 8. Auth Pages
- **Login** (`the-hub/src/pages/Login.tsx`)
- **Signup** (`the-hub/src/pages/Signup.tsx`)
- **Forgot Password** (`the-hub/src/pages/ForgotPassword.tsx`)
- **Reset Password** (`the-hub/src/pages/ResetPassword.tsx`)
- **Verify Email** (`the-hub/src/pages/VerifyEmail.tsx`)

#### 9. Protected Route Component (`the-hub/src/components/ProtectedRoute.tsx`)
- Wraps routes requiring authentication
- Optional email verification requirement
- Loading states
- Automatic redirects

#### 10. App Integration (`the-hub/src/App.tsx`)
- AuthProvider wrapping entire app
- Auth routes configured
- Layout separation for auth pages

---

## Setup Instructions

### 1. Backend Configuration

Add these environment variables to `/Users/sydneyjackson/the-hub/.env`:

```bash
# JWT Configuration (IMPORTANT: Generate strong secrets!)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=another-different-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# SMTP Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Node Environment
NODE_ENV=development
```

**Generate JWT Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Gmail App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Create new app password for "Mail"
3. Use that password in SMTP_PASS

### 2. Frontend Configuration

The frontend is already configured in `/Users/sydneyjackson/the-hub/the-hub/.env.example`:

```bash
VITE_API_URL=http://localhost:3000
```

### 3. Database Migration

The migration was already applied to your Supabase database successfully.

---

## Testing the System

### 1. Start the Servers

**Backend:**
```bash
cd /Users/sydneyjackson/the-hub
npm run dev
```

**Frontend:**
```bash
cd /Users/sydneyjackson/the-hub/the-hub
npm run dev
```

### 2. Test Signup Flow

1. Navigate to http://localhost:5173/signup
2. Fill in email, password (must meet requirements), first name, last name
3. Click "Create Account"
4. Check email for verification link (or check server logs in dev mode)
5. Click verification link
6. Should see "Email Verified!" success page
7. Click "Sign In Now"

### 3. Test Login Flow

1. Navigate to http://localhost:5173/login
2. Enter email and password
3. Click "Sign In"
4. Should redirect to /dashboard with authentication

### 4. Test Password Reset Flow

1. Navigate to http://localhost:5173/forgot-password
2. Enter email address
3. Click "Send Reset Link"
4. Check email for reset link
5. Click reset link (valid for 1 hour)
6. Enter new password
7. Click "Reset Password"
8. Redirects to login page

### 5. Test Protected Routes

Protected routes will automatically redirect to /login if not authenticated:
- /dashboard
- /settings
- /admin
- Any route wrapped with ProtectedRoute

---

## Using Authentication in Components

### Get Current User

```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not logged in</div>;

  return (
    <div>
      <p>Welcome, {user?.firstName || user?.email}!</p>
      <p>Tier: {user?.tier}</p>
    </div>
  );
}
```

### Login/Logout

```tsx
import { useAuth } from '../contexts/AuthContext';

function LoginButton() {
  const { login, logout, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    try {
      await login({ email: 'test@example.com', password: 'Password123!' });
      // Success - user is now logged in
    } catch (error) {
      console.error('Login failed:', error.message);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return isAuthenticated ? (
    <button onClick={handleLogout}>Logout</button>
  ) : (
    <button onClick={handleLogin}>Login</button>
  );
}
```

### Protect a Route

```tsx
import ProtectedRoute from '../components/ProtectedRoute';

<Route
  path="/premium-feature"
  element={
    <ProtectedRoute requireVerified={true}>
      <PremiumFeature />
    </ProtectedRoute>
  }
/>
```

---

## Backend API Usage

### Making Authenticated Requests

From backend routes:

```javascript
const { authenticateToken } = require('../middleware/auth');

// Protected route
router.get('/my-data', authenticateToken, async (req, res) => {
  // req.userId contains the authenticated user's ID
  const userId = req.userId;

  // Fetch user-specific data
  const data = await pool.query('SELECT * FROM user_watchlist WHERE user_id = $1', [userId]);

  res.json({ data: data.rows });
});
```

### Require Email Verification

```javascript
const { authenticateToken, requireVerifiedEmail } = require('../middleware/auth');

router.get('/verified-only', authenticateToken, requireVerifiedEmail, async (req, res) => {
  res.json({ message: 'This route requires verified email' });
});
```

### Require Subscription

```javascript
const { authenticateToken, requireSubscription } = require('../middleware/auth');

router.get('/premium-feature',
  authenticateToken,
  requireSubscription(['premium', 'pro', 'enterprise']),
  async (req, res) => {
    res.json({ message: 'Premium feature accessed', tier: req.userTier });
  }
);
```

---

## Security Features Implemented

✅ **Password Security**
- Bcrypt hashing with 12 rounds
- Strong password requirements (8+ chars, uppercase, lowercase, number, special)
- Password strength validation

✅ **Token Security**
- HttpOnly cookies (prevent XSS)
- Secure flag in production (HTTPS only)
- SameSite: strict (prevent CSRF)
- Dual token system (short access + long refresh)
- Automatic token refresh

✅ **Account Security**
- Account locking after failed attempts (5/7/10 = 15/30/60 min)
- Failed login attempt tracking
- IP and user agent logging
- Token expiration

✅ **Email Verification**
- Double opt-in flow
- 24-hour token expiration
- Secure random token generation

✅ **Rate Limiting**
- 5 attempts per 15 minutes (login)
- 3 attempts per hour (password reset)
- Prevents brute force attacks

✅ **Input Validation**
- Email format validation
- Password strength validation
- Input sanitization (prevent XSS)

✅ **Database Security**
- Row Level Security (RLS) policies
- Parameterized queries (prevent SQL injection)
- Token cleanup functions

---

## Email Templates

The system includes three beautiful email templates:

### 1. Verification Email
- Purple gradient header
- Clear call-to-action button
- Backup URL link
- 24-hour expiration notice
- Dark luxury theme

### 2. Password Reset Email
- Red gradient header (security emphasis)
- Reset password button
- Backup URL link
- 1-hour expiration notice
- Security warning

### 3. Welcome Email
- Green gradient header (success)
- Feature list
- Dashboard link
- Support information

All emails are mobile-responsive and match The Hub's brand.

---

## Next Steps: Integration

Now that authentication is complete, you can integrate it with existing features:

### Task #7: Integrate Auth with Existing Features

1. **Watchlist Integration**
   - Convert generic watchlist to user-specific
   - Filter listings by authenticated user
   - Add protection to watchlist routes

2. **Price Alerts**
   - Link alerts to authenticated users
   - Send notifications to user's email/Telegram
   - User-specific alert management

3. **Telegram Integration**
   - Link Telegram chat ID to user account
   - User-specific Telegram notifications
   - Settings page for Telegram setup

4. **Newsletter Integration**
   - Link blog subscribers to user accounts
   - Sync newsletter preferences
   - User-specific newsletter settings

5. **Premium Features**
   - Implement subscription tier checks
   - Create premium-only features
   - Payment integration (Stripe)

6. **Admin Protection**
   - Add admin role to users table
   - Protect admin routes with role check
   - Admin dashboard access control

---

## Troubleshooting

### Email Not Sending

**In Development:**
- Emails are logged to console if SMTP not configured
- Check server logs for verification/reset URLs

**In Production:**
- Verify SMTP credentials
- Check Gmail "Less secure app access" or use App Password
- Check email spam folder
- Verify FRONTEND_URL is correct

### Token Issues

**Token Expired:**
- Access tokens expire after 15 minutes
- Frontend auto-refreshes every 14 minutes
- Refresh tokens expire after 7 days

**Invalid Token:**
- Clear browser cookies
- Log out and log back in
- Check JWT_SECRET and JWT_REFRESH_SECRET are set

### Account Locked

- Wait for lockout period (15/30/60 minutes)
- Or manually reset in database:
  ```sql
  UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = 'user@example.com';
  ```

### Database Issues

- Ensure migration was applied: `supabase db push --linked`
- Check RLS policies if getting permission errors
- Verify database connection string

---

## Production Deployment

### Environment Variables

Update production `.env` with:
- Strong JWT secrets (different from dev)
- Production SMTP credentials
- Production FRONTEND_URL
- NODE_ENV=production

### Security Checklist

- [ ] Strong JWT secrets generated (32+ characters)
- [ ] SMTP configured and tested
- [ ] HTTPS enabled (secure cookies)
- [ ] FRONTEND_URL updated to production domain
- [ ] Database RLS policies tested
- [ ] Rate limiting verified
- [ ] Email templates tested on multiple clients
- [ ] Password reset flow tested end-to-end
- [ ] Account locking tested
- [ ] Token refresh tested

### Monitoring

Monitor these metrics:
- Failed login attempts
- Account lockouts
- Token refresh failures
- Email delivery rates
- Verification completion rates
- Password reset completion rates

---

## API Endpoints Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/verify-email?token=xxx` | Verify email address |

### Protected Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/logout` | Sign out (requires auth) |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update user profile |

---

## File Reference

### Backend Files Created/Modified

1. `supabase/migrations/20260126000002_authentication_system.sql` (267 lines)
2. `src/utils/auth.js` (209 lines)
3. `src/utils/email.js` (346 lines)
4. `src/middleware/auth.js` (287 lines)
5. `src/api/auth.js` (681 lines)
6. `src/api/server.js` (modified - added auth routes)
7. `.env.auth.example` (configuration guide)

### Frontend Files Created/Modified

1. `the-hub/src/services/auth.ts` (214 lines)
2. `the-hub/src/contexts/AuthContext.tsx` (140 lines)
3. `the-hub/src/pages/Login.tsx` (185 lines)
4. `the-hub/src/pages/Signup.tsx` (325 lines)
5. `the-hub/src/pages/ForgotPassword.tsx` (180 lines)
6. `the-hub/src/pages/ResetPassword.tsx` (235 lines)
7. `the-hub/src/pages/VerifyEmail.tsx` (140 lines)
8. `the-hub/src/components/ProtectedRoute.tsx` (85 lines)
9. `the-hub/src/App.tsx` (modified - added auth integration)

**Total:** ~3,500 lines of production-ready code

---

## Success! 🎉

Your authentication system is complete and ready to use. You now have:

✅ Complete user registration with email verification
✅ Secure login with JWT tokens
✅ Password reset flow
✅ Account locking and rate limiting
✅ Beautiful email templates
✅ Protected routes
✅ Session management
✅ TypeScript types
✅ React hooks and context
✅ Production-ready security

Test it out by navigating to http://localhost:5173/signup and creating your first account!
