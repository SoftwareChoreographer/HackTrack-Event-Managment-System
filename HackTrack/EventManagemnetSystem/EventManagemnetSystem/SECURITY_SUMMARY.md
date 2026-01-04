# Security Implementation Summary

## Overview
This document summarizes the security measures implemented in the serverless API migration.

## Security Headers

All API responses include the following security headers:

### 1. X-Content-Type-Options: nosniff
Prevents MIME type sniffing, reducing risk of drive-by downloads and cross-site scripting.

### 2. Referrer-Policy: no-referrer
Prevents leaking of referrer information to third parties, protecting user privacy and preventing information disclosure.

### 3. X-Frame-Options: DENY
Prevents the API from being embedded in iframes, mitigating clickjacking attacks.

### 4. Permissions-Policy
Restricts access to browser features:
- `geolocation=()` - Disables geolocation API
- `microphone=()` - Disables microphone access
- `camera=()` - Disables camera access

### 5. Cache-Control: no-store
Prevents caching of sensitive API responses, ensuring data freshness and preventing exposure of stale authentication data.

### 6. Content-Security-Policy
Implements a strict CSP for API-only responses:
- `default-src 'none'` - Blocks all resource loading by default
- `frame-ancestors 'none'` - Prevents framing (redundant with X-Frame-Options but provides defense in depth)
- `base-uri 'none'` - Prevents base tag injection attacks

## CORS (Cross-Origin Resource Sharing)

### Configuration
- Origin: Configured via `FRONTEND_URL` environment variable
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization
- Credentials: Enabled (allows cookies and authentication headers)

### Preflight Handling
All endpoints handle OPTIONS requests for CORS preflight checks via the `handleOptions()` utility function.

## Authentication & Authorization

### JWT (JSON Web Tokens)
- **Algorithm**: Default (HS256)
- **Secret**: Configured via `JWT_SECRET` environment variable
- **Expiration**: Configurable via `JWT_EXPIRES_IN` (default: 1 hour)
- **Payload**: Contains user ID, email, and role

### Token Validation
The `getAuthUser()` helper in `api/_lib/auth.js`:
- Validates Authorization header format
- Verifies JWT signature
- Returns decoded user information
- Throws 401 errors for invalid/missing tokens

### Password Security
- **Hashing**: bcrypt with 10 salt rounds
- **Comparison**: Uses bcrypt.compare() for constant-time comparison
- **Storage**: Only hashed passwords stored in database

## SQL Injection Prevention

### Prepared Statements
All database queries use parameterized queries (prepared statements) to prevent SQL injection:

```javascript
// Example from signin.js
const [Users] = await pool.query('SELECT * FROM Users WHERE email = ?', [normalizedEmail]);
```

### Email Normalization
Email addresses are consistently normalized (lowercase, trimmed) across all endpoints to prevent case-sensitivity bypasses.

## Rate Limiting

### Implementation
Location: `api/_lib/rateLimit.js`

### Configuration
- `RATE_LIMIT_WINDOW_MS`: Time window in milliseconds (default: 60000 = 1 minute)
- `RATE_LIMIT_MAX`: Maximum requests per window (default: 60)

### Mechanism
- In-memory sliding window rate limiter
- Keyed by client IP address (extracted from X-Forwarded-For, X-Real-IP, or socket)
- Deterministic cleanup every 100 requests to prevent memory leaks

### Protected Endpoints
Rate limiting is applied to sensitive endpoints:
1. POST /api/auth/signin - Prevents brute force attacks
2. POST /api/auth/signup - Prevents abuse and spam accounts
3. POST /api/events/:id/register - Prevents rapid registration spam
4. POST /api/reviews/userfeedback - Prevents review spam

### Response Headers
When rate limited, responses include:
- HTTP 429 (Too Many Requests)
- `Retry-After`: Seconds to wait before retrying
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Timestamp when window resets

### Known Limitations
⚠️ **IMPORTANT**: The current implementation is per-instance only and not suitable for production at scale.

