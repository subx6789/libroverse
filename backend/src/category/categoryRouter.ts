import express from "express";
import { createCategory, listCategories, deleteCategory } from "./categoryController";
import authenticate from "../middlewares/authenticate";

const categoryRouter = express.Router();

categoryRouter.get("/", listCategories);
categoryRouter.post("/", authenticate, createCategory);
categoryRouter.delete("/:categoryId", authenticate, deleteCategory);

export default categoryRouter;
