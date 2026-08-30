import express from "express";
import { createCategory, listCategories, deleteCategory } from "./categoryController";
import authenticate from "../middlewares/authenticate";
import { validateBody, validateParams } from "../middlewares/validate";
import { createCategorySchema, categoryIdParamSchema } from "../schemas/validationSchemas";
import { publicRateLimiter, userRateLimiter } from "../middlewares/rateLimiter";

const categoryRouter = express.Router();

categoryRouter.get("/", publicRateLimiter, listCategories);
categoryRouter.post("/", authenticate, userRateLimiter, validateBody(createCategorySchema), createCategory);
categoryRouter.delete("/:categoryId", authenticate, userRateLimiter, validateParams(categoryIdParamSchema), deleteCategory);

export default categoryRouter;
