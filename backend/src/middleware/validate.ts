import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { logger } from "../utils/logger";

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and transform request data
      const validated = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as any;

      // Replace request data with validated/transformed data
      if (validated.body !== undefined) {
        req.body = validated.body;
      }
      if (validated.query !== undefined) {
        req.query = validated.query;
      }
      if (validated.params !== undefined) {
        req.params = validated.params;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors nicely
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        logger.warn("Validation failed:", {
          path: req.path,
          method: req.method,
          errors,
        });

        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      // Unexpected error
      logger.error("Validation middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};
