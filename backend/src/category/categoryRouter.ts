import express from "express";
import { createCategory, listCategories, deleteCategory } from "./categoryController";
import authenticate from "../middlewares/authenticate";
import { validateBody, validateParams } from "../middlewares/validate";
import { createCategorySchema, categoryIdParamSchema } from "../schemas/validationSchemas";

const categoryRouter = express.Router();

categoryRouter.get("/", listCategories);
categoryRouter.post("/", authenticate, validateBody(createCategorySchema), createCategory);
categoryRouter.delete("/:categoryId", authenticate, validateParams(categoryIdParamSchema), deleteCategory);

export default categoryRouter;
