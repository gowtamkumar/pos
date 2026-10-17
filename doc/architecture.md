# LMS Full Architecture Diagram & Design (MVP → Scalable)

This document shows a complete architecture diagram and supporting design for your LMS MVP that includes: sub-lessons, progress tracking, quizzes, and payments — and how to scale it later.

---

## 1. One-line summary

A single-page Next.js frontend talks to a NestJS backend (REST) that uses PostgreSQL for relational data, S3 for media, Stripe for payments, Redis for background jobs & caching, and optional microservices for heavy workloads (transcoding, analytics). Authentication uses JWT.

---

## 2. Visual architecture (ASCII diagram)

```
[Users] --> [Next.js Frontend (SSR/SPA)]
                 |    ^
                 |    |
                 v    |
           [API Gateway / Load Balancer]
                 |
         +-------+--------+-----------------------------+
         |                |                             |
 [Backend: NestJS]   [Worker(s): Bull/Redis]       [Realtime / WS Server]
 (Auth, Courses,     (Transcode, Email, Jobs)      (Notifications, Live)
  Lessons, Payments, )
         |
         +------------+-------------------+
                      |
               [PostgreSQL DB]        [Redis (cache, jobs)]
               (users,courses,
                lessons,progress,
                quizzes,payments)
                      |
              +-------+------+
              |              |
         [S3 / MinIO]   [CDN: CloudFront]
         (videos, files)  (serve video segments & files)
                      |
                 [Stripe]
                 (payments)

```

---

## 3. Components & Responsibilities

### Frontend (Next.js)

- Public pages: Landing, course catalog, course detail
- Auth pages: Login / Signup
- Student: Course player, lesson list, progress bar, quiz UI
- Instructor: Course builder, lesson/sub-lesson editor, uploads
- Admin: Approve courses, view payments, manage users
- Direct S3 uploads (presigned URLs) for large files
- Uses JWT stored in memory or httpOnly cookie (recommended)

### Backend API (NestJS)

- Monolith or modular microservices by domain (Auth, Course, Payment, Quiz, Progress)
- Exposes REST endpoints (or GraphQL if preferred)
- Validates role-based access with Guards
- Creates presigned S3 URLs, talks to Stripe for checkout, processes webhooks
- Publishes background jobs to Redis/Bull (e.g., video transcoding, thumbnail generation, send email)

### Workers (Bull + Redis)

- Asynchronous jobs: transcode video, generate thumbnails, send emails, analytics aggregation
- Runs separate container/service so heavy tasks don’t block API

### Realtime server (optional)

- WebSocket server (Socket.IO or ws) for real-time notifications, quiz timers, or live classes
- Can be colocated with API or run as separate horizontally-scalable service

### Storage & CDN

- S3 (or MinIO for dev) stores raw uploads and HLS segments
- CDN (CloudFront) serves content fast; use signed URLs for secure access

### Database (PostgreSQL)

- Relational data: users, courses, lessons, quizzes, attempts, progress, enrollments, payments
- Use read replicas when scaling reads

### Payment Provider (Stripe)

- Use Checkout or Payment Intents
- Webhook endpoint to verify and persist payment status
- On success create `enrollments` row and mark `payments.completed`

---

## 4. Data model summary (key tables)

- `users` (id, name, email, password_hash, role, created_at)
- `courses` (id, title, desc, price, status, instructor_id)
- `lessons` (id, course_id, parent_lesson_id NULLABLE, title, content_type, content_url, position)
- `enrollments` (id, user_id, course_id, enrolled_at)
- `progress` (id, user_id, lesson_id, completed_at)
- `payments` (id, user_id, course_id, amount, currency, status, transaction_id, created_at)
- `quizzes` (id, lesson_id, title)
- `quiz_questions` (id, quiz_id, type, question_text)
- `quiz_options` (id, question_id, option_text, is_correct)
- `quiz_attempts` (id, user_id, quiz_id, score, started_at, completed_at)
- `quiz_answers` (id, attempt_id, question_id, selected_option_id, answer_text, is_correct)

---

## 5. Important APIs (minimal list)

- `POST /auth/register` , `POST /auth/login` , `GET /auth/me`
- `GET /courses` , `GET /courses/:id` , `POST /courses` , `PATCH /courses/:id`
- `POST /courses/:id/lessons` , `GET /courses/:id/lessons`
- `POST /lessons/:id/complete` → mark lesson complete (creates `progress`)
- `GET /courses/:id/progress` → compute progress % for user
- `POST /courses/:id/enroll` → create Stripe checkout session
- `POST /webhooks/stripe` → handle payment events
- `POST /quizzes/:id/submit` → submit quiz attempt
- `POST /uploads/presign` → return presigned URL for S3

---

## 6. Progress calculation (SQL)

```sql
SELECT
  (COUNT(DISTINCT p.lesson_id) * 100.0) / NULLIF(COUNT(DISTINCT l.id),0) AS progress_percentage
FROM lessons l
LEFT JOIN progress p ON l.id = p.lesson_id AND p.user_id = $1
WHERE l.course_id = $2;
```

For parent lessons (main lessons) that have sub-lessons, determine parent completion by checking all child lessons completed.

---

## 7. Security & Access Control

- Use **httpOnly secure cookies** or short-lived JWT + refresh tokens to avoid token theft.
- Validate enrollment server-side before returning signed content URLs.
- Use **signed S3 URLs** with short expiry for lesson content.
- Verify Stripe webhooks with signature secret and make idempotent updates.
- Rate-limit sensitive endpoints (login, registration).
- Use least-privilege roles for DB and services.

---

## 8. Scalability Plan (MVP → Production)

**Phase 1: MVP (small traffic)**

- 1 API server, 1 Postgres, Redis, S3, Vercel for frontend.

**Phase 2: Growth**

- Auto-scale API behind LB, read replicas for Postgres, separate DB for analytics, multiple worker instances, use CloudFront for media.

**Phase 3: High-Scale**

- Microservices by domain (auth, course, payment, media), Kafka for event bus, dedicated streaming/transcoding service, multi-region deployment.

---

## 9. Deployment Topology (example using Docker + AWS)

- Frontend: Vercel or S3+CloudFront
- Backend API: Docker on ECS/Fargate (auto-scale) or DigitalOcean App Platform
- Workers: separate Fargate services
- Database: RDS Postgres (Multi-AZ)
- Redis: Elasticache or managed Redis
- Storage: S3 + CloudFront
- CI/CD: GitHub Actions → deploy on push to main

---

## 10. Monitoring & Observability

- Logs → centralized (CloudWatch / ELK)
- Error tracking → Sentry
- Metrics → Prometheus + Grafana or Datadog
- Uptime checks & alerts (PagerDuty / OpsGenie)

---

## 11. Next steps (practical)

1. Create a minimal Docker Compose for local dev (Postgres, Redis, MinIO).
2. Scaffold NestJS modules (auth, course, lesson, progress, payment, quiz).
3. Scaffold Next.js pages for student/instructor flows and presigned upload UI.
4. Implement unit tests for critical flows (auth, payments webhook, progress marking).
5. Deploy MVP to a small cloud environment and test with Beta users.

---

If you want, I can also:

- Produce a downloadable PNG/SVG ERD or sequence diagrams.
- Generate the Docker Compose + starter NestJS modules.
- Create the exact DB migration SQL for the full schema.

Tell me which one you want next and I’ll create it.
