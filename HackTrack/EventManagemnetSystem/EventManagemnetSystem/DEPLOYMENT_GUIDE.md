# HackTrack Backend Deployment Guide

## Overview

This backend is a **Vercel Edge Functions (serverless)** deployment. All endpoints are stateless and located in the `/api` directory.

## Pre-Deployment Checklist

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Required variables (no defaults)
DB_HOST=               # MySQL host (e.g., abc123.aivencloud.com)
DB_PORT=3306           # MySQL port
DB_USER=               # Database user
DB_PASSWORD=           # Database password
DB_NAME=event_management

# SSL (Required for Aiven)
DB_SSL_ENABLED=true
DB_SSL_CA_PATH=./ca.pem

# JWT Authentication
JWT_SECRET=            # Generate: openssl rand -base64 32
JWT_EXPIRES_IN=1h

# CORS/Frontend
FRONTEND_URL=          # Frontend deployment URL

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60
NODE_ENV=production
```

### 2. Database Prerequisites

**Schema Required:**

Ensure your MySQL database has these tables (check existing schema):

- `Users` (user_id, email, password, name, role, created_at)
- `Events` (event_id, name, description, date_time, location, image_data, organizer_id, created_at)
- `EventAttendance` (event_id, user_id, is_attending, created_at)
- `Reviews` (event_id, user_id, title, rating, pros, cons, comment, created_at)
- `notifications` (id, event_id, user_id, type, title, message, created_at)

### 3. Dependencies Installed

```bash
npm install
```

**Key packages:**
- `express` - Web server (for Express routes, not used in production)
- `mysql2` - Database driver
- `jsonwebtoken` - JWT tokens
- `bcryptjs` - Password hashing
- `dotenv` - Environment configuration

### 4. Syntax Validation

All files have been syntax-checked:

```bash
npm run build
```

## Deployment Steps

### Option A: Vercel (Recommended)

1. **Connect Repository**
   - Push code to GitHub
   - Connect to Vercel: https://vercel.com/import

2. **Configure Vercel Project**
   - Root Directory: `HackTrack/EventManagemnetSystem/EventManagemnetSystem`
   - Framework: Other (Serverless Functions)

3. **Set Environment Variables**
   - Go to Vercel Project Settings → Environment Variables
   - Add all variables from `.env.example`
   - Ensure `ca.pem` is included in repository root

4. **Deploy**
   - Vercel automatically detects `/api` directory
   - Functions are deployed to `https://<project>.vercel.app/api/*`

### Option B: Manual Vercel CLI

```bash
# Login to Vercel
vercel login

# Set up development environment
vercel link

# Deploy
vercel --prod
```

## Verification After Deployment

### 1. Health Check

Test connectivity to backend:

```bash
# Signup (no auth required)
curl -X POST https://your-backend.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123"
  }'

# Should return: { token, role, id, name }
```

### 2. Authenticated Endpoints

```bash
# Use token from signup response
TOKEN="<your-jwt-token>"

# Get user name
curl -X GET https://your-backend.vercel.app/api/events/me \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Database Connectivity

- [ ] Events can be retrieved (`GET /api/events/userpage`)
- [ ] User can register for events (`POST /api/events/:id/register`)
- [ ] Reviews can be submitted (`POST /api/reviews/userfeedback`)
- [ ] Notifications are accessible (`GET /api/notifications`)

## Configuration Details

### Database Connection Pool

- **Type**: Lazy-initialized pool
- **Connections**: 2 (serverless optimized)
- **SSL**: Enabled for Aiven
- **Keepalive**: Enabled

### Authentication Flow

1. User signs up/signs in → JWT token generated
2. Frontend stores token in localStorage
3. All authenticated requests include `Authorization: Bearer <token>`
4. Backend validates JWT via `getAuthUser()` helper

### Rate Limiting

- **Scope**: Per-instance only
- **Window**: 60 seconds (default)
- **Limit**: 60 requests per window
- **Production Note**: For distributed rate limiting, integrate Upstash Redis

## Troubleshooting

### "Database connection failed"

- Verify DB_HOST, DB_USER, DB_PASSWORD are correct
- Check firewall allows connection from Vercel IP ranges
- Ensure ca.pem is present for SSL connections
- Test locally with `.env` variables

### "JWT token invalid"

- Verify JWT_SECRET is set and consistent
- Check token hasn't expired (default: 1h)
- Ensure Authorization header format: `Bearer <token>`

### "CORS errors in frontend"

- Verify FRONTEND_URL matches deployment URL
- Check CORS headers in `/api/_lib/respond.js`
- Ensure OPTIONS preflight requests are handled

### "Rate limited errors"

- Check RATE_LIMIT_MAX value
- Disable rate limiting in development (optional)
- For production scale, implement Upstash Redis

## Monitoring & Logging

### Vercel Logs

View function logs in Vercel dashboard:
- Project → Functions
- Select function → View logs
- Check for errors in `console.error()` calls

### Key Log Points

- Auth errors (invalid credentials, token issues)
- Database connection errors
- Query errors (SQL syntax)
- Rate limit hits

## Security Checklist

- [ ] JWT_SECRET is strong (32+ chars, random)
- [ ] Database credentials are environment variables only
- [ ] CORS allows only frontend domain
- [ ] SSL enabled for database connection
- [ ] Rate limiting enabled
- [ ] No secrets committed to Git (.env in .gitignore)
- [ ] HTTPS required for all endpoints

## Scaling Considerations

**When you need to:**

1. **Increase Rate Limits**
   - Use Upstash Redis: Add `UPSTASH_REDIS_URL` env var
   - Implement distributed rate limiting in `/api/_lib/rateLimit.js`

2. **Optimize Database**
   - Add indexes on frequently queried columns (email, event_id, user_id)
   - Monitor query performance in Aiven dashboard

3. **Add New Endpoints**
   - Create `/api/path/endpoint.js` following existing patterns
   - Use `getPool()` for DB, `getAuthUser()` for auth
   - Use `success()` and `error()` for responses

## Support & References

- **Vercel Docs**: https://vercel.com/docs/functions/serverless-functions
- **MySQL Docs**: https://dev.mysql.com/doc/
- **JWT Guide**: https://jwt.io/
- **Architecture**: See `BACKEND_ARCHITECTURE.md`
