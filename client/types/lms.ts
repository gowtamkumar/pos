export type UserRole = 'Admin' | 'Student';
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role?: UserRole;
  roles: UserRole[];
  status?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  created_at?: string;
}

export interface CourseSection {
  id: string;
  courseId: string;
  title: string;
  position: number;
  created_at?: string;
}

export interface Course {
  id: string;
  slug?: string;
  title: string;
  subtitle?: string;
  description: string;
  price: number;
  discountPrice?: number;
  level?: CourseLevel;
  language?: string;
  learningOutcomes?: string[];
  requirements?: string[];
  averageRating?: number;
  reviewCount?: number;
  status: 'Draft' | 'Published' | 'Rejected';
  instructorId: string;
  instructor?: Partial<User>;
  categoryId?: string;
  category?: Category;
  thumbnailUrl?: string;
  created_at?: string;
  sections?: CourseSection[];
  lessons?: Lesson[];
  recentReviews?: CourseReview[];
}

export interface Lesson {
  id: string;
  courseId: string;
  sectionId?: string;
  title: string;
  content_type: 'video' | 'text' | 'quiz';
  content_url?: string;
  durationSeconds?: number;
  isFreePreview?: boolean;
  position: number;
  created_at?: string;
}

export interface CourseReview {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
}

export interface QuizOption {
  id?: number;
  option_text: string;
  is_correct: boolean;
}

export interface QuizQuestion {
  id?: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: QuizOption[];
}

export interface Quiz {
  id: number;
  lessonId: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: number;
  quizId: number;
  quizTitle?: string;
  score: number;
  passed: boolean;
  completedAt?: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolled_at: string;
  user?: User;
  course?: Course;
}

export interface Payment {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'paid' | 'failed';
  created_at: string;
  user?: User;
  course?: Course;
}

export interface SearchResult {
  courses: Array<{
    id: string;
    slug?: string;
    title: string;
    description: string;
    price: number;
    thumbnailUrl?: string;
    instructorName: string;
    categoryName: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  instructors: Array<{
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    roles: UserRole[];
  }>;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}