**Issue**: Each serverless function instance maintains its own in-memory rate limit store. This means:
- Different users might get different instances
- Rate limits are not shared across instances
- Cold starts reset the rate limit state

**Recommended Solution**: For production, implement a distributed rate limit store using:
- **Upstash Redis**: Serverless-friendly Redis with REST API
- **Vercel KV**: Built-in key-value store for Vercel deployments
- **DynamoDB**: For AWS Lambda deployments

This is documented in the code with TODO comments.

## Input Validation

### Authentication Endpoints
- **Email**: Required, trimmed, normalized to lowercase
- **Password**: Required, trimmed, minimum length enforced by bcrypt
- **Name**: 2-50 characters for signup

### Event Registration
- **event_id**: Required, validated to exist in database
- **is_attending**: Required boolean (accepts boolean, string, or numeric values)

### Review Submission
- **eventId**: Required
- **title**: Required
- **rating**: Required, must be number 1-5
- **attendance**: Verified before allowing review submission

## Error Handling

### Consistent Error Responses
All errors return JSON with an `error` field:
```json
{ "error": "Error message" }
```

### Status Codes
- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication failures)
- 403: Forbidden (authorization failures, e.g., review without attendance)
- 404: Not Found (resource doesn't exist)
- 405: Method Not Allowed (wrong HTTP method)
- 409: Conflict (duplicate resource, e.g., email already exists)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error (unexpected errors)

### Information Disclosure Prevention
- Generic error messages for authentication failures ("Invalid credentials" instead of "User not found")
- Detailed error messages only logged server-side, not sent to client
- Stack traces and sensitive information excluded from responses

## Additional Security Measures

### 1. Unique Constraint Enforcement
Database-level unique constraints on email addresses prevent race conditions and ensure data integrity.

### 2. Role-Based Access Control (RBAC)
User roles stored in JWT and database, with `requireRole()` helper available for future endpoints.

### 3. Attendance Verification
Review submission requires verified attendance (is_attending=true) to prevent spam reviews.

### 4. Database Connection Security
- Connection pooling with limited connections (2 per instance for serverless)
- SSL support for database connections (configurable via DB_SSL_ENABLED)
- CA certificate validation when SSL enabled

## Security Scan Results

### Manual Security Review
✅ No use of dangerous functions (eval, Function constructor)
✅ No XSS-prone patterns (innerHTML, dangerouslySetInnerHTML)
✅ No SQL concatenation (all queries use prepared statements)
✅ All user input validated and sanitized
✅ Proper error handling prevents information disclosure

### Known Issues
None identified in the current implementation.

### Recommendations for Production

1. **Rate Limiting**: Implement distributed rate limiting with Upstash Redis or similar
2. **Secrets Management**: Use Vercel Environment Variables or AWS Secrets Manager
3. **Database Connection**: Use connection poolers like PgBouncer for PostgreSQL
4. **Monitoring**: Implement logging and monitoring for security events
5. **HTTPS**: Ensure all traffic uses HTTPS (handled by Vercel in production)
6. **API Keys**: Consider implementing API keys for additional security layer
7. **Account Lockout**: Implement account lockout after repeated failed login attempts
8. **Email Verification**: Add email verification for new signups
9. **Password Strength**: Enforce stronger password requirements (complexity, length)
10. **Two-Factor Authentication**: Consider implementing 2FA for sensitive operations

## Compliance Considerations

### Data Protection
- Passwords are properly hashed (not reversible)
- User data transmitted over HTTPS in production
- No sensitive data logged to console in production

### GDPR/Privacy
- User reviews are associated with user_id for accountability but can be displayed anonymously
- Users have full CRUD access to their own data
- Clear data retention policies should be established

## Testing

See [SERVERLESS_TESTING.md](./SERVERLESS_TESTING.md) for comprehensive testing procedures including:
- Security header verification
- Rate limiting tests
- Authentication/authorization tests
- Error case validation
