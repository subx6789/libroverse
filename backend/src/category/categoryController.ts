import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import categoryModel from "./categoryModel";
import userModel from "../user/userModel";
import { AuthRequest } from "../middlewares/authenticate";

/**
 * Utility to convert text like "science fiction" to Title Case "Science Fiction"
 */
const toTitleCase = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Create a new Category (Admin Only)
 */
const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return next(createHttpError(400, "Category name is required"));
  }

  try {
    const _req = req as AuthRequest;
    const user = await userModel.findById(_req.userId);
    if (user?.role !== "admin") {
      return next(createHttpError(403, "Only administrators can create categories"));
    }

    const formattedName = toTitleCase(name);
    const normalizedKey = formattedName.toLowerCase().replace(/[^a-z0-9]/g, "");

    // 1. Strict Case-Insensitive & Whitespace Collapsed Regex Check
    const existing = await categoryModel.findOne({
      name: { $regex: new RegExp(`^\\s*${formattedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i") },
    });

    if (existing) {
      return next(createHttpError(409, `Category "${existing.name}" already exists`));
    }

    // 2. Normalized alphanumeric check to prevent variations like "Sci-Fi" vs "Sci Fi" or "Self-Help" vs "Self Help"
    const allCategories = await categoryModel.find({}, "name");
    const duplicateNormalized = allCategories.find((cat) => {
      const catKey = cat.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      return catKey === normalizedKey;
    });

    if (duplicateNormalized) {
      return next(
        createHttpError(
          409,
          `A similar category "${duplicateNormalized.name}" already exists. Please avoid duplicate variations.`
        )
      );
    }

    const category = await categoryModel.create({ name: formattedName });
    res.status(201).json(category);
  } catch (err: any) {
    next(createHttpError(500, err?.message || "Error creating category"));
  }
};

/**
 * List all categories (Public)
 */
const listCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let categories = await categoryModel.find().sort({ name: 1 });

    // Auto-seed initial default categories if database is fresh
    if (categories.length === 0) {
      const defaults = [
        "Computer Science",
        "Software Engineering",
        "Technology & AI",
        "Business & Startups",
        "Self Improvement",
        "Science Fiction",
      ];
      await categoryModel.insertMany(defaults.map((name) => ({ name })));
      categories = await categoryModel.find().sort({ name: 1 });
    }

    res.json(categories);
  } catch (err: any) {
    next(createHttpError(500, "Error fetching categories"));
  }
};

/**
 * Delete a category (Admin Only)
 */
const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { categoryId } = req.params;

  try {
    const _req = req as AuthRequest;
    const user = await userModel.findById(_req.userId);
    if (user?.role !== "admin") {
      return next(createHttpError(403, "Only administrators can delete categories"));
    }

    const deleted = await categoryModel.findByIdAndDelete(categoryId);
    if (!deleted) {
      return next(createHttpError(404, "Category not found"));
    }

    res.sendStatus(204);
  } catch (err: any) {
    next(createHttpError(500, "Error deleting category"));
  }
};

export { createCategory, listCategories, deleteCategory, toTitleCase };
