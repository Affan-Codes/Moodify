import z from "zod";

export const createMoodSchema = z.object({
  body: z.object({
    score: z
      .number()
      .min(0, "Score must be at least 0")
      .max(100, "Score must not exceed 100")
      .int("Score must be a whole number"),

    note: z
      .string()
      .max(500, "Note too long (max 500 characters)")
      .trim()
      .optional(),

    context: z
      .string()
      .max(200, "Context too long (max 200 characters)")
      .trim()
      .optional(),

    activities: z
      .array(
        z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid activity ID format")
      )
      .max(10, "Too many activities (max 10)")
      .optional()
      .default([]),
  }),
});
