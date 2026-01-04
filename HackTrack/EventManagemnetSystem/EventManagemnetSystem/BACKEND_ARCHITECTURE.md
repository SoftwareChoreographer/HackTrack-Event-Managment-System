# HackTrack Backend Architecture

## Current Deployment Model

This backend is deployed as **Vercel Edge Functions** (serverless). All API endpoints are located in the `/api` directory.

### Primary Implementation: Serverless API (`/api`)

All production endpoints are implemented in the `/api` directory and deployed to Vercel:

- **Authentication**: `/api/auth/signin.js`, `/api/auth/signup.js`
- **Events**: `/api/events/me.js`, `/api/events/[id].js`, `/api/events/userevents.js`, `/api/events/userpage.js`, `/api/events/organizer.js`
- **Event Registration**: `/api/events/[id]/register.js`
- **Reviews**: `/api/reviews/userfeedback.js`
- **Notifications**: `/api/notifications/index.js`
- **Utilities**: `/api/_lib/db.js`, `/api/_lib/auth.js`, `/api/_lib/respond.js`, `/api/_lib/rateLimit.js`

### Legacy Code: Express Routes (`/routes`)

The `/routes` directory contains legacy Express implementation and is **NOT used in production**. These files exist for reference only and should not be modified or deployed.

- `/routes/auth.js` - Legacy
- `/routes/events.js` - Legacy
- `/routes/feedback.js` - Legacy
- `/routes/notifications.js` - Legacy
- `/routes/middleware.js` - Legacy

## Frontend Integration

The frontend communicates exclusively with serverless endpoints at:
```
https://your-vercel-deployment.vercel.app/api/*
```

### Required Endpoints (All Implemented)

| Method | Path | Function | Auth Required |
|--------|------|----------|----------------|
| POST | `/api/auth/signin` | User login | ✗ |
| POST | `/api/auth/signup` | User registration | ✗ |
| GET | `/api/events/me` | Get user name | ✓ |
| GET | `/api/events/userevents` | Get attending events | ✓ |
| GET | `/api/events/userpage` | Get upcoming events | ✓ |
| GET | `/api/events/organizer` | Get organized events (NEW) | ✓ |
| GET | `/api/events/:id` | Get event details | ✓ |
| POST | `/api/events/:id/register` | Register/unregister event | ✓ |
| POST | `/api/reviews/userfeedback` | Submit event review | ✓ |
| GET | `/api/notifications` | Get user notifications | ✓ |

## Environment Configuration

See `.env.example` for required environment variables:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - MySQL connection
- `DB_SSL_ENABLED`, `DB_SSL_CA_PATH` - SSL configuration for Aiven
- `JWT_SECRET` - JWT signing key
- `JWT_EXPIRES_IN` - Token expiration time
- `FRONTEND_URL` - Frontend URL for CORS
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` - Rate limiting config

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Vercel automatically detects `vercel.json` configuration
3. Set environment variables in Vercel project settings
4. Serverless functions are automatically deployed from `/api` directory

### Local Development

```bash
npm install
# Set .env variables
vercel dev  # Or use serverless framework
```

## Database

- **Type**: MySQL (Aiven hosted)
- **Connection Pool**: Lazy-initialized, optimized for serverless (2 connections)
- **SSL**: Required for Aiven production database

## Security

- JWT-based authentication in `/api/_lib/auth.js`
- Rate limiting per-instance in `/api/_lib/rateLimit.js`
- CORS configured in `/api/_lib/respond.js`
- Prepared statements for all SQL queries (SQL injection prevention)
- Password hashing with bcryptjs

## Error Handling

All serverless functions follow consistent error handling:
- Centralized via `/api/_lib/respond.js`
- Consistent JSON error responses
- Proper HTTP status codes
- Security headers on all responses

## Future Improvements

- Implement organizer event creation endpoint (`POST /api/events/create`)
- Add Redis for distributed rate limiting
- Implement event image upload service
- Add more granular role-based access control
