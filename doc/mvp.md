doc: https://chatgpt.com/share/6895e892-3170-8010-88e7-6701bdddae60

2️⃣ MVP Core Workflow (How it works step-by-step)

Step 1: Authentication & Roles
Users can sign up and log in.

    Role is assigned:

    Admin (full control)

    Instructor (can create/manage their own courses)

    Student (can enroll and learn)

    Use JWT authentication to protect routes.

Step 2: Course Creation
Instructor dashboard → “Create Course” form:
Title
Short description
Price (or free)
Cover image
Save course as Draft.
Admin can approve & publish.

Step 3: Lessons
Each course has lessons:
Lesson title
Video or text content
Optional attachment (PDF, doc)
Upload media to S3 (or similar) and store link in DB.

Step 4: Course Catalog
Public course list (search & filter by category, price).
Clicking a course → Course detail page (title, description, curriculum preview, price).

Step 5: Enrollment
Free course → enroll instantly.
Paid course → integrate Stripe Checkout.
Once enrolled → student sees course in My Courses dashboard.

Step 6: Learning
Inside a course:
See list of lessons.
Click a lesson → watch video/read text.
Mark lesson as complete → progress saved in DB.

Step 7: Progress Tracking
Student dashboard → shows:
List of enrolled courses
Progress % for each course

Step 8: Admin Panel
Admin can:
See all users & courses
Approve/reject courses
Remove users
View enrollments

3️⃣ MVP Database Entities (minimum)
users → id, name, email, password_hash, role

courses → id, title, description, price, status (draft/published), instructor_id

lessons → id, course_id, title, content_url, content_type, position

enrollments → id, user_id, course_id, created_at

progress → id, user_id, lesson_id, completed_at

4️⃣ MVP Pages (minimum)
Landing page — course catalog + login/signup links

Login / Signup

Student dashboard — enrolled courses, progress

Course detail page — description + enroll button

Lesson player page — video/text + mark complete

Instructor dashboard — create/manage courses & lessons

Admin dashboard — manage users & courses

5️⃣ MVP API Endpoints
Auth:

POST /auth/register

POST /auth/login

GET /auth/me

Courses:

GET /courses — public catalog

GET /courses/:id — course detail

POST /courses — instructor create course

PATCH /courses/:id — update course

Lessons:

POST /courses/:id/lessons — add lesson

GET /courses/:id/lessons — get lessons for a course

Enrollments:

POST /courses/:id/enroll

GET /users/:id/enrollments

Progress:

POST /lessons/:id/complete

GET /users/:id/progress

6️⃣ MVP User Journey Example
Instructor:

Logs in → Dashboard → Create Course

Adds lessons

Submits course for publish

Students enroll and start learning

Student:

Browses catalog

Enrolls in a free/paid course

Watches lessons → marks complete

Sees progress in dashboard

Admin:

Approves courses

Manages users
