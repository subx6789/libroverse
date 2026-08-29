import { z } from "zod";

// MongoDB ObjectId Regex (24 hex characters)
export const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const objectIdSchema = z
  .string()
  .regex(objectIdRegex, "Must be a valid 24-character hexadecimal ObjectId");

// ==========================================
// 1. User & Authentication Schemas
// ==========================================
export const registerUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .trim(),
  email: z
    .string()
    .email("Invalid email format")
    .max(100, "Email cannot exceed 100 characters")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters"),
});

export const loginUserSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .trim()
    .optional(),
  username: z
    .string()
    .min(3, "Username must be 3-30 characters")
    .max(30, "Username must be 3-30 characters")
    .regex(/^[a-z0-9-_]+$/, "Username can only contain letters, numbers, hyphens, and underscores")
    .toLowerCase()
    .trim()
    .optional(),
  bio: z
    .string()
    .max(300, "Bio cannot exceed 300 characters")
    .trim()
    .optional(),
});

export const checkUsernameQuerySchema = z.object({
  username: z
    .string()
    .min(1, "Username query is required")
    .max(30, "Username too long")
    .trim(),
});

export const userSearchQuerySchema = z.object({
  q: z.string().max(100, "Search query too long").optional(),
});

export const toggleBanSchema = z.object({
  reason: z.string().max(200, "Ban reason cannot exceed 200 characters").optional(),
});

// ==========================================
// 2. Book Schemas
// ==========================================
export const createBookSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(150, "Title cannot exceed 150 characters")
    .trim(),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters")
    .max(3000, "Description cannot exceed 3000 characters")
    .trim(),
  genre: z
    .string()
    .min(1, "Category/Genre is required")
    .max(50, "Genre cannot exceed 50 characters")
    .trim(),
  authorNames: z.union([z.string(), z.array(z.string())]).optional(),
});

export const updateBookSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(150, "Title cannot exceed 150 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters")
    .max(3000, "Description cannot exceed 3000 characters")
    .trim()
    .optional(),
  genre: z
    .string()
    .min(1, "Category/Genre is required")
    .max(50, "Genre cannot exceed 50 characters")
    .trim()
    .optional(),
  authorNames: z.union([z.string(), z.array(z.string())]).optional(),
});

// ==========================================
// 3. Community Post Schemas
// ==========================================
export const createPostSchema = z.object({
  title: z.string().max(120, "Title cannot exceed 120 characters").trim().optional(),
  content: z
    .string()
    .min(1, "Post content is required")
    .max(500, "Post content cannot exceed 500 characters")
    .trim(),
  topic: z.string().max(60, "Topic too long").optional(),
  ebook_id: z.string().regex(objectIdRegex, "Invalid eBook ID").optional().or(z.literal("")),
});

export const updatePostSchema = z.object({
  title: z.string().max(120, "Title cannot exceed 120 characters").trim().optional(),
  content: z
    .string()
    .min(1, "Post content is required")
    .max(500, "Post content cannot exceed 500 characters")
    .trim(),
  topic: z.string().max(60, "Topic too long").optional(),
  removeMedia: z.union([z.boolean(), z.literal("true"), z.literal("false")]).optional(),
});

export const addCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment text is required")
    .max(300, "Comment cannot exceed 300 characters")
    .trim(),
});

// ==========================================
// 4. Category Schemas
// ==========================================
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(50, "Category name cannot exceed 50 characters")
    .trim(),
  description: z.string().max(300, "Description cannot exceed 300 characters").trim().optional(),
});

// ==========================================
// 5. Param Schemas
// ==========================================
export const bookIdParamSchema = z.object({
  bookId: objectIdSchema,
});

export const postIdParamSchema = z.object({
  postId: objectIdSchema,
});

export const userIdParamSchema = z.object({
  userId: objectIdSchema,
});

export const categoryIdParamSchema = z.object({
  categoryId: objectIdSchema,
});
