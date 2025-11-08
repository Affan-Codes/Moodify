import z from "zod";

export const createSessionSchema = z.object({
  body: z.object({}).optional(),
});

export const sendMessageSchema = z.object({
  params: z.object({
    sessionId: z.uuid("Invalid session ID format"),
  }),
  body: z.object({
    message: z
      .string()
      .min(1, "Message cannot be empty")
      .max(5000, "Message too long (max 5000 characters)")
      .trim()
      .refine(
        (msg) => msg.replace(/\s/g, "").length > 0,
        "Message cannot be only whitespace"
      ),
  }),
});

export const getMessageStatusSchema = z.object({
  params: z.object({
    sessionId: z.uuid("Invalid session ID format"),

    messageIndex: z
      .string()
      .regex(/^\d+$/, "Message index must be a number")
      .transform(Number)
      .refine((n) => n >= 0, "Message index must be non-negative"),
  }),
});

export const getChatHistorySchema = z.object({
  params: z.object({
    sessionId: z.uuid("Invalid session ID format"),
  }),
  query: z
    .object({
      limit: z
        .string()
        .optional()
        .default("50")
        .transform(Number)
        .refine((n) => n > 0 && n <= 100, "Limit must be between 1 and 100"),

      skip: z
        .string()
        .optional()
        .default("0")
        .transform(Number)
        .refine((n) => n >= 0, "Skip must be non-negative"),
    })
    .optional(),
});
