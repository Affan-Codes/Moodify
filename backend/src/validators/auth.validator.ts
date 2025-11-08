import z from "zod";

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
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password too long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[@$!%*?&#]/,
        "Password must contain at least one special character (@$!%*?&#)"
      ),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email("Invalid email address").toLowerCase().trim(),

    password: z.string().min(1, "Password is required"),
  }),
});
