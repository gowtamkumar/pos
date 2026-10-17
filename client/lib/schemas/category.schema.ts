import { z } from "zod";

export const categoryCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters"),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
