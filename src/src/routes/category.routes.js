import { Router } from "express";
import { authRequired, adminRequired } from "../middlewares/auth.middleware.js";

import {
  getCategoryByID,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
} from "../controllers/category.controller.js";
import { validateSchema } from "../middlewares/validationSchemas.middleware.js";
import { createCategorySchema, updateCategorySchema } from "../schemas/categorySchema.js";

const router = Router();

// Listar todas
router.get("/categories", getCategory);

// Buscar por ID
router.get(
  "/categories/id/:id",
  [authRequired, adminRequired],
  getCategoryByID
); //LUego sacar el fragmento de la url "/id".

// Buscar por slug
router.get(
  "/categories/slug/:slug",
  [authRequired, adminRequired],
  getCategoryBySlug
);

// Crear categoria
router.post(
  "/categories",
  [authRequired, adminRequired], validateSchema(createCategorySchema),
  createCategory
);

// Actualizar categoria
router.put(
  "/categories/:id",
  [authRequired,adminRequired], validateSchema(updateCategorySchema),
  updateCategory
);

// Eliminar categoria
router.delete("/categories/:id", [authRequired, adminRequired], deleteCategory);

export default router;
