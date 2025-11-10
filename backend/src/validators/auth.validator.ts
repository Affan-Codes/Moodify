import z from "zod";
import { validatePasswordStrength } from "../utils/commonPasswords";

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must not exceed 50 characters")
      .trim()
      .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
    email: z
      .email("Invalid email address")
      .toLowerCase()
      .trim()
      .max(100, "Email too long"),
    password: z.string().superRefine((password, ctx) => {
      const validation = validatePasswordStrength(password);

      if (!validation.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: validation.error || "Password is invalid",
        });
      }
    }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email("Invalid email address").toLowerCase().trim(),

    password: z.string().min(1, "Password is required"),
  }),
});
