# Serverless API Testing Guide

This document describes how to test the migrated serverless API endpoints.

## Prerequisites

1. Environment variables configured (see `.env.example`)
2. Database accessible from serverless functions
3. Valid JWT_SECRET configured

## Testing Locally with Vercel CLI

Install Vercel CLI (if not already installed):
```bash
npm install -g vercel
```

Run local development server:
```bash
cd HackTrack/EventManagemnetSystem/EventManagemnetSystem
vercel dev
```

## Endpoint Testing

### 1. Authentication Endpoints

#### POST /api/auth/signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "securepassword123"
  }'
```

Expected Response:
```json
{
  "token": "eyJhbGc...",
  "name": "Test User",
  "id": 1,
  "role": "User"
}
```

#### POST /api/auth/signin
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123"
  }'
```

Expected Response:
```json
{
  "token": "eyJhbGc...",
  "role": "User",
  "id": 1
}
```

### 2. Events Endpoints (Authenticated)

Set your token from signup/signin:
```bash
export TOKEN="your-jwt-token-here"
```

#### GET /api/events/me
```bash
curl -X GET http://localhost:3000/api/events/me \
  -H "Authorization: Bearer $TOKEN"
```

Expected Response:
```json
{
  "name": "Test User"
}
```

#### GET /api/events/userpage
```bash
curl -X GET http://localhost:3000/api/events/userpage \
  -H "Authorization: Bearer $TOKEN"
```

Expected Response: Array of upcoming events with attendance status

#### GET /api/events/userevents
```bash
curl -X GET http://localhost:3000/api/events/userevents \
  -H "Authorization: Bearer $TOKEN"
```

Expected Response: Array of events user is attending

#### GET /api/events/:id
```bash
curl -X GET http://localhost:3000/api/events/1 \
  -H "Authorization: Bearer $TOKEN"
```

Expected Response: Single event object

#### POST /api/events/:id/register
```bash
curl -X POST http://localhost:3000/api/events/1/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_attending": true
  }'
```

Expected Response:
```json
{
  "success": true,
  "registered": true
}
```

### 3. Reviews Endpoints

#### POST /api/reviews/userfeedback
```bash
curl -X POST http://localhost:3000/api/reviews/userfeedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": 1,
    "title": "Great event!",
    "rating": 5,
    "pros": "Well organized",
    "cons": "None",
    "reviewText": "Had a wonderful time"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Review submitted successfully"
}
```

Note: User must be attending the event (is_attending=true) to submit a review.

#### GET /api/reviews/:eventId/review
```bash
curl -X GET http://localhost:3000/api/reviews/1/review
```

Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Great event!",
      "rating": 5,
      "pros": "Well organized",
      "cons": "None",
      "reviewText": "Had a wonderful time",
      "date": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### 4. Notifications Endpoint

#### GET /api/notifications
```bash
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer $TOKEN"
```

Expected Response: Array of notification objects

## Security Headers Verification

Check that all responses include:
- `Access-Control-Allow-Origin`: Matches FRONTEND_URL
- `X-Content-Type-Options`: nosniff
- `Referrer-Policy`: no-referrer
- `X-Frame-Options`: DENY
- `Permissions-Policy`: geolocation=(), microphone=(), camera=()
- `Cache-Control`: no-store
- `Content-Security-Policy`: default-src 'none'; frame-ancestors 'none'; base-uri 'none'

Example verification:
```bash
curl -v http://localhost:3000/api/events/me \
  -H "Authorization: Bearer $TOKEN" 2>&1 | grep -E "(X-|Access-Control|Referrer|Cache-Control|Content-Security)"
```

## Rate Limiting Testing

Rate limiting is applied to:
- POST /api/auth/signin
- POST /api/auth/signup
- POST /api/events/:id/register
- POST /api/reviews/userfeedback

Default limits: 60 requests per minute (configurable via RATE_LIMIT_MAX and RATE_LIMIT_WINDOW_MS)

Test rate limiting:
```bash
for i in {1..65}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nHTTP Status: %{http_code}\n"
done
```

After 60 requests, you should receive HTTP 429 (Too Many Requests) with:
- `Retry-After` header indicating seconds to wait
- `X-RateLimit-Limit` header showing the limit
- `X-RateLimit-Remaining` header showing remaining requests
- `X-RateLimit-Reset` header showing when the window resets

## Error Cases to Test

1. **Invalid token**: Should return 401 Unauthorized
2. **Missing required fields**: Should return 400 Bad Request
3. **Duplicate email on signup**: Should return 409 Conflict
4. **Invalid credentials on signin**: Should return 401 Unauthorized
5. **Review without attendance**: Should return 403 Forbidden
6. **Invalid rating (not 1-5)**: Should return 400 Bad Request
7. **Exceeding rate limit**: Should return 429 Too Many Requests
8. **Event not found**: Should return 404 Not Found

## Notes

- All endpoints properly handle CORS preflight (OPTIONS) requests
- Email addresses are normalized (lowercase, trimmed) consistently
- Passwords are hashed using bcrypt with 10 salt rounds
- JWT tokens expire after 1 hour (configurable via JWT_EXPIRES_IN)
- Rate limiting is per-instance only (see rateLimit.js for production TODO)
- All database queries use prepared statements to prevent SQL injection
