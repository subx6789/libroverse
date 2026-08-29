import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import createHttpError from "http-errors";

/**
 * Express middleware to validate request body, query, or params against a strict Zod schema.
 * Rejects invalid data early before reaching business logic.
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues
          .map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`)
          .join("; ");
        return next(createHttpError(400, `Validation error: ${errorMessages}`));
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues
          .map((issue) => `${issue.path.join(".") || "param"}: ${issue.message}`)
          .join("; ");
        return next(createHttpError(400, `Query validation error: ${errorMessages}`));
      }
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues
          .map((issue) => `${issue.path.join(".") || "param"}: ${issue.message}`)
          .join("; ");
        return next(createHttpError(400, `Path parameter validation error: ${errorMessages}`));
      }
      next(error);
    }
  };
};
