import { z } from "zod";

const activityTypes = [
  "meditation",
  "exercise",
  "walking",
  "reading",
  "journaling",
  "therapy",
] as const;

const difficultyLevels = ["easy", "medium", "hard"] as const;

export const logActivitySchema = z.object({
  body: z.object({
    type: z.enum(activityTypes, {
      error: () => ({
        message: `Type must be one of: ${activityTypes.join(", ")}`,
      }),
    }),

    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name too long (max 100 characters)")
      .trim(),

    description: z
      .string()
      .max(500, "Description too long (max 500 characters)")
      .trim()
      .optional(),

    duration: z
      .number()
      .min(0, "Duration must be non-negative")
      .max(1440, "Duration cannot exceed 24 hours (1440 minutes)")
      .optional(),

    difficulty: z.enum(difficultyLevels, {
      error: () => ({
        message: `Difficulty must be one of: ${difficultyLevels.join(", ")}`,
      }),
    }),

    feedback: z
      .string()
      .max(1000, "Feedback too long (max 1000 characters)")
      .trim()
      .optional(),
  }),
});
