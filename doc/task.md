# LMS MVP Implementation Tasks

This task checklist lists the structural and functional updates required to implement the LMS MVP based on the [System Design Document](file:///home/gowtamkumar/projects/lms/doc/system-design.md).

## Completed Backend Foundations
- `[x]` Authentication Module
  - `[x]` JWT and Local Passport authentication strategies implemented
  - `[x]` User registration, login, logout, and token refresh endpoints active
  - `[x]` Secured `@CurrentUser()` custom parameter decorator active
- `[x]` File Upload & Document API
  - `[x]` Local Multer disk storage uploads to `public/uploads` active
  - `[x]` PDFKit utility for report/document generation active
- `[x]` User Management Module
  - `[x]` Service queries and controller endpoints active for listing, updating, and deleting users
- `[x]` Categories Module
  - `[x]` Hierarchical self-referential category mapping active in database and service operations

## Phase 1: Foundation & Database Setup
- `[x]` Wire up isolated modules to the main NestJS application
  - `[x]` Import `CoursesModule` in `server/src/app.module.ts`
  - `[x]` Import `LessonsModule` in `server/src/app.module.ts`
  - `[x]` Import `EnrollmentsModule` in `server/src/app.module.ts`
  - `[x]` Import `ProgressModule` in `server/src/app.module.ts`
  - `[x]` Import `AssignmentModule` in `server/src/app.module.ts`
  - `[x]` Import `PaymentsModule` in `server/src/app.module.ts`
- `[x]` Correct database constraints & entities
  - `[x]` Fix `@Unique(['user', 'lesson'])` in `progress.entity.ts` to reference `userId` and `lessonId`
  - `[x]` Setup relationships in `Course` entity (linked to `UserEntity` and `Category`)
  - `[x]` Setup relationships in `Lesson` entity (linked to parent lesson and `Course`)
  - `[x]` Setup relationships in `Enrollment` entity (linked to `UserEntity` and `Course`)
  - `[x]` Setup relationships in `Progress` entity (linked to `UserEntity` and `Lesson`)
  - `[x]` Setup relationships in `Assignment` entity (linked to `Course`)
  - `[x]` Setup relationships in `Payment` entity (linked to `UserEntity` and `Course`)

## Phase 2: Core Service Implementation (NestJS)
- `[x]` Course Management API
  - `[x]` Implement CRUD repository methods in `CoursesService`
  - `[x]` Secure Course routes with roles (`Admin`, `Instructor`) and JWT guard
- `[x]` Lesson Management API
  - `[x]` Implement lesson creation and ordering in `LessonsService`
  - `[x]` Implement video URL validation and content-type parsing
- `[x]` Enrollment API
  - `[x]` Implement direct free-course enrollment in `EnrollmentsService`
  - `[x]` Implement checking of enrollment status before viewing lessons
- `[x]` Student Progress Tracking API
  - `[x]` Implement marking lessons as complete
  - `[x]` Implement SQL calculation query for progress percentage per course
- `[x]` Assignment API
  - `[x]` Implement assignment creation for instructors
  - `[x]` Implement assignment file submissions for students
- `[x]` Admin Management API
  - `[x]` Implement Category creation, update, and deletion in `CategoriesService` (Basic CRUD is complete; role-based guards mapped)
  - `[x]` Implement user administration in `UserService` (List, search, filter, update, and deletion service methods and endpoints are complete; role-based guards mapped)
  - `[x]` Implement course review/approval workflow in `CoursesService` (transition status to published, or reject with feedback)
  - `[x]` Implement financial audit log listing in `PaymentsService` (view all user transactions)

## Phase 3: Integrations (Payments & Cloud Uploads)
- `[x]` Payment Integration
  - `[x]` Configure Stripe Node SDK with environment variables
  - `[x]` Implement `/api/v1/payments/checkout` to build Stripe session URL
  - `[x]` Implement raw-body parser for `/api/v1/payments/webhook` signature validation
  - `[x]` Implement automated enrollment trigger upon `checkout.session.completed` event
- `[x]` Object Cloud Storage
  - `[x]` Configure AWS SDK for S3 or local MinIO
  - `[x]` Update `FilesService` to handle S3 presigned URLs for large file/video uploads

## Phase 4: Next.js Frontend Development

This phase covers building the Next.js 15 App Router client app, styling with Tailwind CSS v4, and binding with the NestJS API endpoints.

- `[x]` Foundation & Common Setup
  - `[x]` Configure global styling in [globals.css](file:///home/gowtamkumar/projects/lms/client/app/globals.css) with CSS variables, Outfit/Inter typography, and Tailwind v4 themes.
  - `[x]` Create API client wrapper using Axios/Fetch with request/response interceptors to handle automatic JWT rotation via `/auth/refresh`.
  - `[x]` Build core layout shell including global Navbar (dynamic navigation depending on authentication), Footer, and Toast notifications system.
- `[x]` Authentication & User Profiles
  - `[x]` Build Register page with form validations, email check, and Student vs. Instructor role selection.
  - `[x]` Build Login page with cookie-based session management, token persistence, and redirect logic.
  - `[x]` Build Profile page showing current user account details, role badges, and editable contact info.
- `[x]` Student Portal & Learning Path
  - `[x]` Build public Course Directory page featuring instant category filters, search input, and course cards.
  - `[x]` Build Course Overview page showing course outline, curriculum accordion, author profile, pricing, and enroll/buy buttons.
  - `[x]` Implement Stripe checkout redirect handler on "Buy Now" button.
  - `[x]` Build Workspace Learning Dashboard:
    - `[x]` Video viewer (integrating NestJS presigned video URL player).
    - `[x]` Content module sidebar index with completion checkmarks.
    - `[x]` Real-time course progress indicator (fetching percentage calculations from progress API).
    - `[x]` Assignments panel: list homeworks, show due dates, download materials, and submit files directly to MinIO.
- `[x]` Instructor Studio
  - `[x]` Build Instructor Dashboard listing owned courses, total students count, and simple revenue charts.
  - `[x]` Build Course Creator wizard: DND interface to organize chapters, modules, and lessons.
  - `[x]` Build Lesson editor: form fields for text content, MinIO file upload progress bar, and content-type select (video, text, quiz).
  - `[x]` Build Assignment builder: add titles, specifications, due dates, and PDF attachments.
- `[x]` Admin Dashboard Panels
  - `[x]` Build User Administrator board: data-grid of users, search bar, deactivate toggle, role selector, and delete buttons.
  - `[x]` Build Category Taxonomy manager: tree view editor to add/edit/remove hierarchical categories.
  - `[x]` Build QA Review Queue: screen to inspect instructor draft courses, preview videos, and approve (publish) or reject (with feedback notes).
  - `[x]` Build Financial Audit Grid: list payments, filter by transaction ID, and inspect purchase receipt details.
